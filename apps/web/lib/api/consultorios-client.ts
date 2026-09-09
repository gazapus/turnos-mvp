import type {
  AsignarConsultorioRequest,
  ConsultorioDto,
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
 * Lista el catálogo de consultorios ordenado por número.
 *
 * @returns Consultorios con médico opcional.
 */
export function fetchConsultorios(): Promise<ConsultorioDto[]> {
  return apiFetch<ConsultorioDto[]>('/api/consultorios');
}

/**
 * Asigna o desasigna el médico de un consultorio.
 *
 * @param id - UUID del consultorio.
 * @param medicoId - Médico destino o null.
 * @returns Snapshot completo del catálogo.
 */
export function assignConsultorio(
  id: string,
  medicoId: AsignarConsultorioRequest['medicoId'],
): Promise<ConsultorioDto[]> {
  return apiFetch<ConsultorioDto[]>(`/api/consultorios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ medicoId }),
  });
}
