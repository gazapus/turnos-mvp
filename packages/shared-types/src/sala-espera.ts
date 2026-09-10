/**
 * Ítem de aviso para el tablero de sala de espera.
 */
export type LlamadoSalaEsperaDto = {
  id: string;
  consultorioNumero: number;
  pacienteNombre: string;
  pacienteApellido: string;
  llamadoEn: string;
};

/**
 * Snapshot de los últimos llamados (máximo 5).
 */
export type SalaEsperaSnapshot = {
  items: LlamadoSalaEsperaDto[];
};
