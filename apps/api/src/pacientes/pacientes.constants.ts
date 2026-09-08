/** Longitud mínima de `q` para buscar pacientes. */
export const PACIENTE_SEARCH_MIN_LENGTH = 3;

/** Máximo de coincidencias devueltas por la búsqueda de pacientes. */
export const PACIENTE_SEARCH_LIMIT = 30;

/**
 * Normaliza un documento a solo dígitos.
 *
 * @param raw - Valor ingresado (puede incluir puntos o espacios).
 * @returns Documento numérico o cadena vacía.
 */
export function normalizeDocumento(raw: string): string {
  return raw.replace(/\D/g, '');
}
