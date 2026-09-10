import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EstadoTurno,
  prisma,
  Prisma,
  RolUsuario,
  TipoTurno,
} from '@turnos/database';
import type { DireccionPaginacion } from '@turnos/shared-types';
import type { JwtPayload } from '../auth';
import {
  CANCELAR_TURNO_ESTADO_INVALIDO,
  CONFIRMAR_TURNO_SOLO_HOY,
  CONFIRMAR_TURNO_SOLO_PROGRAMADO,
  FINALIZAR_SIN_LLAMADO,
  FINALIZAR_TURNO_SOLO_CONFIRMADO,
  FINALIZAR_TURNO_SOLO_HOY,
  LLAMAR_SIN_CONSULTORIO,
  LLAMAR_TURNO_SOLO_CONFIRMADO,
  LLAMAR_TURNO_SOLO_HOY,
  CURSOR_NIL_UUID,
  clinicDayRangeFromYmd,
  formatClinicDate,
  isClinicDateBeforeToday,
  isClinicDateToday,
  normalizeDocumento,
  resolveTurnoDateRange,
  startOfClinicDay,
  UUID_V4_PATTERN,
} from './appointments.constants';
import {
  ListTurnosQueryDto,
  PrimeraVezQueryDto,
  PrimeraVezResponseDto,
  TurnoDetalleResponseDto,
  TurnoListItemResponseDto,
  TurnosListResponseDto,
  UpsertTurnoDto,
  CancelarTurnoDto,
} from './dto';
import { LlamadoSalaEsperaResponseDto, WaitingRoomEvents } from '../waiting-room';

const PAGE_SIZE = 30;

const TURNO_LIST_INCLUDE = {
  paciente: { select: { nombre: true, apellido: true } },
  medico: { select: { nombre: true, apellido: true } },
  especialidad: { select: { nombre: true } },
  _count: { select: { llamados: true } },
} as const;

const TURNO_DETALLE_INCLUDE = {
  paciente: true,
  medico: { select: { nombre: true, apellido: true } },
  especialidad: { select: { nombre: true } },
  _count: { select: { llamados: true } },
} as const;

type DecodedCursor = {
  fechaInicio: Date;
  id: string;
};

type TurnoListFilters = {
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  soloPendientes: boolean;
};

/**
 * Servicio de consulta de turnos con paginación por cursor.
 */
@Injectable()
export class AppointmentsService {
  constructor(private readonly waitingRoomEvents: WaitingRoomEvents) {}
  /**
   * Lista turnos paginados por cursor, con scoping por rol de médico.
   *
   * @param query - Filtros y cursor de paginación.
   * @param user - Payload JWT del usuario autenticado.
   * @returns Página de turnos con cursores opacos.
   */
  async listTurnos(
    query: ListTurnosQueryDto,
    user: JwtPayload,
  ): Promise<TurnosListResponseDto> {
    const filters = this.resolveFilters(query, user);

    if (query.fecha) {
      return this.fetchByDate(filters, query.fecha);
    }

    const direccion = query.direccion ?? 'siguiente';

    if (query.cursor) {
      const decoded = this.decodeCursor(query.cursor);
      return this.fetchPage(filters, decoded, direccion);
    }

    return this.fetchInitialPage(filters);
  }

  /**
   * Indica si el par paciente+médico no tiene turnos previos.
   *
   * @param query - IDs del par y turno a excluir en edición.
   * @returns `{ primeraVez }`.
   */
  async isPrimeraVez(
    query: PrimeraVezQueryDto,
  ): Promise<PrimeraVezResponseDto> {
    const where: Prisma.TurnoWhereInput = {
      pacienteId: query.pacienteId,
      medicoId: query.medicoId,
    };
    if (query.excluirTurnoId) {
      where.id = { not: query.excluirTurnoId };
    }
    const count = await prisma.turno.count({ where });
    const dto = new PrimeraVezResponseDto();
    dto.primeraVez = count === 0;
    return dto;
  }

  /**
   * Obtiene el detalle de un turno para el popup.
   *
   * @param id - UUID del turno.
   * @param user - Usuario autenticado.
   * @returns DTO de detalle.
   */
  async findById(
    id: string,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    const turno = await prisma.turno.findUnique({
      where: { id },
      include: TURNO_DETALLE_INCLUDE,
    });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    if (user.rol === RolUsuario.MEDICO && turno.medicoId !== user.sub) {
      throw new NotFoundException('Turno no encontrado');
    }
    return TurnoDetalleResponseDto.fromEntity(turno);
  }

