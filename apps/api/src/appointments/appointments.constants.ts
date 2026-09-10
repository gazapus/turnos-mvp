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
 * Fecha civil YYYY-MM-DD.
 */
export const YMD_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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
    throw new Error(
      'No se pudo resolver la fecha en la zona horaria de la clínica',
    );
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

/**
 * Valida una fecha civil YYYY-MM-DD (calendario gregoriano).
 *
 * @param ymd - Cadena YYYY-MM-DD.
 * @returns true si es una fecha real.
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
 * Rango `[inicio, fin)` del día civil en la zona horaria de la clínica.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @returns Inicio inclusive y fin exclusivo, o null si la fecha es inválida.
 */
export function clinicDayRangeFromYmd(
  ymd: string,
): { start: Date; end: Date } | null {
  if (!isValidYmd(ymd)) {
    return null;
  }
  const match = YMD_PATTERN.exec(ymd);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const noon = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  const nextNoon = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0, 0));
  return {
    start: startOfClinicDay(noon),
    end: startOfClinicDay(nextNoon),
  };
}

/**
 * Hora local HH:mm (00:00–23:59).
 */
export const HM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Instante UTC equivalente a una fecha+hora civil de la clínica.
 *
 * @param ymd - Día YYYY-MM-DD.
 * @param hm - Hora HH:mm.
 * @returns Date o null si el input es inválido.
 */
export function clinicDateTimeFromYmdHm(ymd: string, hm: string): Date | null {
  const range = clinicDayRangeFromYmd(ymd);
  const match = HM_PATTERN.exec(hm);
  if (!range || !match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return new Date(range.start.getTime() + (hours * 60 + minutes) * 60_000);
}

/**
 * Resuelve inicio/fin de un turno. Si hora fin es menor que inicio,
 * la fecha de fin pasa al día civil siguiente.
 *
 * @param fecha - Día de inicio YYYY-MM-DD.
 * @param horaInicio - HH:mm.
 * @param horaFin - HH:mm.
 * @returns Rango o null si es inválido o fin no es posterior a inicio.
 */
export function resolveTurnoDateRange(
  fecha: string,
  horaInicio: string,
  horaFin: string,
): { start: Date; end: Date } | null {
  const start = clinicDateTimeFromYmdHm(fecha, horaInicio);
  let end = clinicDateTimeFromYmdHm(fecha, horaFin);
  if (!start || !end) {
    return null;
  }
  if (end.getTime() < start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  if (end.getTime() <= start.getTime()) {
    return null;
  }
  return { start, end };
}

/**
 * Compara una fecha civil con el día de hoy en la clínica.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @returns true si ymd es anterior a hoy.
 */
export function isClinicDateBeforeToday(ymd: string): boolean {
  return ymd < formatClinicDate(new Date());
}

/**
 * Indica si la fecha civil coincide con hoy en la clínica.
 *
 * @param ymd - Fecha YYYY-MM-DD.
 * @param now - Instante de referencia.
 * @returns true si ymd es hoy.
 */
export function isClinicDateToday(
  ymd: string,
  now: Date = new Date(),
): boolean {
  return ymd === formatClinicDate(now);
}

export const CONFIRMAR_TURNO_SOLO_PROGRAMADO =
  'Solo se pueden confirmar turnos en estado Programado' as const;

export const CONFIRMAR_TURNO_SOLO_HOY =
  'Solo se pueden confirmar turnos del día de hoy' as const;

export const CANCELAR_TURNO_ESTADO_INVALIDO =
  'Solo se pueden cancelar turnos en estado Programado o Confirmado' as const;

export const LLAMAR_TURNO_SOLO_CONFIRMADO =
  'Solo se pueden llamar turnos en estado Confirmado' as const;

export const LLAMAR_TURNO_SOLO_HOY =
  'Solo se pueden llamar turnos del día de hoy' as const;

export const LLAMAR_SIN_CONSULTORIO =
  'El médico no tiene consultorio asignado' as const;

export const FINALIZAR_TURNO_SOLO_CONFIRMADO =
  'Solo se pueden finalizar turnos en estado Confirmado' as const;

export const FINALIZAR_TURNO_SOLO_HOY =
  'Solo se pueden finalizar turnos del día de hoy' as const;

export const FINALIZAR_SIN_LLAMADO =
  'El turno debe ser llamado antes de finalizar' as const;

/**
 * Normaliza un documento a dígitos.
 *
 * @param raw - Valor ingresado.
 * @returns Solo dígitos.
 */
export function normalizeDocumento(raw: string): string {
  return raw.replace(/\D/g, '');
}
