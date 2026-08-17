import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth';
import { EspecialidadResponseDto } from './dto';
import { EspecialidadesService } from './especialidades.service';

/**
 * Controlador REST de especialidades (listado mínimo para filtros).
 */
@ApiTags('especialidades')
@Controller('especialidades')
export class EspecialidadesController {
  constructor(private readonly especialidadesService: EspecialidadesService) {}

  /**
   * Lista todas las especialidades.
   *
   * @returns Catálogo de especialidades.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Listar especialidades' })
  @ApiResponse({ status: 200, type: [EspecialidadResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  list(@Req() _req: AuthenticatedRequest): Promise<EspecialidadResponseDto[]> {
    return this.especialidadesService.findAll();
  }
}
