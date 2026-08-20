import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { todayYmd } from '@/lib/agenda/fecha-dia';
import { AgendaDiaSelector } from './agenda-dia-selector';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('AgendaDiaSelector', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    replace.mockClear();
  });

  it('muestra la fecha en formato día mes año', () => {
    render(
      <AgendaDiaSelector
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(screen.getByLabelText(/fecha de la agenda/i)).toHaveValue(
      '16 agosto 2026',
    );
  });

  it('avanza y retrocede un día con las flechas', async () => {
    const user = userEvent.setup();
    render(
      <AgendaDiaSelector
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /día siguiente/i }));
    expect(replace).toHaveBeenCalledWith(
      '/agenda?vista=dia&cancelados=true&fecha=2026-08-17',
    );

    replace.mockClear();
    await user.click(screen.getByRole('button', { name: /día anterior/i }));
    expect(replace).toHaveBeenCalledWith(
      '/agenda?vista=dia&cancelados=true&fecha=2026-08-15',
    );
  });

  it('el botón HOY fija la fecha actual', async () => {
    const user = userEvent.setup();
    render(
      <AgendaDiaSelector
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^hoy$/i }));
    expect(replace).toHaveBeenCalledWith(
      `/agenda?vista=dia&cancelados=true&fecha=${todayYmd()}`,
    );
  });
});
