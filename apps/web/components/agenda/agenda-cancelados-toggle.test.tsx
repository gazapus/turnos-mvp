import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgendaCanceladosToggle } from './agenda-cancelados-toggle';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

describe('AgendaCanceladosToggle', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    replace.mockClear();
  });

  it('refleja el valor inicial del param cancelados', () => {
    render(
      <AgendaCanceladosToggle
        params={{
          vista: 'lista',
          cancelados: true,
        }}
      />,
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('actualiza query param cancelados sin refetch implícito', async () => {
    const user = userEvent.setup();
    render(
      <AgendaCanceladosToggle
        params={{
          vista: 'lista',
          cancelados: false,
        }}
      />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(replace).toHaveBeenCalledWith('/agenda?cancelados=true');
  });
});
