import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgendaPendientesToggle } from './agenda-pendientes-toggle';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('AgendaPendientesToggle', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    replace.mockClear();
  });

  it('refleja el valor inicial del param soloPendientes', () => {
    render(
      <AgendaPendientesToggle
        params={{
          vista: 'lista',
          soloPendientes: true,
          fecha: '2026-08-16',
        }}
      />,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('actualiza query param soloPendientes', async () => {
    const user = userEvent.setup();
    render(
      <AgendaPendientesToggle
        params={{
          vista: 'lista',
          soloPendientes: false,
          fecha: '2026-08-16',
        }}
      />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(replace).toHaveBeenCalledWith(
      '/agenda?soloPendientes=true&fecha=2026-08-16',
    );
  });
});