  /**
   * Crea un turno y, si hace falta, el paciente, en una transacción.
   *
   * @param dto - Datos de alta.
   * @param user - Usuario autenticado.
   * @returns Detalle del turno creado.
   */
  async createTurno(
    dto: UpsertTurnoDto,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertCanWrite(user);
    this.assertFechaNotPast(dto.fecha);
    const range = this.requireDateRange(dto);

    const created = await prisma.$transaction(async (tx) => {
      const pacienteId = await this.resolvePacienteId(tx, dto);
      await this.assertMedicoEspecialidad(tx, dto.medicoId, dto.especialidadId);
      const tipo = await this.resolveTipoForCreate(tx, dto, pacienteId);
      const notificarMail = await this.resolveNotificarMail(
        tx,
        pacienteId,
        dto.notificarMail,
      );

      return tx.turno.create({
        data: {
          pacienteId,
          medicoId: dto.medicoId,
          especialidadId: dto.especialidadId,
          creadoPorId: user.sub,
          fechaInicio: range.start,
          fechaFin: range.end,
          tipo,
          estado: EstadoTurno.PROGRAMADO,
          notificarMail,
        },
        include: TURNO_DETALLE_INCLUDE,
      });
    });

    return TurnoDetalleResponseDto.fromEntity(created);
  }

  /**
   * Actualiza un turno PROGRAMADO con fecha ≥ hoy.
   *
   * @param id - UUID del turno.
   * @param dto - Datos de edición.
   * @param user - Usuario autenticado.
   * @returns Detalle actualizado.
   */
  async updateTurno(
    id: string,
    dto: UpsertTurnoDto,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertCanWrite(user);
    this.assertFechaNotPast(dto.fecha);
    const range = this.requireDateRange(dto);

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.turno.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Turno no encontrado');
      }
      if (existing.estado !== EstadoTurno.PROGRAMADO) {
        throw new BadRequestException(
          'Solo se pueden editar turnos en estado Programado',
        );
      }
      if (isClinicDateBeforeToday(formatClinicDate(existing.fechaInicio))) {
        throw new BadRequestException(
          'No se puede guardar un turno con fecha anterior a hoy',
        );
      }

      const pacienteId = await this.resolvePacienteId(tx, dto);
      await this.assertMedicoEspecialidad(tx, dto.medicoId, dto.especialidadId);
      const tipo = await this.resolveTipoForUpdate(
        tx,
        dto,
        pacienteId,
        existing.tipo,
        id,
      );
      const notificarMail = await this.resolveNotificarMail(
        tx,
        pacienteId,
        dto.notificarMail,
      );

