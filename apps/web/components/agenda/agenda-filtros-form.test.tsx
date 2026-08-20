import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  fetchPacientes: vi
    .fn()
    .mockResolvedValue([{ id: 'p1', nombre: 'María', apellido: 'González' }]),
}));

function renderWithQuery(ui: React.ReactElement) {
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

  it('muestra opción Todos para recepcionista', async () => {
    renderWithQuery(
      <AgendaFiltrosForm
        rol="RECEPCIONISTA"
        params={{
          vista: 'lista',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByLabelText(/^médico$/i)).toBeInTheDocument();
    expect(
      screen.getAllByRole('option', { name: /todos/i }).length,
    ).toBeGreaterThan(0);
  });

  it('deshabilita médico para rol MEDICO', async () => {
    renderWithQuery(
      <AgendaFiltrosForm
        rol="MEDICO"
        params={{
          vista: 'lista',
          medicoId: 'm1',
          cancelados: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(await screen.findByLabelText(/^médico$/i)).toBeDisabled();
  });

  it('actualiza la URL al aplicar filtros', async () => {
    const user = userEvent.setup();
    renderWithQuery(
      <AgendaFiltrosForm
        rol="RECEPCIONISTA"
        params={{
          vista: 'lista',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    const medicoSelect = await screen.findByLabelText(/^médico$/i);
    await waitFor(() => {
      expect(
        screen.getByRole('option', { name: /médico,\s*carlos/i }),
      ).toBeInTheDocument();
    });
    await user.selectOptions(medicoSelect, 'm1');
    await user.click(screen.getByRole('button', { name: /aplicar/i }));

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(
        '/agenda?medicoId=m1&cancelados=true&fecha=2026-08-16',
      );
    });
  });
});
