import type { ReactElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchTurnos } from '@/lib/api/turnos-client';
import { TurnosListado } from './turnos-listado';

const mockFetchTurnos = vi.mocked(fetchTurnos);

vi.mock('@/lib/api/turnos-client', () => ({
  fetchTurnos: vi.fn(),
}));

function renderWithQuery(ui: ReactElement) {
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
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="RECEPCIONISTA"
        params={{
          vista: 'lista',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByText(/gonzález,\s*maría/i)).toBeInTheDocument();
    expect(screen.getByText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByText(/acciones/i)).toBeInTheDocument();
    expect(screen.getByTestId('turnos-listado-scroll')).toBeInTheDocument();
  });

  it('consulta el backend con soloPendientes', async () => {
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
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    renderWithQuery(
      <TurnosListado
        rol="MEDICO"
        params={{
          vista: 'lista',
          medicoId: 'm1',
          soloPendientes: true,
          fecha: '2026-08-16',
        }}
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
});
