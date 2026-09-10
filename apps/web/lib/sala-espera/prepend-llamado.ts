export const SALA_ESPERA_MAX_LLAMADOS = 5 as const;

export const SALA_ESPERA_TAGLINE = 'Tu salud, nuestra prioridad' as const;

export const SALA_ESPERA_FOOTER_LEFT =
  'Por favor, dirigite al consultorio indicado.' as const;

export const SALA_ESPERA_FOOTER_RIGHT = 'Gracias por tu paciencia.' as const;

/**
 * Inserta un llamado al inicio y recorta al máximo del tablero.
 *
 * @param items - Lista actual (más reciente primero).
 * @param next - Llamado nuevo.
 * @param limit - Tope (default 5).
 * @returns Lista actualizada.
 */
export function prependLlamado<T extends { id: string }>(
  items: T[],
  next: T,
  limit = SALA_ESPERA_MAX_LLAMADOS,
): T[] {
  const withoutDup = items.filter((item) => item.id !== next.id);
  return [next, ...withoutDup].slice(0, limit);
}
