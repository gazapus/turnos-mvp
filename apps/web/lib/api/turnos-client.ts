import type {
  EspecialidadOption,
  MedicoOption,
  PacienteDetalleDto,
  PacienteOption,
  PrimeraVezResponse,
  TurnoDetalleDto,
  TurnosListQuery,
  TurnosListResponse,
  UpsertTurnoRequest,
} from '@turnos/shared-types';

import { ApiError, type ApiErrorBody } from '@/lib/api/auth-client';

/**
 * Fetch JSON same-origin (proxy Next → Nest) con cookies.
 *
 * @param path - Ruta relativa bajo `/api`.
 * @param init - Opciones fetch.
 * @returns JSON tipado.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      data !== null &&
      typeof data === 'object' &&
      'message' in data &&
      'statusCode' in data
    ) {
      throw new ApiError(data as ApiErrorBody);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  return data as T;
}

/**
 * Serializa query params omitiendo valores vacíos.
 *
 * @param query - Objeto de query.
 * @returns Query string con prefijo `?` o cadena vacía.
 */
function buildQueryString(
  query: Record<string, string | boolean | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') {
      continue;
    }
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Lista turnos paginados por cursor.
 *
 * @param query - Filtros y cursor.
 * @returns Respuesta paginada de turnos.
 */
export function fetchTurnos(
  query: TurnosListQuery,
): Promise<TurnosListResponse> {
  const qs = buildQueryString({
    medicoId: query.medicoId,
    especialidadId: query.especialidadId,
    pacienteId: query.pacienteId,
    soloPendientes: query.soloPendientes ?? false,
    cursor: query.cursor,
    direccion: query.direccion,
    fecha: query.fecha,
  });
  return apiFetch<TurnosListResponse>(`/api/turnos${qs}`);
}

/**
 * Lista médicos (usuarios con rol MEDICO).
 *
 * @returns Opciones para combo de filtro.
 */
export function fetchMedicos(): Promise<MedicoOption[]> {
  return apiFetch<MedicoOption[]>('/api/usuarios?rol=MEDICO');
}

/**
 * Lista especialidades del catálogo.
 *
 * @returns Opciones para combo de filtro.
 */
export function fetchEspecialidades(): Promise<EspecialidadOption[]> {
  return apiFetch<EspecialidadOption[]>('/api/especialidades');
}

/**
 * Busca pacientes por substring de nombre o apellido.
 *
 * @param q - Texto de búsqueda (el backend ignora menos de 3 caracteres).
 * @returns Coincidencias para el combobox.
 */
export function fetchPacientes(q: string): Promise<PacienteOption[]> {
  const qs = buildQueryString({ q });
  return apiFetch<PacienteOption[]>(`/api/pacientes${qs}`);
}

/**
 * Obtiene un paciente por id para hidratar el combobox.
 *
 * @param id - UUID del paciente.
 * @returns DTO mínimo del paciente.
 */
export function fetchPacienteById(id: string): Promise<PacienteOption> {
  return apiFetch<PacienteOption>(`/api/pacientes/${id}`);
}

/**
 * Lookup de paciente por documento para el formulario de turno.
 *
 * @param documento - Documento tipado.
 * @returns Detalle o null si no existe.
 */
export function fetchPacienteByDocumento(
  documento: string,
): Promise<PacienteDetalleDto | null> {
  const qs = buildQueryString({ documento });
  return apiFetch<PacienteDetalleDto | null>(`/api/pacientes${qs}`);
}

/**
 * Detalle de un turno.
 *
 * @param id - UUID del turno.
 * @param signal - AbortSignal opcional.
 * @returns Detalle para el popup.
 */
export function fetchTurnoById(
  id: string,
  signal?: AbortSignal,
): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}`, { signal });
}

/**
 * Consulta si el par paciente+médico es primera vez.
 *
 * @param pacienteId - Paciente persistido.
 * @param medicoId - Médico.
 * @param excluirTurnoId - Turno actual en edición.
 * @returns Flag de primera vez.
 */
export function fetchPrimeraVez(
  pacienteId: string,
  medicoId: string,
  excluirTurnoId?: string,
): Promise<PrimeraVezResponse> {
  const qs = buildQueryString({
    pacienteId,
    medicoId,
    excluirTurnoId,
  });
  return apiFetch<PrimeraVezResponse>(`/api/turnos/primera-vez${qs}`);
}

/**
 * Crea un turno.
 *
 * @param body - Datos de alta.
 * @returns Detalle creado.
 */
export function createTurno(
  body: UpsertTurnoRequest,
): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>('/api/turnos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Edita un turno.
 *
 * @param id - UUID del turno.
 * @param body - Datos de edición.
 * @returns Detalle actualizado.
 */
export function updateTurno(
  id: string,
  body: UpsertTurnoRequest,
): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Confirma un turno PROGRAMADO del día de hoy.
 *
 * @param id - UUID del turno.
 * @returns Detalle actualizado.
 */
export function confirmarTurno(id: string): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}/confirmar`, {
    method: 'PATCH',
  });
}

/**
 * Cancela un turno PROGRAMADO o CONFIRMADO.
 *
 * @param id - UUID del turno.
 * @param motivo - Motivo opcional.
 * @returns Detalle actualizado.
 */
export function cancelarTurno(
  id: string,
  motivo?: string,
): Promise<TurnoDetalleDto> {
  const body = motivo ? { motivo } : {};
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Llama al paciente a sala de espera.
 *
 * @param id - UUID del turno.
 * @returns Detalle actualizado.
 */
export function llamarTurno(id: string): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}/llamar`, {
    method: 'POST',
  });
}

/**
 * Finaliza un turno llamado (CONFIRMADO → ATENDIDO).
 *
 * @param id - UUID del turno.
 * @returns Detalle actualizado.
 */
export function finalizarTurno(id: string): Promise<TurnoDetalleDto> {
  return apiFetch<TurnoDetalleDto>(`/api/turnos/${id}/finalizar`, {
    method: 'PATCH',
  });
}
