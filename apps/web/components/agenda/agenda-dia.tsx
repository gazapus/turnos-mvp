'use client';

import type { EventClickArg, EventContentArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import interactionPlugin, {
  type DateClickArg,
} from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useQuery } from '@tanstack/react-query';
import type { TurnoListItemDto } from '@turnos/shared-types';
import { useEffect, useMemo, useRef } from 'react';

import '@/app/agenda-dia.css';
import { toCalendarEvent } from '@/lib/agenda/turno-dia-event';
import {
  toAppliedFilters,
  toTurnosListQuery,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';
import { fetchTurnos } from '@/lib/api/turnos-client';
import { AgendaDiaSelector } from './agenda-dia-selector';
import { TurnoDiaCard } from './turno-dia-card';

type AgendaDiaProps = {
  params: ParsedAgendaParams;
  canCreate: boolean;
  onCrearEnHueco: (fecha: string, horaInicio: string) => void;
  onAbrirTurno: (turnoId: string) => void;
};

/**
 * Renderiza el contenido custom de un evento de FullCalendar.
 *
 * @param arg - Argumento de eventContent de FullCalendar.
 * @returns Card del turno o null si no hay datos.
 */
export function renderTurnoEventContent(arg: EventContentArg) {
  const turno = arg.event.extendedProps.turno as TurnoListItemDto | undefined;
  if (!turno?.id) {
    return null;
  }
  return <TurnoDiaCard turno={turno} />;
}

/**
 * Vista Día de la Agenda: selector de fecha + grilla horaria de 24hs.
 *
 * @param props - Params de URL, permisos de alta y callbacks de popup.
 * @returns Bloque de visualización del modo Día.
 */
export function AgendaDia({
  params,
  canCreate,
  onCrearEnHueco,
  onAbrirTurno,
}: AgendaDiaProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const appliedFilters = useMemo(() => toAppliedFilters(params), [params]);

  const query = useQuery({
    queryKey: [
      'turnos-dia',
      params.fecha,
      appliedFilters.medicoId,
      appliedFilters.especialidadId,
      appliedFilters.pacienteId,
      appliedFilters.soloPendientes,
    ],
    queryFn: () =>
      fetchTurnos(
        toTurnosListQuery(appliedFilters, undefined, undefined, params.fecha),
      ),
  });

  const events = useMemo(
    () => (query.data?.items ?? []).map(toCalendarEvent),
    [query.data?.items],
  );

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }
    api.gotoDate(params.fecha);
    api.updateSize();
  }, [params.fecha, events.length]);

  useEffect(() => {
    const container = calendarContainerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      calendarRef.current?.getApi()?.updateSize();
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [query.isLoading, query.isError]);

  const showEmptyMessage =
    !query.isLoading && !query.isError && (query.data?.items.length ?? 0) === 0;

  /**
   * Abre el alta en el segmento de 15 min clickeado (recep/admin).
   *
   * @param info - Click en un hueco de FullCalendar.
   */
  function handleDateClick(info: DateClickArg): void {
    if (!canCreate) {
      return;
    }
    const hours = String(info.date.getHours()).padStart(2, '0');
    const minutes = String(info.date.getMinutes()).padStart(2, '0');
    onCrearEnHueco(params.fecha, `${hours}:${minutes}`);
  }

  /**
   * Abre el detalle del turno clickeado en la grilla.
   *
   * @param info - Click en un evento de FullCalendar.
   */
  function handleEventClick(info: EventClickArg): void {
    onAbrirTurno(info.event.id);
  }

  return (
    <div
      className="glass-panel-agenda overflow-x-auto rounded-b-lg"
      data-testid="agenda-dia"
    >
      <div className="agenda-dia-min-width flex flex-col">
        <AgendaDiaSelector params={params} />
        <div
          ref={calendarContainerRef}
          className="agenda-dia-calendar flex h-[calc(100dvh-24rem)] min-h-[32rem] flex-col overflow-hidden"
          data-testid="agenda-dia-calendar"
        >
          {query.isLoading && (
            <p className="py-8 text-center text-muted-foreground">
              Cargando turnos…
            </p>
          )}

          {query.isError && (
            <p className="py-8 text-center text-danger" role="alert">
              No se pudieron cargar los turnos.
            </p>
          )}

          {showEmptyMessage && (
            <p className="sr-only">
              No hay turnos para mostrar con los filtros actuales.
            </p>
          )}

          {!query.isLoading && !query.isError && (
            <div className="min-h-0 flex-1">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridDay"
                initialDate={params.fecha}
                locale={esLocale}
                headerToolbar={false}
                allDaySlot={false}
                slotEventOverlap={false}
                scrollTime="08:00:00"
                scrollTimeReset
                slotMinTime="00:00:00"
                slotMaxTime="24:00:00"
                slotDuration="00:15:00"
                slotLabelInterval="01:00:00"
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }}
                displayEventTime={false}
                height="100%"
                events={events}
                eventContent={renderTurnoEventContent}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
