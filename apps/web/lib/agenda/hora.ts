/**
 * Suma minutos a una hora HH:mm (ciclo 24 h).
 *
 * @param hm - Hora HH:mm.
 * @param minutes - Minutos a sumar.
 * @returns Nueva hora HH:mm.
 */
export function addMinutesHm(hm: string, minutes: number): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hm);
  if (!match) {
    return hm;
  }
  const total =
    (((Number(match[1]) * 60 + Number(match[2]) + minutes) % (24 * 60)) +
      24 * 60) %
    (24 * 60);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Extrae solo dígitos de un documento o teléfono.
 *
 * @param raw - Valor crudo.
 * @returns Dígitos.
 */
export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}
