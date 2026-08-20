import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgendaTabs } from './agenda-tabs';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('AgendaTabs', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    replace.mockClear();
  });

  it('marca Lista como tab activa por defecto', () => {
    render(
      <AgendaTabs
        params={{
          vista: 'lista',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(screen.getByRole('tab', { name: /lista/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('actualiza vista en la URL al cambiar de tab', async () => {
    const user = userEvent.setup();
    render(
      <AgendaTabs
        params={{
          vista: 'lista',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /día/i }));

    expect(replace).toHaveBeenCalledWith(
      '/agenda?vista=dia&cancelados=true&fecha=2026-08-16',
    );
  });

  it('conserva fecha al cambiar de tab', async () => {
    const user = userEvent.setup();
    render(
      <AgendaTabs
        params={{
          vista: 'dia',
          cancelados: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(screen.getByRole('tab', { name: /lista/i }));

    expect(replace).toHaveBeenCalledWith(
      '/agenda?cancelados=true&fecha=2026-08-16',
    );
  });
});
