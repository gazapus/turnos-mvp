import { CLINIC_TIMEZONE } from '@/lib/agenda/fecha-dia';

const MONITOR_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  timeZone: CLINIC_TIMEZONE,
  weekday: 'long',
});

const MONITOR_DAY_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  timeZone: CLINIC_TIMEZONE,
  day: 'numeric',
});

const MONITOR_MONTH_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  timeZone: CLINIC_TIMEZONE,
  month: 'long',
});

const MONITOR_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: CLINIC_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/**
 * Capitaliza la primera letra de una etiqueta en español.
 *
 * @param value - Texto en minúsculas.
 * @returns Texto con inicial mayúscula.
 */
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Fecha del monitor: weekday + día + mes en español, capitalizado.
 *
 * @param now - Instante de referencia.
 * @returns Ej. "Martes 26 de Agosto".
 */
export function formatMonitorDate(now: Date): string {
  const weekday = capitalize(MONITOR_WEEKDAY_FORMATTER.format(now));
  const day = MONITOR_DAY_FORMATTER.format(now);
  const month = capitalize(MONITOR_MONTH_FORMATTER.format(now));
  return `${weekday} ${day} de ${month}`;
}

/**
 * Hora del monitor HH:mm en zona de clínica.
 *
 * @param now - Instante de referencia.
 * @returns Hora local.
 */
export function formatMonitorTime(now: Date): string {
  return MONITOR_TIME_FORMATTER.format(now);
}
