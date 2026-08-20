import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { TurnoListItemDto } from '@turnos/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';

import { AGENDA_DIA_MIN_WIDTH_PX } from '@/lib/agenda/turno-dia-layout';
import { fetchTurnos } from '@/lib/api/turnos-client';
import { toCalendarEvent } from '@/lib/agenda/turno-dia-event';
import { AgendaDia } from './agenda-dia';

const mockFetchTurnos = vi.mocked(fetchTurnos);
const mockUpdateSize = vi.fn();
const mockGotoDate = vi.fn();

vi.mock('@/app/agenda-dia.css', () => ({}));
vi.mock('@/lib/api/turnos-client', () => ({
  fetchTurnos: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@fullcalendar/timegrid', () => ({ default: {} }));
vi.mock('@fullcalendar/core/locales/es', () => ({ default: {} }));
vi.mock('@fullcalendar/react', () => ({
  default: React.forwardRef(function FullCalendarMock(
    {
      events,
      eventContent,
    }: {
      events: Array<{
        id: string;
        extendedProps: { turno: TurnoListItemDto };
      }>;
      eventContent: (arg: {
        event: { extendedProps: { turno: TurnoListItemDto } };
      }) => React.ReactNode;
    },
    ref: React.ForwardedRef<{ getApi: () => { updateSize: () => void; gotoDate: (date: string) => void } }>,
  ) {
    React.useImperativeHandle(ref, () => ({
      getApi: () => ({
        updateSize: mockUpdateSize,
        gotoDate: mockGotoDate,
      }),
    }));

    return (
      <div data-testid="fullcalendar-mock">
        {events.map((event) => (
          <div key={event.id}>
            {eventContent({
              event: { extendedProps: event.extendedProps },
            })}
          </div>
        ))}
      </div>
    );
  }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

const programado: TurnoListItemDto = {
  id: 't1',
  fecha: '2026-08-16',
  hora: '09:00',
  horaFin: '09:30',
  paciente: { nombre: 'Pepin', apellido: 'Gonzales' },
  medico: { nombre: 'Julio', apellido: 'Alarcón' },
  especialidad: { nombre: 'Cardiología' },
  estado: 'PROGRAMADO',
  tipo: 'PRIMER_TURNO',
};

const cancelado: TurnoListItemDto = {
  id: 't2',
  fecha: '2026-08-16',
  hora: '10:00',
  horaFin: '10:30',
  paciente: { nombre: 'Ana', apellido: 'López' },
  medico: { nombre: 'Laura', apellido: 'Gómez' },
  especialidad: { nombre: 'Clínica Médica' },
  estado: 'CANCELADO',
  tipo: 'CONTROL',
};

describe('toCalendarEvent', () => {
  it('mapea fecha, hora y horaFin a start/end', () => {
    const event = toCalendarEvent(programado);
    expect(event.start).toBe('2026-08-16T09:00:00');
    expect(event.end).toBe('2026-08-16T09:30:00');
    expect(event.extendedProps.turno.id).toBe('t1');
  });
});

describe('AgendaDia', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUpdateSize.mockClear();
    mockGotoDate.mockClear();
  });

  it('renderiza médico, paciente, estado y tipo en el eventContent', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [programado],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <AgendaDia
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByText(/julio alarcón/i)).toBeInTheDocument();
    expect(screen.getByText(/pepin gonzales/i)).toBeInTheDocument();
    expect(screen.getByText(/programado/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Programado')).toHaveAttribute(
      'title',
      'Programado',
    );
    const tipoIcon = screen.getByLabelText(/primer turno/i);
    expect(tipoIcon.querySelector('img')).toHaveAttribute('width', '22');
  });

  it('usa un contenedor con altura explícita para que FullCalendar pinte la grilla', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [programado],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <AgendaDia
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    const panel = await screen.findByTestId('agenda-dia');
    expect(panel.className).toContain('glass-panel-agenda');
    expect(panel.className).toContain('overflow-x-auto');
    expect(panel.querySelector('.agenda-dia-min-width')).not.toBeNull();
    expect(AGENDA_DIA_MIN_WIDTH_PX).toBe(960);
    const calendar = screen.getByTestId('agenda-dia-calendar');
    expect(calendar.className).toContain('h-[calc(100dvh-24rem)]');
    expect(calendar.className).toContain('min-h-[32rem]');
    expect(calendar.className).toContain('flex-col');
  });

  it('oculta turnos cancelados en memoria cuando cancelados es false', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [programado, cancelado],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <AgendaDia
        params={{
          vista: 'dia',
          cancelados: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByText(/julio alarcón/i)).toBeInTheDocument();
    expect(screen.queryByText(/laura gómez/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ana lópez/i)).not.toBeInTheDocument();
  });

  it('observa el contenedor y llama updateSize cuando cambia el tamaño', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let resizeCallback: ResizeObserverCallback | undefined;

    class ResizeObserverMock {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback;
      }

      observe = observe;
      disconnect = disconnect;
      unobserve = vi.fn();
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);

    mockFetchTurnos.mockResolvedValue({
      items: [programado],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <AgendaDia
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await screen.findByText(/julio alarcón/i);

    const calendar = screen.getByTestId('agenda-dia-calendar');
    expect(observe).toHaveBeenCalledWith(calendar);

    mockUpdateSize.mockClear();
    resizeCallback?.([], {} as ResizeObserver);

    expect(mockUpdateSize).toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
