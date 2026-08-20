import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTurnos } from '@/lib/api/turnos-client';
import { TurnosListado } from './turnos-listado';

const mockFetchTurnos = vi.mocked(fetchTurnos);

vi.mock('@/lib/api/turnos-client', () => ({
  fetchTurnos: vi.fn(),
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('TurnosListado', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza columnas de la grilla', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [
        {
          id: 't1',
          fecha: '2026-08-16',
          hora: '09:00',
          horaFin: '09:30',
          paciente: { nombre: 'María', apellido: 'González' },
          medico: { nombre: 'Carlos', apellido: 'Médico' },
          especialidad: { nombre: 'Cardiología' },
          estado: 'PROGRAMADO',
          tipo: 'PRIMER_TURNO',
        },
        {
          id: 't2',
          fecha: '2026-08-16',
          hora: '09:30',
          horaFin: '10:00',
          paciente: { nombre: 'Ana', apellido: 'López' },
          medico: { nombre: 'Laura', apellido: 'Gómez' },
          especialidad: { nombre: 'Clínica Médica' },
          estado: 'CANCELADO',
          tipo: 'CONTROL',
        },
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={{ vista: 'lista', cancelados: true, fecha: '2026-08-16' }}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(screen.getByText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByText(/acciones/i)).toBeInTheDocument();
    expect(screen.getByTestId('turnos-listado-scroll')).toBeInTheDocument();
  });

  it('oculta cancelados en memoria cuando el checkbox está desmarcado', async () => {
    mockFetchTurnos.mockResolvedValue({
      items: [
        {
          id: 't1',
          fecha: '2026-08-16',
          hora: '09:00',
          horaFin: '09:30',
          paciente: { nombre: 'María', apellido: 'González' },
          medico: { nombre: 'Carlos', apellido: 'Médico' },
          especialidad: { nombre: 'Cardiología' },
          estado: 'PROGRAMADO',
          tipo: 'PRIMER_TURNO',
        },
        {
          id: 't2',
          fecha: '2026-08-16',
          hora: '09:30',
          horaFin: '10:00',
          paciente: { nombre: 'Ana', apellido: 'López' },
          medico: { nombre: 'Laura', apellido: 'Gómez' },
          especialidad: { nombre: 'Clínica Médica' },
          estado: 'CANCELADO',
          tipo: 'CONTROL',
        },
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={{ vista: 'lista', cancelados: false, fecha: '2026-08-16' }}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(screen.queryByText(/lópez,\s*ana/i)).not.toBeInTheDocument();
  });

  it('mantiene el contenedor de scroll y pide la siguiente página si solo hay cancelados', async () => {
    mockFetchTurnos
      .mockResolvedValueOnce({
        items: [
          {
            id: 't-cancelado',
            fecha: '2026-08-16',
            hora: '09:30',
            horaFin: '10:00',
            paciente: { nombre: 'Ana', apellido: 'López' },
            medico: { nombre: 'Laura', apellido: 'Gómez' },
            especialidad: { nombre: 'Clínica Médica' },
            estado: 'CANCELADO',
            tipo: 'CONTROL',
          },
        ],
        cursorSiguiente: 'cursor-sig',
        cursorAnterior: null,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 't-programado',
            fecha: '2026-08-16',
            hora: '10:00',
            horaFin: '10:30',
            paciente: { nombre: 'María', apellido: 'González' },
            medico: { nombre: 'Carlos', apellido: 'Médico' },
            especialidad: { nombre: 'Cardiología' },
            estado: 'PROGRAMADO',
            tipo: 'PRIMER_TURNO',
          },
        ],
        cursorSiguiente: null,
        cursorAnterior: null,
      });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={{ vista: 'lista', cancelados: false, fecha: '2026-08-16' }}
      />,
    );

    expect(screen.getByTestId('turnos-listado-scroll')).toBeInTheDocument();

    await waitFor(() => {
      expect(mockFetchTurnos).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
  });
});
