import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoTurno, prisma, Prisma, RolUsuario } from '@turnos/database';
import type { DireccionPaginacion } from '@turnos/shared-types';
import type { JwtPayload } from '../auth';
import {
  CURSOR_NIL_UUID,
  clinicDayRangeFromYmd,
  startOfClinicDay,
  UUID_V4_PATTERN,
} from './appointments.constants';
import {
  ListTurnosQueryDto,
  TurnoListItemResponseDto,
  TurnosListResponseDto,
} from './dto';

const PAGE_SIZE = 30;

const TURNO_LIST_INCLUDE = {
  paciente: { select: { nombre: true, apellido: true } },
  medico: { select: { nombre: true, apellido: true } },
  especialidad: { select: { nombre: true } },
} as const;

type DecodedCursor = {
  fechaInicio: Date;
  id: string;
};

type TurnoListFilters = {
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  incluirCancelados: boolean;
};

/**
 * Servicio de consulta de turnos con paginación por cursor.
 */
@Injectable()
export class AppointmentsService {
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
    const incluirCancelados = query.incluirCancelados ?? true;

    if (user.rol === RolUsuario.MEDICO) {
      return {
        medicoId: user.sub,
        especialidadId: query.especialidadId,
        pacienteId: query.pacienteId,
        incluirCancelados,
      };
    }

    return {
      medicoId: query.medicoId,
      especialidadId: query.especialidadId,
      pacienteId: query.pacienteId,
      incluirCancelados,
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
    if (!filters.incluirCancelados) {
      where.estado = { not: EstadoTurno.CANCELADO };
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
