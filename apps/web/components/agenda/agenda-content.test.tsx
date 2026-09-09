import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser } from '@turnos/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { AgendaContent } from './agenda-content';

const replace = vi.fn();

vi.mock('@/app/agenda-dia.css', () => ({}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api/turnos-client', () => ({
  fetchTurnos: vi.fn().mockResolvedValue({
    items: [],
    cursorSiguiente: null,
    cursorAnterior: null,
  }),
  fetchMedicos: vi.fn().mockResolvedValue([
    {
      id: 'm1',
      nombre: 'Carlos',
      apellido: 'Médico',
      especialidadIds: ['e1'],
    },
  ]),
  fetchEspecialidades: vi
    .fn()
    .mockResolvedValue([
      { id: 'e1', nombre: 'Cardiología', medicoIds: ['m1'] },
    ]),
  fetchPacientes: vi.fn().mockResolvedValue([]),
  fetchPacienteById: vi.fn(),
  fetchPacienteByDocumento: vi.fn().mockResolvedValue(null),
  fetchTurnoById: vi.fn(),
  fetchPrimeraVez: vi.fn().mockResolvedValue({ primeraVez: true }),
  createTurno: vi.fn(),
  updateTurno: vi.fn(),
  confirmarTurno: vi.fn(),
}));

const recepcionista: AuthUser = {
  id: 'r1',
  mail: 'r@test.com',
  nombre: 'Ana',
  apellido: 'Recepción',
  rol: 'RECEPCIONISTA',
};

const medico: AuthUser = {
  id: 'm1',
  mail: 'm@test.com',
  nombre: 'Carlos',
  apellido: 'Médico',
  rol: 'MEDICO',
};

const listaParams = {
  vista: 'lista' as const,
  soloPendientes: false,
  fecha: '2026-09-07',
};

describe('AgendaContent', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('abre el popup de alta al clickear Nuevo Turno', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <AgendaContent user={recepcionista} params={listaParams} />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: /nuevo turno/i }));
    expect(
      await screen.findByRole('heading', { name: /nuevo turno/i }),
    ).toBeInTheDocument();
  });

  it('no muestra Nuevo Turno para el médico', () => {
    render(
      <FeedbackProvider>
        <AgendaContent user={medico} params={listaParams} />
      </FeedbackProvider>,
    );

    expect(
      screen.queryByRole('button', { name: /nuevo turno/i }),
    ).not.toBeInTheDocument();
  });
});