      return tx.turno.update({
        where: { id },
        data: {
          pacienteId,
          medicoId: dto.medicoId,
          especialidadId: dto.especialidadId,
          fechaInicio: range.start,
          fechaFin: range.end,
          tipo,
          notificarMail,
        },
        include: TURNO_DETALLE_INCLUDE,
      });
    });

    return TurnoDetalleResponseDto.fromEntity(updated);
  }

  /**
   * Confirma un turno PROGRAMADO del día civil de hoy.
   *
   * @param id - UUID del turno.
   * @param user - Usuario autenticado.
   * @returns Detalle con estado CONFIRMADO.
   */
  async confirmarTurno(
    id: string,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertCanWrite(user);

    const today = formatClinicDate(new Date());
    const range = clinicDayRangeFromYmd(today);
    if (!range) {
      throw new BadRequestException(CONFIRMAR_TURNO_SOLO_HOY);
    }

    const updated = await prisma.turno.updateMany({
      where: {
        id,
        estado: EstadoTurno.PROGRAMADO,
        fechaInicio: { gte: range.start, lt: range.end },
      },
      data: { estado: EstadoTurno.CONFIRMADO },
    });

    if (updated.count === 0) {
      const existing = await prisma.turno.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Turno no encontrado');
      }
      if (existing.estado !== EstadoTurno.PROGRAMADO) {
        throw new BadRequestException(CONFIRMAR_TURNO_SOLO_PROGRAMADO);
      }
      if (!isClinicDateToday(formatClinicDate(existing.fechaInicio))) {
        throw new BadRequestException(CONFIRMAR_TURNO_SOLO_HOY);
      }
      throw new BadRequestException('No se pudo confirmar el turno');
    }

    const turno = await prisma.turno.findUnique({
      where: { id },
      include: TURNO_DETALLE_INCLUDE,
    });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    return TurnoDetalleResponseDto.fromEntity(turno);
  }

  /**
   * Cancela un turno PROGRAMADO o CONFIRMADO, con motivo opcional.
   *
   * @param id - UUID del turno.
   * @param dto - Motivo opcional.
   * @param user - Usuario autenticado.
   * @returns Detalle con estado CANCELADO.
   */
  async cancelarTurno(
    id: string,
    dto: CancelarTurnoDto | undefined,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertCanWrite(user);

    const motivo = this.normalizeMotivo(dto?.motivo);
    const updated = await prisma.turno.updateMany({
      where: {
        id,
        estado: {
          in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
        },
      },
      data: {
        estado: EstadoTurno.CANCELADO,
        motivoCancelacion: motivo,
      },
    });

    if (updated.count === 0) {
      const existing = await prisma.turno.findUnique({ where: { id } });
      if (!existing) {
        throw new NotFoundException('Turno no encontrado');
      }
      throw new BadRequestException(CANCELAR_TURNO_ESTADO_INVALIDO);
    }

    const turno = await prisma.turno.findUnique({
      where: { id },
      include: TURNO_DETALLE_INCLUDE,
    });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    return TurnoDetalleResponseDto.fromEntity(turno);
  }

  /**
   * Registra un llamado a sala de espera sin cambiar el estado del turno.
   *
   * @param id - UUID del turno.
   * @param user - Usuario autenticado.
   * @returns Detalle con `llamado` verdadero.
   */
  async llamarTurno(
    id: string,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertMedico(user);

    const turno = await prisma.turno.findUnique({
      where: { id },
      include: TURNO_DETALLE_INCLUDE,
    });
    if (!turno || turno.medicoId !== user.sub) {
      throw new NotFoundException('Turno no encontrado');
    }
    if (turno.estado !== EstadoTurno.CONFIRMADO) {
      throw new BadRequestException(LLAMAR_TURNO_SOLO_CONFIRMADO);
    }
    if (!isClinicDateToday(formatClinicDate(turno.fechaInicio))) {
      throw new BadRequestException(LLAMAR_TURNO_SOLO_HOY);
    }

    const consultorio = await prisma.consultorio.findUnique({
      where: { medicoId: turno.medicoId },
    });
    if (!consultorio) {
      throw new BadRequestException(LLAMAR_SIN_CONSULTORIO);
    }

    const llamado = await prisma.llamadoTurno.create({
      data: {
        turnoId: turno.id,
        pacienteNombre: turno.paciente.nombre,
        pacienteApellido: turno.paciente.apellido,
        consultorioNumero: consultorio.numero,
      },
    });

    this.waitingRoomEvents.emit(
      LlamadoSalaEsperaResponseDto.fromEntity(llamado),
    );

    return TurnoDetalleResponseDto.fromEntity({
      ...turno,
      _count: { llamados: turno._count.llamados + 1 },
    });
  }

  /**
   * Pasa un turno llamado de CONFIRMADO a ATENDIDO.
   *
   * @param id - UUID del turno.
   * @param user - Usuario autenticado.
   * @returns Detalle con estado ATENDIDO.
   */
  async finalizarTurno(
    id: string,
    user: JwtPayload,
  ): Promise<TurnoDetalleResponseDto> {
    this.assertMedico(user);

    const today = formatClinicDate(new Date());
    const range = clinicDayRangeFromYmd(today);
    if (!range) {
      throw new BadRequestException(FINALIZAR_TURNO_SOLO_HOY);
    }

    const existing = await prisma.turno.findUnique({
      where: { id },
      include: { _count: { select: { llamados: true } } },
    });
    if (!existing || existing.medicoId !== user.sub) {
      throw new NotFoundException('Turno no encontrado');
    }
    if (existing.estado !== EstadoTurno.CONFIRMADO) {
      throw new BadRequestException(FINALIZAR_TURNO_SOLO_CONFIRMADO);
    }
    if (!isClinicDateToday(formatClinicDate(existing.fechaInicio))) {
      throw new BadRequestException(FINALIZAR_TURNO_SOLO_HOY);
    }
    if (existing._count.llamados === 0) {
      throw new BadRequestException(FINALIZAR_SIN_LLAMADO);
    }

    const updated = await prisma.turno.updateMany({
      where: {
        id,
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: { gte: range.start, lt: range.end },
      },
      data: { estado: EstadoTurno.ATENDIDO },
    });
    if (updated.count === 0) {
      throw new BadRequestException(FINALIZAR_TURNO_SOLO_CONFIRMADO);
    }

    const turno = await prisma.turno.findUnique({
      where: { id },
      include: TURNO_DETALLE_INCLUDE,
    });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    return TurnoDetalleResponseDto.fromEntity(turno);
  }

  /**
   * Prohíbe escritura al rol médico.
   *
   * @param user - JWT.
   */
  private assertCanWrite(user: JwtPayload): void {
    if (user.rol === RolUsuario.MEDICO) {
      throw new ForbiddenException('No autorizado');
    }
  }

  /**
   * Exige rol médico para llamar o finalizar.
   *
   * @param user - JWT.
   */
  private assertMedico(user: JwtPayload): void {
    if (user.rol !== RolUsuario.MEDICO) {
      throw new ForbiddenException('No autorizado');
    }
  }

  /**
   * Normaliza el motivo: trim; vacío o ausente queda nulo.
   *
   * @param raw - Motivo ingresado.
   * @returns Motivo o null.
   */
  private normalizeMotivo(raw?: string): string | null {
    const trimmed = raw?.trim();
    return trimmed || null;
  }

  /**
   * Rechaza fechas civiles anteriores a hoy.
   *
   * @param fecha - YYYY-MM-DD.
   */
  private assertFechaNotPast(fecha: string): void {
    if (isClinicDateBeforeToday(fecha)) {
      throw new BadRequestException(
        'No se puede guardar un turno con fecha anterior a hoy',
      );
    }
  }

  /**
   * Convierte fecha y horas del DTO a instantes UTC.
   *
   * @param dto - Body de alta/edición.
   * @returns Rango inicio/fin.
   */
  private requireDateRange(dto: UpsertTurnoDto): { start: Date; end: Date } {
    const range = resolveTurnoDateRange(dto.fecha, dto.horaInicio, dto.horaFin);
    if (!range) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    }
    return range;
  }

  /**
   * Resuelve el paciente persistido: id existente o alta por documento.
   *
   * @param tx - Cliente transaccional.
   * @param dto - Body.
   * @returns UUID del paciente.
   */
  private async resolvePacienteId(
    tx: Prisma.TransactionClient,
    dto: UpsertTurnoDto,
  ): Promise<string> {
    if (dto.paciente) {
      const documento = normalizeDocumento(dto.paciente.documento);
      if (!documento) {
        throw new BadRequestException('Documento inválido');
      }
      const found = await tx.paciente.findUnique({ where: { documento } });
      if (found) {
        return found.id;
      }
      try {
        const created = await tx.paciente.create({
          data: {
            documento,
            nombre: dto.paciente.nombre.trim(),
            apellido: dto.paciente.apellido.trim(),
            telefono: this.normalizeOptionalPhone(dto.paciente.telefono),
            mail: this.normalizeOptionalMail(dto.paciente.mail),
          },
        });
        return created.id;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          const raced = await tx.paciente.findUnique({ where: { documento } });
          if (raced) {
            return raced.id;
          }
        }
        throw error;
      }
    }

    if (!dto.pacienteId) {
      throw new BadRequestException(
        'Debe indicar el paciente o los datos para darlo de alta',
      );
    }

    const existing = await tx.paciente.findUnique({
      where: { id: dto.pacienteId },
    });
    if (!existing) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return existing.id;
  }

  /**
   * Verifica que el médico atienda la especialidad.
   *
   * @param tx - Cliente transaccional.
   * @param medicoId - UUID del médico.
   * @param especialidadId - UUID de la especialidad.
   */
  private async assertMedicoEspecialidad(
    tx: Prisma.TransactionClient,
    medicoId: string,
    especialidadId: string,
  ): Promise<void> {
    const medico = await tx.usuario.findUnique({ where: { id: medicoId } });
    if (!medico || medico.rol !== RolUsuario.MEDICO || !medico.activo) {
      throw new BadRequestException('Médico inválido');
    }
    const link = await tx.medicoEspecialidad.findUnique({
      where: {
        medicoId_especialidadId: { medicoId, especialidadId },
      },
    });
    if (!link) {
      throw new BadRequestException(
        'El médico no atiende la especialidad seleccionada',
      );
    }
  }

  /**
   * Tipo de alta: Urgente pisa; si no, Primer turno o Control.
   *
   * @param tx - Cliente transaccional.
   * @param dto - Body.
   * @param pacienteId - Paciente resuelto.
   * @returns Tipo a persistir.
   */
  private async resolveTipoForCreate(
    tx: Prisma.TransactionClient,
    dto: UpsertTurnoDto,
    pacienteId: string,
  ): Promise<TipoTurno> {
    if (dto.tipo === TipoTurno.URGENTE) {
      return TipoTurno.URGENTE;
    }
    const count = await tx.turno.count({
      where: { pacienteId, medicoId: dto.medicoId },
    });
    return count === 0 ? TipoTurno.PRIMER_TURNO : TipoTurno.CONTROL;
  }

  /**
   * Tipo de edición: Sobreturno se conserva si no lo cambiaron; Urgente pisa;
   * Control/Primer turno se recalculan.
   *
   * @param tx - Cliente transaccional.
   * @param dto - Body.
   * @param pacienteId - Paciente resuelto.
   * @param tipoActual - Tipo persistido.
   * @param turnoId - Turno en edición.
   * @returns Tipo a persistir.
   */
  private async resolveTipoForUpdate(
    tx: Prisma.TransactionClient,
    dto: UpsertTurnoDto,
    pacienteId: string,
    tipoActual: TipoTurno,
    turnoId: string,
  ): Promise<TipoTurno> {
    if (dto.tipo === TipoTurno.URGENTE) {
      return TipoTurno.URGENTE;
    }
    if (dto.tipo === TipoTurno.SOBRETURNO) {
      return tipoActual === TipoTurno.SOBRETURNO
        ? TipoTurno.SOBRETURNO
        : TipoTurno.CONTROL;
    }
    const count = await tx.turno.count({
      where: {
        pacienteId,
        medicoId: dto.medicoId,
        id: { not: turnoId },
      },
    });
    return count === 0 ? TipoTurno.PRIMER_TURNO : TipoTurno.CONTROL;
  }

  /**
   * Notificar solo si el paciente tiene mail.
   *
   * @param tx - Cliente transaccional.
   * @param pacienteId - Paciente.
   * @param requested - Valor del formulario.
   * @returns Flag persistido.
   */
  private async resolveNotificarMail(
    tx: Prisma.TransactionClient,
    pacienteId: string,
    requested: boolean,
  ): Promise<boolean> {
    if (!requested) {
      return false;
    }
    const paciente = await tx.paciente.findUnique({
      where: { id: pacienteId },
      select: { mail: true },
    });
    return Boolean(paciente?.mail);
  }

  /**
   * Teléfono opcional: solo dígitos o null.
   *
   * @param value - Valor crudo.
   * @returns Teléfono o null.
   */
  private normalizeOptionalPhone(value?: string | null): string | null {
    if (!value) {
      return null;
    }
    const digits = value.replace(/\D/g, '');
    return digits.length > 0 ? digits.slice(0, 15) : null;
  }

  /**
   * Mail opcional recortado o null.
   *
   * @param value - Valor crudo.
   * @returns Mail o null.
   */
  private normalizeOptionalMail(value?: string | null): string | null {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > 0 ? trimmed : null;
  }

  /**
   * Resuelve filtros finales aplicando scoping por rol.
   *
   * @param query - Query recibida.
   * @param user - Usuario autenticado.
   * @returns Filtros normalizados.
   */
  private resolveFilters(
    query: ListTurnosQueryDto,
    user: JwtPayload,
  ): TurnoListFilters {
    const soloPendientes = query.soloPendientes ?? false;

    if (user.rol === RolUsuario.MEDICO) {
      return {
        medicoId: user.sub,
        especialidadId: query.especialidadId,
        pacienteId: query.pacienteId,
        soloPendientes,
      };
    }

    return {
      medicoId: query.medicoId,
      especialidadId: query.especialidadId,
      pacienteId: query.pacienteId,
      soloPendientes,
    };
  }

  /**
   * Primera página anclada a hoy 00:00 en adelante.
   *
   * @param filters - Filtros activos.
   * @returns Página inicial ascendente.
   */
  private async fetchInitialPage(
    filters: TurnoListFilters,
  ): Promise<TurnosListResponseDto> {
    const todayStart = startOfClinicDay(new Date());

    const where: Prisma.TurnoWhereInput = {
      ...this.buildFilterWhere(filters),
      fechaInicio: { gte: todayStart },
    };

    const turnos = await prisma.turno.findMany({
      where,
      include: TURNO_LIST_INCLUDE,
      orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
      take: PAGE_SIZE,
    });

    return this.buildResponse(turnos, filters, {
      fechaInicio: todayStart,
      id: CURSOR_NIL_UUID,
    });
  }

  /**
   * Todos los turnos de un día civil, sin paginación por cursor.
   *
   * @param filters - Filtros activos (scoping por rol ya resuelto).
   * @param fecha - Día civil YYYY-MM-DD.
   * @returns Lista completa del día, sin cursores.
   */
  private async fetchByDate(
    filters: TurnoListFilters,
    fecha: string,
  ): Promise<TurnosListResponseDto> {
    const range = clinicDayRangeFromYmd(fecha);
    if (!range) {
      throw new BadRequestException('fecha inválida');
    }

    const turnos = await prisma.turno.findMany({
      where: {
        ...this.buildFilterWhere(filters),
        fechaInicio: { gte: range.start, lt: range.end },
      },
      include: TURNO_LIST_INCLUDE,
      orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
    });

    const dto = new TurnosListResponseDto();
    dto.items = turnos.map((turno) =>
      TurnoListItemResponseDto.fromEntity(turno),
    );
    dto.cursorAnterior = null;
    dto.cursorSiguiente = null;
    return dto;
  }

  /**
   * Página subsiguiente o anterior a partir de un cursor.
   *
   * @param filters - Filtros activos.
   * @param cursor - Cursor decodificado.
   * @param direccion - Dirección de navegación.
   * @returns Página solicitada.
   */
  private async fetchPage(
    filters: TurnoListFilters,
    cursor: DecodedCursor,
    direccion: DireccionPaginacion,
  ): Promise<TurnosListResponseDto> {
    const filterWhere = this.buildFilterWhere(filters);

    if (direccion === 'siguiente') {
      const where: Prisma.TurnoWhereInput = {
        AND: [
          filterWhere,
          {
            OR: [
              { fechaInicio: { gt: cursor.fechaInicio } },
              {
                fechaInicio: cursor.fechaInicio,
                id: { gt: cursor.id },
              },
            ],
          },
        ],
      };

      const turnos = await prisma.turno.findMany({
        where,
        include: TURNO_LIST_INCLUDE,
        orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
        take: PAGE_SIZE,
      });

      return this.buildResponse(turnos, filters);
    }

    const where: Prisma.TurnoWhereInput = {
      AND: [
        filterWhere,
        {
          OR: [
            { fechaInicio: { lt: cursor.fechaInicio } },
            {
              fechaInicio: cursor.fechaInicio,
              id: { lt: cursor.id },
            },
          ],
        },
      ],
    };

    const turnosDesc = await prisma.turno.findMany({
      where,
      include: TURNO_LIST_INCLUDE,
      orderBy: [{ fechaInicio: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE,
    });

    const turnos = turnosDesc.reverse();
    return this.buildResponse(turnos, filters);
  }

  /**
   * Construye el where de filtros comunes.
   *
   * @param filters - Filtros activos.
   * @returns Fragmento Prisma where.
   */
  private buildFilterWhere(filters: TurnoListFilters): Prisma.TurnoWhereInput {
    const where: Prisma.TurnoWhereInput = {};

    if (filters.medicoId) {
      where.medicoId = filters.medicoId;
    }
    if (filters.especialidadId) {
      where.especialidadId = filters.especialidadId;
    }
    if (filters.pacienteId) {
      where.pacienteId = filters.pacienteId;
    }
    if (filters.soloPendientes) {
      where.estado = {
        in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
      };
    }

    return where;
  }

  /**
   * Arma la respuesta con cursores opacos.
   *
   * @param turnos - Turnos de la página.
   * @param filters - Filtros activos (para verificar más páginas).
   * @returns DTO de respuesta paginada.
   */
  private async buildResponse(
    turnos: Array<
      Prisma.TurnoGetPayload<{
        include: {
          paciente: { select: { nombre: true; apellido: true } };
          medico: { select: { nombre: true; apellido: true } };
          especialidad: { select: { nombre: true } };
        };
      }>
    >,
    filters: TurnoListFilters,
    initialAnchor?: { fechaInicio: Date; id: string },
  ): Promise<TurnosListResponseDto> {
    const items = turnos.map((turno) =>
      TurnoListItemResponseDto.fromEntity(turno),
    );

    const first = turnos[0];
    const last = turnos[turnos.length - 1];

    let cursorAnterior: string | null = null;
    let cursorSiguiente: string | null = null;

    const previousAnchor = first ?? initialAnchor;
    if (previousAnchor) {
      const hasPrevious = await this.hasPreviousPage(previousAnchor, filters);
      if (hasPrevious) {
        cursorAnterior = this.encodeCursor(
          previousAnchor.fechaInicio,
          previousAnchor.id,
        );
      }
    }

    if (last && turnos.length === PAGE_SIZE) {
      const hasNext = await this.hasNextPage(last, filters);
      if (hasNext) {
        cursorSiguiente = this.encodeCursor(last.fechaInicio, last.id);
      }
    }

    const dto = new TurnosListResponseDto();
    dto.items = items;
    dto.cursorAnterior = cursorAnterior;
    dto.cursorSiguiente = cursorSiguiente;
    return dto;
  }

  /**
   * Verifica si existen turnos anteriores al primer ítem.
   *
   * @param first - Primer turno de la página.
   * @param filters - Filtros activos.
   * @returns true si hay página anterior.
   */
  private async hasPreviousPage(
    first: { fechaInicio: Date; id: string },
    filters: TurnoListFilters,
  ): Promise<boolean> {
    const count = await prisma.turno.count({
      where: {
        AND: [
          this.buildFilterWhere(filters),
          {
            OR: [
              { fechaInicio: { lt: first.fechaInicio } },
              { fechaInicio: first.fechaInicio, id: { lt: first.id } },
            ],
          },
        ],
      },
    });
    return count > 0;
  }

  /**
   * Verifica si existen turnos posteriores al último ítem.
   *
   * @param last - Último turno de la página.
   * @param filters - Filtros activos.
   * @returns true si hay página siguiente.
   */
  private async hasNextPage(
    last: { fechaInicio: Date; id: string },
    filters: TurnoListFilters,
  ): Promise<boolean> {
    const count = await prisma.turno.count({
      where: {
        AND: [
          this.buildFilterWhere(filters),
          {
            OR: [
              { fechaInicio: { gt: last.fechaInicio } },
              { fechaInicio: last.fechaInicio, id: { gt: last.id } },
            ],
          },
        ],
      },
    });
    return count > 0;
  }

  /**
   * Codifica un cursor opaco a partir de fecha e id.
   *
   * @param fechaInicio - Fecha de inicio del turno.
   * @param id - ID del turno.
   * @returns Cursor base64url.
   */
  encodeCursor(fechaInicio: Date, id: string): string {
    const payload = JSON.stringify({
      f: fechaInicio.toISOString(),
      id,
    });
    return Buffer.from(payload).toString('base64url');
  }

  /**
   * Decodifica un cursor opaco.
   *
   * @param cursor - Cursor recibido por query.
   * @returns Fecha e id del turno ancla.
   */
  decodeCursor(cursor: string): DecodedCursor {
    try {
      const raw = Buffer.from(cursor, 'base64url').toString('utf8');
      const parsed = JSON.parse(raw) as { f?: unknown; id?: unknown };
      if (typeof parsed.f !== 'string' || typeof parsed.id !== 'string') {
        throw new Error('invalid');
      }
      const fechaInicio = new Date(parsed.f);
      if (Number.isNaN(fechaInicio.getTime())) {
        throw new Error('invalid');
      }
      if (!UUID_V4_PATTERN.test(parsed.id) && parsed.id !== CURSOR_NIL_UUID) {
        throw new Error('invalid');
      }
      return { fechaInicio, id: parsed.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Cursor inválido');
    }
  }
}
