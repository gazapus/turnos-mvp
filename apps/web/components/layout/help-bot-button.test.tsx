import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HelpBotButton } from './help-bot-button';

describe('HelpBotButton', () => {
  afterEach(() => {
    cleanup();
  });

  it('dispara onToggle al hacer click', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<HelpBotButton open={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: /ayuda bot/i })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('mantiene el hover sin levantarse del borde inferior', () => {
    render(<HelpBotButton open={false} onToggle={vi.fn()} />);
    const boton = screen.getByRole('button', { name: /ayuda bot/i });

    expect(boton.className).toContain('hover:bg-primary-hover');
    expect(boton.className).toContain('origin-bottom');
    expect(boton.className).not.toContain('-translate-y');
  });
});
