import type { ReactElement } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { TurnoListItemDto } from '@turnos/shared-types';
import { FeedbackProvider } from '@/components/ui';
import { todayYmd } from '@/lib/agenda/fecha-dia';
import { confirmarTurno, fetchTurnos } from '@/lib/api/turnos-client';
import { TurnosListado } from './turnos-listado';

const mockFetchTurnos = vi.mocked(fetchTurnos);
const mockConfirmarTurno = vi.mocked(confirmarTurno);

vi.mock('@/lib/api/turnos-client', () => ({
  fetchTurnos: vi.fn(),
  confirmarTurno: vi.fn(),
}));

const listaParams = {
  vista: 'lista' as const,
  soloPendientes: false,
  fecha: '2026-08-16',
};

/**
 * Ítem mínimo de turno para el listado.
 *
 * @param id - Identificador del turno.
 * @returns DTO de fila.
 */
function listItem(id: string): TurnoListItemDto {
  return {
    id,
    fecha: '2026-08-16',
    hora: '09:00',
    horaFin: '09:30',
    paciente: { nombre: 'María', apellido: 'González' },
    medico: { nombre: 'Carlos', apellido: 'Médico' },
    especialidad: { nombre: 'Cardiología' },
    estado: 'PROGRAMADO',
    tipo: 'PRIMER_TURNO',
  };
}

/**
 * Fija métricas de scroll en jsdom y dispara el evento.
 *
 * @param el - Contenedor scrolleable.
 * @param metrics - scrollTop, clientHeight y scrollHeight.
 */
function fireScroll(
  el: HTMLElement,
  metrics: { scrollTop: number; clientHeight: number; scrollHeight: number },
): void {
  Object.defineProperty(el, 'scrollTop', {
    configurable: true,
    value: metrics.scrollTop,
  });
  Object.defineProperty(el, 'clientHeight', {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    value: metrics.scrollHeight,
  });
  fireEvent.scroll(el);
}

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <FeedbackProvider>{ui}</FeedbackProvider>
    </QueryClientProvider>,
  );
}

describe('TurnosListado', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza columnas de la grilla', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [listItem('t1')],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(screen.getByText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByText(/acciones/i)).toBeInTheDocument();
    expect(screen.getByTestId('turnos-listado-scroll')).toBeInTheDocument();
  });

  it('consulta el backend con soloPendientes', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [listItem('t1')],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="MEDICO"
        params={{
          ...listaParams,
          medicoId: 'm1',
          soloPendientes: true,
        }}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(mockFetchTurnos).toHaveBeenCalledWith(
      expect.objectContaining({
        soloPendientes: true,
        medicoId: 'm1',
      }),
    );
  });

  it('no pide página anterior si la primera página está vacía con cursorAnterior', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [],
      cursorSiguiente: null,
      cursorAnterior: 'c-prev',
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(
        /no hay turnos para mostrar con los filtros actuales/i,
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchTurnos).toHaveBeenCalledTimes(1);
    });
    expect(
      mockFetchTurnos.mock.calls.some(
        ([query]) => query.direccion === 'anterior',
      ),
    ).toBe(false);
  });

  it('no pide página anterior al scrollear al tope con cursorAnterior', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [listItem('t1')],
      cursorSiguiente: null,
      cursorAnterior: 'c-prev',
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();

    fireScroll(screen.getByTestId('turnos-listado-scroll'), {
      scrollTop: 0,
      clientHeight: 400,
      scrollHeight: 2000,
    });

    await waitFor(() => {
      expect(mockFetchTurnos).toHaveBeenCalledTimes(1);
    });
    expect(
      mockFetchTurnos.mock.calls.some(
        ([query]) => query.direccion === 'anterior',
      ),
    ).toBe(false);
  });

  it('primera carga consulta sin cursor', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [listItem('t1')],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(mockFetchTurnos).toHaveBeenCalledTimes(1);
    expect(mockFetchTurnos.mock.calls[0]?.[0].cursor).toBeUndefined();
  });

  it('al scrollear al fondo pide la página siguiente', async () => {
    mockFetchTurnos
      .mockResolvedValueOnce({
        items: [listItem('t1')],
        cursorSiguiente: 'c-next',
        cursorAnterior: 'c-prev',
      })
      .mockResolvedValueOnce({
        items: [
          {
            ...listItem('t2'),
            paciente: { nombre: 'Ana', apellido: 'Pérez' },
          },
        ],
        cursorSiguiente: null,
        cursorAnterior: 'c-next',
      });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={vi.fn()}
        onConfirmado={vi.fn()}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();

    fireScroll(screen.getByTestId('turnos-listado-scroll'), {
      scrollTop: 1600,
      clientHeight: 400,
      scrollHeight: 2000,
    });

    expect(await screen.findByText(/pérez,\s*ana/i)).toBeInTheDocument();
    expect(mockFetchTurnos).toHaveBeenCalledTimes(2);
    expect(mockFetchTurnos.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        cursor: 'c-next',
        direccion: 'siguiente',
      }),
    );
  });

  it('abre el detalle al clickear la fila y no al clickear Acciones', async () => {
    const user = userEvent.setup();
    const onAbrirTurno = vi.fn();
    mockFetchTurnos.mockResolvedValue({
      items: [listItem('t1')],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={onAbrirTurno}
        onConfirmado={vi.fn()}
      />,
    );

    await user.click(await screen.findByText(/gonzález,\s*maría/i));
    expect(onAbrirTurno).toHaveBeenCalledTimes(1);
    expect(onAbrirTurno).toHaveBeenCalledWith('t1');

    onAbrirTurno.mockClear();
    await user.click(screen.getByRole('button', { name: /cancelar turno/i }));
    expect(onAbrirTurno).not.toHaveBeenCalled();
  });

  it('click en Confirmar no abre el detalle', async () => {
    const user = userEvent.setup();
    const onAbrirTurno = vi.fn();
    mockConfirmarTurno.mockResolvedValue({} as never);
    mockFetchTurnos.mockResolvedValue({
      items: [{ ...listItem('t1'), fecha: todayYmd() }],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={listaParams}
        onAbrirTurno={onAbrirTurno}
        onConfirmado={vi.fn()}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: /confirmar paciente/i }),
    );
    expect(onAbrirTurno).not.toHaveBeenCalled();
    expect(mockConfirmarTurno).toHaveBeenCalledWith('t1');
  });
});
