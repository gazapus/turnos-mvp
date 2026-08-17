/**
 * Zona horaria única de la clínica (single-tenant).
 */
export const CLINIC_TIMEZONE = 'America/Argentina/Buenos_Aires' as const;

/**
 * UUID nulo usado como ancla sintética de cursor hacia el pasado
 * cuando la primera página (desde hoy) está vacía.
 */
export const CURSOR_NIL_UUID = '00000000-0000-0000-0000-000000000000' as const;

/**
 * Regex para validar UUID v4 en cursores opacos.
 */
export const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Inicio del día civil en la zona horaria de la clínica.
 *
 * @param date - Instante de referencia (default: ahora).
 * @returns Date UTC equivalente a las 00:00:00 del día en CLINIC_TIMEZONE.
 */
export function startOfClinicDay(date: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('No se pudo resolver la fecha en la zona horaria de la clínica');
  }

  const noonUtc = new Date(`${year}-${month}-${day}T12:00:00.000Z`);
  const offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: CLINIC_TIMEZONE,
    timeZoneName: 'shortOffset',
  });
  const offsetPart = offsetFormatter
    .formatToParts(noonUtc)
    .find((p) => p.type === 'timeZoneName')?.value;

  const match = offsetPart?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) {
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  }

  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = match[3] ? Number(match[3]) : 0;
  const offsetMinutes = sign * (hours * 60 + minutes);

  return new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0) -
      offsetMinutes * 60_000,
  );
}

/**
 * Formatea una fecha como YYYY-MM-DD en la zona horaria de la clínica.
 *
 * @param date - Fecha a formatear.
 * @returns Cadena de fecha local de clínica.
 */
export function formatClinicDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Formatea una hora como HH:mm en la zona horaria de la clínica.
 *
 * @param date - Fecha a formatear.
 * @returns Cadena de hora local de clínica.
 */
export function formatClinicTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}
