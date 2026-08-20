/**
 * Zona horaria única de la clínica (alineada al backend).
 */
export const CLINIC_TIMEZONE = 'America/Argentina/Buenos_Aires' as const;

const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DMY_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Valida una fecha civil YYYY-MM-DD.
 *
 * @param ymd - Cadena a validar.
 * @returns true si es una fecha gregoriana real.
 */
export function isValidYmd(ymd: string): boolean {
  const match = YMD_PATTERN.exec(ymd);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/**
 * Día civil de "hoy" en la zona horaria de la clínica.
 *
 * @param now - Instante de referencia.
 * @returns Fecha YYYY-MM-DD.
 */
export function todayYmd(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/**
 * Formatea YYYY-MM-DD como "{día} {mes} {año}" en español.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @returns Texto de despliegue (ej. "16 agosto 2026").
 */
export function formatYmdDisplay(ymd: string): string {
  if (!isValidYmd(ymd)) {
    return ymd;
  }
  const [, year, month, day] = YMD_PATTERN.exec(ymd) ?? [];
  const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(utc);
  const dayPart = parts.find((part) => part.type === 'day')?.value;
  const monthPart = parts.find((part) => part.type === 'month')?.value;
  const yearPart = parts.find((part) => part.type === 'year')?.value;
  return `${dayPart} ${monthPart} ${yearPart}`;
}

/**
 * Convierte YYYY-MM-DD a DD/MM/YYYY.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @returns Cadena DD/MM/YYYY o vacía si es inválida.
 */
export function ymdToDmy(ymd: string): string {
  const match = YMD_PATTERN.exec(ymd);
  if (!match || !isValidYmd(ymd)) {
    return '';
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Parsea una fecha tipeada DD/MM/YYYY a YYYY-MM-DD.
 *
 * @param value - Texto ingresado.
 * @returns YYYY-MM-DD o null si es inválida.
 */
export function parseDmy(value: string): string | null {
  const match = DMY_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }
  const ymd = `${match[3]}-${match[2]}-${match[1]}`;
  return isValidYmd(ymd) ? ymd : null;
}

/**
 * Suma (o resta) días a una fecha civil YYYY-MM-DD.
 *
 * @param ymd - Fecha de origen.
 * @param days - Días a sumar (negativo para restar).
 * @returns Nueva fecha YYYY-MM-DD.
 */
export function addDaysYmd(ymd: string, days: number): string {
  if (!isValidYmd(ymd)) {
    return ymd;
  }
  const [, year, month, day] = YMD_PATTERN.exec(ymd) ?? [];
  const utc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

/**
 * Convierte YYYY-MM-DD a Date local (medianoche) para DayPicker.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @returns Date local o undefined si es inválida.
 */
export function ymdToLocalDate(ymd: string): Date | undefined {
  if (!isValidYmd(ymd)) {
    return undefined;
  }
  const [, year, month, day] = YMD_PATTERN.exec(ymd) ?? [];
  return new Date(Number(year), Number(month) - 1, Number(day));
}

/**
 * Convierte un Date local a YYYY-MM-DD.
 *
 * @param date - Fecha local.
 * @returns Fecha civil YYYY-MM-DD.
 */
export function localDateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
