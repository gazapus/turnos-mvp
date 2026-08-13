import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppNavbar } from './app-navbar';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} />
  ),
}));

describe('AppNavbar', () => {
  const user = {
    id: 'u1',
    mail: 'a@b.com',
    nombre: 'Ana',
    apellido: 'Pérez',
    rol: 'ADMIN' as const,
  };

  it('muestra nombre de usuario y registra click de perfil', async () => {
    const events = userEvent.setup();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    render(<AppNavbar user={user} onOpenMobileNav={() => undefined} />);

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    await events.click(screen.getByRole('button', { name: /perfil/i }));
    expect(log).toHaveBeenCalledWith('[shell] perfil clicked', {
      userId: 'u1',
    });
    log.mockRestore();
  });
});
