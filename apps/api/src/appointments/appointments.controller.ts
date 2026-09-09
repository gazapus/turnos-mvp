import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { AppointmentsService } from './appointments.service';
import {
  ListTurnosQueryDto,
  PrimeraVezQueryDto,
  PrimeraVezResponseDto,
  TurnoDetalleResponseDto,
  TurnosListResponseDto,
  UpsertTurnoDto,
  CancelarTurnoDto,
} from './dto';

/**
 * Controlador REST de turnos (listado, detalle y escritura).
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
    return this.appointmentsService.listTurnos(query, this.requireUser(req));
  }

  /**
   * Indica si el paciente es primera vez con el médico.
   *
   * @param query - Par paciente+médico.
   * @returns Flag de primera vez.
   */
  @Get('primera-vez')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Consultar si es primer turno con el médico' })
  @ApiResponse({ status: 200, type: PrimeraVezResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  primeraVez(
    @Query() query: PrimeraVezQueryDto,
  ): Promise<PrimeraVezResponseDto> {
    return this.appointmentsService.isPrimeraVez(query);
  }

  /**
   * Detalle de un turno para el popup.
   *
   * @param id - UUID del turno.
   * @param req - Request autenticada.
   * @returns DTO de detalle.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Obtener detalle de turno' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TurnoDetalleResponseDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Header('Pragma', 'no-cache')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnoDetalleResponseDto> {
    return this.appointmentsService.findById(id, this.requireUser(req));
  }

  /**
   * Alta de turno (y paciente nuevo si corresponde).
   *
   * @param dto - Datos de alta.
   * @param req - Request autenticada.
   * @returns Detalle creado.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Crear turno' })
  @ApiResponse({ status: 201, type: TurnoDetalleResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso de escritura' })
  create(
    @Body() dto: UpsertTurnoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnoDetalleResponseDto> {
    return this.appointmentsService.createTurno(dto, this.requireUser(req));
  }

  /**
   * Confirma un turno PROGRAMADO del día de hoy.
   *
   * @param id - UUID del turno.
   * @param req - Request autenticada.
   * @returns Detalle confirmado.
   */
  @Patch(':id/confirmar')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Confirmar turno' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TurnoDetalleResponseDto })
  @ApiResponse({ status: 400, description: 'Estado o día inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso de escritura' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  confirmar(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnoDetalleResponseDto> {
    return this.appointmentsService.confirmarTurno(id, this.requireUser(req));
  }

  /**
   * Cancela un turno PROGRAMADO o CONFIRMADO.
   *
   * @param id - UUID del turno.
   * @param dto - Motivo opcional.
   * @param req - Request autenticada.
   * @returns Detalle cancelado.
   */
  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Cancelar turno' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TurnoDetalleResponseDto })
  @ApiResponse({ status: 400, description: 'Estado inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso de escritura' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarTurnoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnoDetalleResponseDto> {
    return this.appointmentsService.cancelarTurno(
      id,
      dto,
      this.requireUser(req),
    );
  }

  /**
   * Edición de un turno programado.
   *
   * @param id - UUID del turno.
   * @param dto - Datos de edición.
   * @param req - Request autenticada.
   * @returns Detalle actualizado.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Editar turno' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, type: TurnoDetalleResponseDto })
  @ApiResponse({ status: 400, description: 'Datos o estado inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permiso de escritura' })
  @ApiResponse({ status: 404, description: 'Turno no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpsertTurnoDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<TurnoDetalleResponseDto> {
    return this.appointmentsService.updateTurno(id, dto, this.requireUser(req));
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
