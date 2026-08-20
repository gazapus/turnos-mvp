'use client';

import type { EventContentArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useQuery } from '@tanstack/react-query';
import type { TurnoListItemDto } from '@turnos/shared-types';
import { useEffect, useMemo, useRef } from 'react';

import '@/app/agenda-dia.css';
import { filterTurnosDia, toCalendarEvent } from '@/lib/agenda/turno-dia-event';
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
 * @param props - Params de URL (fecha, filtros, cancelados).
 * @returns Bloque de visualización del modo Día.
 */
export function AgendaDia({ params }: AgendaDiaProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const appliedFilters = useMemo(() => toAppliedFilters(params), [params]);

  const query = useQuery({
    queryKey: [
      'turnos-dia',
      params.fecha,
      appliedFilters.medicoId,
      appliedFilters.especialidadId,
      appliedFilters.pacienteId,
    ],
    queryFn: () =>
      fetchTurnos(
        toTurnosListQuery(appliedFilters, undefined, undefined, params.fecha),
      ),
  });

  const visibleItems = useMemo(
    () => filterTurnosDia(query.data?.items ?? [], params.cancelados),
    [query.data?.items, params.cancelados],
  );

  const events = useMemo(
    () => visibleItems.map(toCalendarEvent),
    [visibleItems],
  );

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }
    api.gotoDate(params.fecha);
    api.updateSize();
  }, [params.fecha, events.length]);

  const showEmptyMessage =
    !query.isLoading && !query.isError && visibleItems.length === 0;

  return (
    <div
      className="glass-panel-agenda flex flex-col rounded-b-lg"
      data-testid="agenda-dia"
    >
      <AgendaDiaSelector params={params} />
      <div
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
              plugins={[timeGridPlugin]}
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
              slotDuration="01:00:00"
              slotLabelFormat={{
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }}
              displayEventTime={false}
              height="100%"
              events={events}
              eventContent={renderTurnoEventContent}
            />
          </div>
        )}
      </div>
    </div>
  );
}
