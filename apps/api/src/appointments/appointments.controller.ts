import {
  Controller,
  Get,
  Header,
  Query,
  Req,
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
import { AuthenticatedRequest, JwtAuthGuard } from '../auth';
import { AppointmentsService } from './appointments.service';
import { ListTurnosQueryDto, TurnosListResponseDto } from './dto';

/**
 * Controlador REST de turnos (listado paginado).
 */
@ApiTags('turnos')
@Controller('turnos')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Lista turnos con paginación por cursor y filtros opcionales.
   *
   * @param query - Filtros y cursor.
   * @param req - Request autenticada.
   * @returns Página de turnos.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Listar turnos (paginación por cursor)' })
  @ApiResponse({ status: 200, type: TurnosListResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  list(
    @Query() query: ListTurnosQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnosListResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    return this.appointmentsService.listTurnos(query, user);
  }
}
