import type { EstadoTurno, TurnoListItemDto } from '@turnos/shared-types';

/**
 * Evento de FullCalendar construido desde un ítem de turno.
 */
export type TurnoCalendarEvent = {
  id: string;
  start: string;
  end: string;
  classNames: string[];
  extendedProps: { turno: TurnoListItemDto };
};

const ESTADO_EVENT_CLASS: Record<EstadoTurno, string> = {
  PROGRAMADO: 'fc-turno-PROGRAMADO',
  CONFIRMADO: 'fc-turno-CONFIRMADO',
  ATENDIDO: 'fc-turno-ATENDIDO',
  AUSENTE: 'fc-turno-AUSENTE',
  CANCELADO: 'fc-turno-CANCELADO',
};

/**
 * Filtra turnos cancelados en memoria según el checkbox de la Agenda.
 *
 * @param items - Turnos cargados del backend.
 * @param mostrarCancelados - true para incluir cancelados.
 * @returns Turnos visibles.
 */
export function filterTurnosDia(
  items: TurnoListItemDto[],
  mostrarCancelados: boolean,
): TurnoListItemDto[] {
  if (mostrarCancelados) {
    return items;
  }
  return items.filter((item) => item.estado !== 'CANCELADO');
}

/**
 * Mapea un turno de listado a un evento de FullCalendar.
 *
 * @param turno - Ítem de GET /api/turnos.
 * @returns Evento con start/end ISO local y el turno en extendedProps.
 */
export function toCalendarEvent(turno: TurnoListItemDto): TurnoCalendarEvent {
  return {
    id: turno.id,
    start: `${turno.fecha}T${turno.hora}:00`,
    end: `${turno.fecha}T${turno.horaFin}:00`,
    classNames: [ESTADO_EVENT_CLASS[turno.estado]],
    extendedProps: { turno },
  };
}
