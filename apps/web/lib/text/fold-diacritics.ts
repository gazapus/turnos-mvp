/**
 * Normaliza texto para búsqueda: minúsculas y sin diacríticos.
 * "Pérez" y "perez" quedan iguales.
 *
 * @param value - Texto original.
 * @returns Texto plegado.
 */
export function foldDiacritics(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '');
}
