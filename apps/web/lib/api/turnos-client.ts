import type {
  EspecialidadOption,
  MedicoOption,
  PacienteOption,
  TurnosListQuery,
  TurnosListResponse,
} from '@turnos/shared-types';

/**
 * Shape de error de la API Nest (AllExceptionsFilter).
 */
type ApiErrorBody = {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
};

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
    throw new Error(
      data !== null &&
        typeof data === 'object' &&
        'message' in data &&
        typeof (data as ApiErrorBody).message === 'string'
        ? (data as ApiErrorBody).message
        : `HTTP ${response.status}`,
    );
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
