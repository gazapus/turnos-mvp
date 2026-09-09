import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { AuthenticatedRequest, JwtAuthGuard, type JwtPayload } from '../auth';
import { ConsultoriosService } from './consultorios.service';
import { AsignarConsultorioDto, ConsultorioResponseDto } from './dto';

/**
 * Controlador REST del catálogo y asignación de consultorios.
 */
@ApiTags('consultorios')
@Controller('consultorios')
export class ConsultoriosController {
  constructor(private readonly consultoriosService: ConsultoriosService) {}

  /**
   * Lista el catálogo completo de consultorios.
   *
   * @param req - Request autenticada.
   * @returns Consultorios ordenados por número.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Listar consultorios' })
  @ApiResponse({ status: 200, type: [ConsultorioResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  list(@Req() req: AuthenticatedRequest): Promise<ConsultorioResponseDto[]> {
    return this.consultoriosService.list(this.requireUser(req));
  }

  /**
   * Asigna o desasigna el médico de un consultorio.
   *
   * @param id - UUID del consultorio.
   * @param dto - Médico destino o null.
   * @param req - Request autenticada.
   * @returns Snapshot del catálogo.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Asignar médico a un consultorio' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: [ConsultorioResponseDto] })
  @ApiResponse({ status: 400, description: 'Médico inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @ApiResponse({ status: 404, description: 'Consultorio no encontrado' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AsignarConsultorioDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ConsultorioResponseDto[]> {
    return this.consultoriosService.assign(id, dto, this.requireUser(req));
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
