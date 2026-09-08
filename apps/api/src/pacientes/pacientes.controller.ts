import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
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
import { JwtAuthGuard } from '../auth';
import {
  ListPacientesQueryDto,
  PacienteDetalleResponseDto,
  PacienteResponseDto,
} from './dto';
import { PacientesService } from './pacientes.service';

/**
 * Controlador REST de pacientes (búsqueda e hidratación para filtros).
 */
@ApiTags('pacientes')
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Busca pacientes por nombre/apellido o por documento exacto.
   *
   * @param query - `q` (filtro) o `documento` (lookup de formulario).
   * @returns Lista mínima, un detalle con contacto, o null si el documento no existe.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({
    summary: 'Buscar pacientes por nombre/apellido o por documento',
  })
  @ApiResponse({ status: 200, type: [PacienteResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  list(
    @Query() query: ListPacientesQueryDto,
  ): Promise<PacienteResponseDto[] | PacienteDetalleResponseDto | null> {
    if (query.documento !== undefined) {
      return this.pacientesService.findByDocumento(query.documento);
    }
    return this.pacientesService.search(query.q);
  }

  /**
   * Obtiene un paciente por id.
   *
   * @param id - UUID del paciente.
   * @returns Paciente mínimo para hidratar el filtro.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Obtener paciente por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: PacienteResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PacienteResponseDto> {
    return this.pacientesService.findById(id);
  }
}
