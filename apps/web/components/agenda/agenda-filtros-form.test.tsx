import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AuthUser } from '@turnos/shared-types';
import type { ReactElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPacientes } from '@/lib/api/turnos-client';
import { AgendaFiltrosForm } from './agenda-filtros-form';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/lib/api/turnos-client', () => ({
  fetchMedicos: vi
    .fn()
    .mockResolvedValue([{ id: 'm1', nombre: 'Carlos', apellido: 'Médico' }]),
  fetchEspecialidades: vi
    .fn()
    .mockResolvedValue([{ id: 'e1', nombre: 'Cardiología' }]),
  fetchPacientes: vi.fn().mockResolvedValue([]),
  fetchPacienteById: vi.fn().mockResolvedValue({
    id: 'p1',
    nombre: 'María',
    apellido: 'González',
  }),
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

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

describe('AgendaFiltrosForm', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    replace.mockClear();
  });

  it('muestra placeholder Todos para recepcionista', async () => {
    renderWithQuery(
      <AgendaFiltrosForm
        user={recepcionista}
        params={{
          vista: 'lista',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByLabelText(/^médico$/i)).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText(/todos/i).length).toBeGreaterThan(0);
  });

  it('deshabilita médico para rol MEDICO', async () => {
    renderWithQuery(
      <AgendaFiltrosForm
        user={medico}
        params={{
          vista: 'lista',
          medicoId: 'm1',
          soloPendientes: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByLabelText(/^médico$/i)).toBeDisabled();
  });

  it('actualiza la URL al aplicar un médico', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AgendaFiltrosForm
        user={recepcionista}
        params={{
          vista: 'lista',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    const medicoInput = await screen.findByLabelText(/^médico$/i);
    await user.click(medicoInput);
    await user.click(
      await screen.findByRole('option', { name: /médico,\s*carlos/i }),
    );
    await user.click(screen.getByRole('button', { name: /aplicar/i }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/agenda?medicoId=m1&soloPendientes=false&fecha=2026-08-16',
      );
    });
  });

  it('resetea filtros a defaults del rol y dispara la búsqueda', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AgendaFiltrosForm
        user={recepcionista}
        params={{
          vista: 'lista',
          medicoId: 'm1',
          pacienteId: 'p1',
          soloPendientes: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: /restablecer filtros/i }),
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/agenda?soloPendientes=false&fecha=2026-08-16',
      );
    });
  });

  it('conserva el médico al resetear con rol MEDICO', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AgendaFiltrosForm
        user={medico}
        params={{
          vista: 'lista',
          medicoId: 'm1',
          especialidadId: 'e1',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(
      await screen.findByRole('button', { name: /restablecer filtros/i }),
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/agenda?medicoId=m1&soloPendientes=true&fecha=2026-08-16',
      );
    });
  });

  it('no busca pacientes con menos de 3 caracteres', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <AgendaFiltrosForm
        user={recepcionista}
        params={{
          vista: 'lista',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    const pacienteInput = await screen.findByLabelText(/^paciente$/i);
    await user.type(pacienteInput, 'ab');

    expect(fetchPacientes).not.toHaveBeenCalled();
  });

  it('hidrata el paciente seleccionado por id', async () => {
    renderWithQuery(
      <AgendaFiltrosForm
        user={recepcionista}
        params={{
          vista: 'lista',
          pacienteId: 'p1',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/^paciente$/i)).toHaveValue(
        'González, María',
      );
    });
  });
});
