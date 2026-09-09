const ACCENTED_LOWER = 'áàäâéèëêíìïîóòöôúùüûñç';
const PLAIN_LOWER = 'aaaaeeeeiiiioooouuuunc';

/**
 * Caracteres acentuados (minúsculas) para `translate` en PostgreSQL.
 */
export const SQL_ACCENTED_CHARS = ACCENTED_LOWER;

/**
 * Equivalentes sin tilde, en el mismo orden que `SQL_ACCENTED_CHARS`.
 */
export const SQL_PLAIN_CHARS = PLAIN_LOWER;

/**
 * Normaliza texto para búsqueda: minúsculas y sin diacríticos.
 * "González" y "gonzalez" quedan iguales.
 *
 * @param value - Texto original.
 * @returns Texto plegado.
 */
export function foldDiacritics(value: string): string {
  return value.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '');
}

/**
 * Escapa comodines de LIKE (`%`, `_`, `\`) en un patrón.
 *
 * @param value - Texto ya plegado.
 * @returns Texto seguro para `LIKE … ESCAPE '\'`.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
