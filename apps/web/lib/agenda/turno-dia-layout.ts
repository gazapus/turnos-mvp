/**
 * Piso de ancho del panel Día, igual que `min-w-[960px]` de la tabla de Lista.
 * Excepción documentada a la regla de no fijar min-width ad-hoc (AGENTS.md).
 */
export const AGENDA_DIA_MIN_WIDTH_PX = 960 as const;

/**
 * Umbral de compactación de la pill de estado en cards del modo Día.
 * Cards más angostas que este valor muestran las primeras 3 letras del label.
 */
export const TURNO_DIA_PILL_COMPACT_BELOW_PX = 260 as const;
