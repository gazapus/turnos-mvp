import { isValidYmd, todayYmd } from '@/lib/agenda/fecha-dia';
import type {
  AuthUser,
  EspecialidadOption,
  MedicoOption,
  PacienteOption,
  TurnosListQuery,
  VistaAgenda,
} from '@turnos/shared-types';
import { VISTA_AGENDA } from '@turnos/shared-types';

/**
 * Parámetros de agenda parseados desde la URL con defaults por rol.
 */
export type ParsedAgendaParams = {
  vista: VistaAgenda;
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  soloPendientes: boolean;
  fecha: string;
};

const ALL_VALUE = '';

/**
 * Obtiene el primer valor string de un searchParam.
 *
 * @param value - Valor del searchParam.
 * @returns String o undefined.
 */
function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

/**
 * Default de "Solo Pendientes" según rol.
 *
 * @param rol - Rol del usuario autenticado.
 * @returns true para médico; false para admin/recepcionista.
 */
export function defaultSoloPendientesForRole(rol: AuthUser['rol']): boolean {
  return rol === 'MEDICO';
}

/**
 * Parsea searchParams de `/agenda` aplicando defaults por rol.
 * El query param `cancelados` se ignora.
 *
 * @param searchParams - Query params de Next.js.
 * @param user - Usuario autenticado.
 * @returns Estado inicial de filtros y vista.
 */
export function parseAgendaUrlParams(
  searchParams: Record<string, string | string[] | undefined>,
  user: AuthUser,
): ParsedAgendaParams {
  const vistaRaw = firstParam(searchParams.vista);
  const vista =
    vistaRaw && (VISTA_AGENDA as readonly string[]).includes(vistaRaw)
      ? (vistaRaw as VistaAgenda)
      : 'lista';

  const soloPendientesRaw = firstParam(searchParams.soloPendientes);
  const soloPendientes =
    soloPendientesRaw === undefined
      ? defaultSoloPendientesForRole(user.rol)
      : soloPendientesRaw === 'true';

  let medicoId = firstParam(searchParams.medicoId);
  if (user.rol === 'MEDICO') {
    medicoId = user.id;
  }

  const especialidadId = firstParam(searchParams.especialidadId);
  const pacienteId = firstParam(searchParams.pacienteId);
  const fechaRaw = firstParam(searchParams.fecha);
  const fecha = fechaRaw && isValidYmd(fechaRaw) ? fechaRaw : todayYmd();

  return {
    vista,
    medicoId: medicoId || undefined,
    especialidadId: especialidadId || undefined,
    pacienteId: pacienteId || undefined,
    soloPendientes,
    fecha,
  };
}

/**
 * Serializa parámetros de agenda a URLSearchParams.
 *
 * @param params - Estado de agenda a persistir.
 * @returns Query string params.
 */
export function serializeAgendaUrlParams(
  params: ParsedAgendaParams,
): URLSearchParams {
  const search = new URLSearchParams();

  if (params.vista !== 'lista') {
    search.set('vista', params.vista);
  }
  if (params.medicoId) {
    search.set('medicoId', params.medicoId);
  }
  if (params.especialidadId) {
    search.set('especialidadId', params.especialidadId);
  }
  if (params.pacienteId) {
    search.set('pacienteId', params.pacienteId);
  }
  search.set('soloPendientes', params.soloPendientes ? 'true' : 'false');
  if (params.fecha) {
    search.set('fecha', params.fecha);
  }

  return search;
}

/**
 * Construye la ruta `/agenda` con query params.
 *
 * @param params - Estado de agenda.
 * @returns Path con query string.
 */
export function buildAgendaHref(params: ParsedAgendaParams): string {
  const search = serializeAgendaUrlParams(params);
  const qs = search.toString();
  return qs ? `/agenda?${qs}` : '/agenda';
}

/**
 * Valor sentinel para la opción "Todos" en combobox de filtro.
 */
export const AGENDA_FILTER_ALL = ALL_VALUE;

/**
 * Filtros aplicados listos para consultar el backend.
 */
export type AppliedAgendaFilters = {
  medicoId?: string;
  especialidadId?: string;
  pacienteId?: string;
  soloPendientes: boolean;
};

/**
 * Extrae filtros de backend desde params parseados.
 *
 * @param params - Params de agenda.
 * @returns Filtros para GET /api/turnos.
 */
export function toAppliedFilters(
  params: ParsedAgendaParams,
): AppliedAgendaFilters {
  return {
    medicoId: params.medicoId,
    especialidadId: params.especialidadId,
    pacienteId: params.pacienteId,
    soloPendientes: params.soloPendientes,
  };
}

/**
 * Construye query de turnos para el cliente API.
 *
 * @param filters - Filtros aplicados.
 * @param cursor - Cursor opaco opcional.
 * @param direccion - Dirección de paginación.
 * @param fecha - Día civil opcional.
 * @returns Query serializable.
 */
export function toTurnosListQuery(
  filters: AppliedAgendaFilters,
  cursor?: string,
  direccion?: TurnosListQuery['direccion'],
  fecha?: string,
): TurnosListQuery {
  return {
    medicoId: filters.medicoId,
    especialidadId: filters.especialidadId,
    pacienteId: filters.pacienteId,
    soloPendientes: filters.soloPendientes,
    cursor,
    direccion,
    fecha,
  };
}

export type { MedicoOption, EspecialidadOption, PacienteOption };
