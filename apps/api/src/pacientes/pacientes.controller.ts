import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { AuthenticatedRequest, JwtAuthGuard } from '../auth';
import { PacienteResponseDto } from './dto';
import { PacientesService } from './pacientes.service';

/**
 * Controlador REST de pacientes (listado mínimo para filtros).
 */
@ApiTags('pacientes')
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Lista todos los pacientes.
   *
   * @returns Pacientes del sistema.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Listar pacientes' })
  @ApiResponse({ status: 200, type: [PacienteResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  list(@Req() _req: AuthenticatedRequest): Promise<PacienteResponseDto[]> {
    return this.pacientesService.findAll();
  }
}
