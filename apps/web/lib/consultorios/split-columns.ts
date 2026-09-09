/** Mínimo de filas antes de abrir otra columna. */
export const CONSULTORIOS_MIN_ROWS = 8;

/** Máximo de columnas por viewport. */
export const CONSULTORIOS_MAX_COLS = {
  desktop: 3,
  medium: 2,
  small: 1,
} as const;

/** Viewport de la grilla de consultorios. */
export type ConsultorioViewport = keyof typeof CONSULTORIOS_MAX_COLS;

const LG_MIN = 1024;
const MD_MIN = 768;

/**
 * Máximo de columnas según ancho de viewport en px.
 *
 * @param width - innerWidth.
 * @returns 3, 2 o 1.
 */
export function maxColsFromWidth(width: number): number {
  if (width >= LG_MIN) {
    return CONSULTORIOS_MAX_COLS.desktop;
  }
  if (width >= MD_MIN) {
    return CONSULTORIOS_MAX_COLS.medium;
  }
  return CONSULTORIOS_MAX_COLS.small;
}

/**
 * Reparte N ítems en `columns` columnas lo más igual posible (resto al inicio).
 *
 * @param count - Cantidad de ítems.
 * @param columns - Columnas destino.
 * @returns Tamaños por columna.
 */
function distributeEqual(count: number, columns: number): number[] {
  const base = Math.floor(count / columns);
  const remainder = count % columns;
  return Array.from(
    { length: columns },
    (_, index) => base + (index < remainder ? 1 : 0),
  );
}

/**
 * Calcula cuántas filas van en cada columna.
 *
 * @param count - Cantidad de consultorios.
 * @param maxCols - Tope del viewport.
 * @returns Tamaños de columna (column-major).
 */
export function splitConsultorioColumns(
  count: number,
  maxCols: number,
): number[] {
  if (count <= 0) {
    return [];
  }
  const columns = Math.min(
    maxCols,
    Math.max(1, Math.ceil(count / CONSULTORIOS_MIN_ROWS)),
  );
  const equal = distributeEqual(count, columns);
  const shortest = Math.min(...equal);
  if (columns === 1 || shortest >= CONSULTORIOS_MIN_ROWS) {
    return equal;
  }
  const last = count - CONSULTORIOS_MIN_ROWS * (columns - 1);
  return [...Array<number>(columns - 1).fill(CONSULTORIOS_MIN_ROWS), last];
}

/**
 * Parte un listado en columnas según tamaños (column-major).
 *
 * @param items - Ítems ordenados.
 * @param sizes - Filas por columna.
 * @returns Columnas.
 */
export function chunkColumnMajor<T>(
  items: readonly T[],
  sizes: number[],
): T[][] {
  const columns: T[][] = [];
  let offset = 0;
  for (const size of sizes) {
    columns.push(items.slice(offset, offset + size));
    offset += size;
  }
  return columns;
}
