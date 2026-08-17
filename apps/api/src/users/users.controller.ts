import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { JwtAuthGuard } from '../auth';
import { ListUsuariosQueryDto, MedicoResponseDto } from './dto';
import { UsersService } from './users.service';

/**
 * Controlador REST de médicos (listado mínimo para filtros de agenda).
 */
@ApiTags('usuarios')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lista médicos activos para poblar el combo de filtro de agenda.
   *
   * @param _query - Query opcional (rol=MEDICO por compatibilidad con el cliente).
   * @returns Listado de médicos con id, nombre y apellido.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Listar médicos para filtros de agenda' })
  @ApiResponse({ status: 200, type: [MedicoResponseDto] })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  list(@Query() _query: ListUsuariosQueryDto): Promise<MedicoResponseDto[]> {
    return this.usersService.findAll();
  }
}
