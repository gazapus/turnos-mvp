import {
  Controller,
  Get,
  Header,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import type { Observable } from 'rxjs';
import { AuthenticatedRequest, JwtAuthGuard, type JwtPayload } from '../auth';
import { SalaEsperaSnapshotResponseDto } from './dto';
import { WaitingRoomEvents, type WaitingRoomSseEvent } from './waiting-room.events';
import { WaitingRoomService } from './waiting-room.service';

/**
 * Snapshot y stream SSE de avisos de sala de espera.
 */
@ApiTags('sala-espera')
@Controller('sala-espera')
export class WaitingRoomController {
  constructor(
    private readonly waitingRoomService: WaitingRoomService,
    private readonly waitingRoomEvents: WaitingRoomEvents,
  ) {}

  /**
   * Últimos llamados para hidratar el tablero.
   *
   * @param req - Request autenticada.
   * @returns Hasta 5 avisos.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Últimos avisos de sala de espera' })
  @ApiResponse({ status: 200, type: SalaEsperaSnapshotResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  snapshot(
    @Req() req: AuthenticatedRequest,
  ): Promise<SalaEsperaSnapshotResponseDto> {
    return this.waitingRoomService.snapshot(this.requireUser(req));
  }

  /**
   * Stream SSE de llamados nuevos.
   *
   * @param req - Request autenticada.
   * @returns Observable de eventos.
   */
  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Stream SSE de llamados' })
  @ApiResponse({ status: 200, description: 'text/event-stream' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  stream(@Req() req: AuthenticatedRequest): Observable<WaitingRoomSseEvent> {
    this.waitingRoomService.assertCanAccess(this.requireUser(req));
    return this.waitingRoomEvents.stream();
  }

  /**
   * Extrae el usuario del JWT o lanza 401.
   *
   * @param req - Request autenticada.
   * @returns Payload JWT.
   */
  private requireUser(req: AuthenticatedRequest): JwtPayload {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    return user;
  }
}
