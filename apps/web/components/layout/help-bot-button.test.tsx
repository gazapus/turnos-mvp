import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HelpBotButton } from './help-bot-button';

describe('HelpBotButton', () => {
  it('registra click en consola', async () => {
    const user = userEvent.setup();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    render(<HelpBotButton />);
    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));

    expect(log).toHaveBeenCalledWith('[shell] ayuda-bot clicked');
    log.mockRestore();
  });
});
