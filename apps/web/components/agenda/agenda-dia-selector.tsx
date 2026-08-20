'use client';

import { DayPicker } from '@daypicker/react';
import { es } from '@daypicker/react/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import {
  addDaysYmd,
  formatYmdDisplay,
  localDateToYmd,
  parseDmy,
  todayYmd,
  ymdToDmy,
  ymdToLocalDate,
} from '@/lib/agenda/fecha-dia';
import {
  buildAgendaHref,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';

type AgendaDiaSelectorProps = {
  params: ParsedAgendaParams;
};

/**
 * Selector de fecha del modo Día: input, calendario, flechas y botón HOY.
 *
 * @param props - Params actuales de la agenda.
 * @returns Controles de navegación de fecha.
 */
export function AgendaDiaSelector({ params }: AgendaDiaSelectorProps) {
  const router = useRouter();
  const inputId = useId();
  const pickerId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(ymdToDmy(params.fecha));
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * Persiste una nueva fecha en la URL (dispara el fetch del modo Día).
   *
   * @param fecha - YYYY-MM-DD.
   */
  function commitFecha(fecha: string): void {
    if (fecha === params.fecha) {
      return;
    }
    router.replace(buildAgendaHref({ ...params, fecha }));
  }

  /**
   * Cierra el popover al hacer click fuera.
   */
  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }

    /**
     * Cierra el calendario si el click ocurre fuera del selector.
     *
     * @param event - Evento de pointer.
     */
    function handlePointerDown(event: MouseEvent): void {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPickerOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isPickerOpen]);

  const displayValue = isEditing ? draft : formatYmdDisplay(params.fecha);
  const selectedDate = ymdToLocalDate(params.fecha);

  return (
    <div className="relative flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-[5.5rem] flex-1" />

      <div ref={containerRef} className="relative flex items-center gap-2">
        <button
          type="button"
          aria-label="Día anterior"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
          onClick={() => commitFecha(addDaysYmd(params.fecha, -1))}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>

        <div className="relative flex items-center">
          <button
            type="button"
            aria-label="Abrir calendario"
            aria-expanded={isPickerOpen}
            aria-controls={pickerId}
            className="absolute left-2 z-10 inline-flex cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setIsPickerOpen((open) => !open)}
          >
            <Calendar className="size-4" aria-hidden />
          </button>
          <input
            id={inputId}
            type="text"
            aria-label="Fecha de la agenda"
            className="h-9 w-[15.5rem] rounded-md border border-border bg-background pl-8 pr-3 text-center text-sm text-foreground"
            value={displayValue}
            onFocus={() => {
              setDraft(ymdToDmy(params.fecha));
              setIsEditing(true);
            }}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              const parsed = parseDmy(next);
              if (parsed) {
                commitFecha(parsed);
              }
            }}
            onBlur={() => {
              const parsed = parseDmy(draft);
              if (parsed) {
                commitFecha(parsed);
              }
              setIsEditing(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.currentTarget.blur();
              }
            }}
          />
        </div>

        <button
          type="button"
          aria-label="Día siguiente"
          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-border text-foreground hover:bg-muted"
          onClick={() => commitFecha(addDaysYmd(params.fecha, 1))}
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>

        {isPickerOpen && (
          <div
            id={pickerId}
            className="absolute top-full z-20 mt-2 rounded-md border border-border bg-background p-2 shadow-glass"
          >
            <DayPicker
              className="agenda-dia-picker"
              mode="single"
              locale={es}
              month={selectedDate}
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) {
                  return;
                }
                commitFecha(localDateToYmd(date));
                setIsPickerOpen(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="flex min-w-[5.5rem] flex-1 justify-end">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-semibold uppercase tracking-wide text-foreground hover:bg-muted"
          onClick={() => commitFecha(todayYmd())}
        >
          Hoy
        </button>
      </div>
    </div>
  );
}
