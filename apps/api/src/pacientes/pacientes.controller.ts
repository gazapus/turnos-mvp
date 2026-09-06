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
import { ListPacientesQueryDto, PacienteResponseDto } from './dto';
import { PacientesService } from './pacientes.service';

/**
 * Controlador REST de pacientes (búsqueda e hidratación para filtros).
 */
@ApiTags('pacientes')
@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  /**
   * Busca pacientes por nombre o apellido.
   *
   * @param query - Texto de búsqueda.
   * @returns Coincidencias (vacío si `q` tiene menos de 3 caracteres).
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Buscar pacientes por nombre o apellido' })
  @ApiResponse({ status: 200, type: [PacienteResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  list(@Query() query: ListPacientesQueryDto): Promise<PacienteResponseDto[]> {
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
