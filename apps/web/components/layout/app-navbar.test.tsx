import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { AppNavbar } from './app-navbar';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} />
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/auth-client')>(
    '@/lib/api/auth-client',
  );
  return {
    ...actual,
    logoutRequest: vi.fn(),
  };
});

import { ApiError, logoutRequest } from '@/lib/api/auth-client';

const user = {
  id: 'u1',
  mail: 'a@b.com',
  nombre: 'Ana',
  apellido: 'Pérez',
  rol: 'ADMIN' as const,
};

/**
 * Render de la navbar con feedback para el dialog de error.
 */
function renderNavbar() {
  return render(
    <FeedbackProvider>
      <AppNavbar user={user} onOpenMobileNav={() => undefined} />
    </FeedbackProvider>,
  );
}

describe('AppNavbar', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el nombre y abre el menú con Cerrar sesión', async () => {
    const events = userEvent.setup();
    renderNavbar();

    expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: /cerrar sesión/i }),
    ).not.toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: /perfil/i }));

    expect(
      screen.getByRole('menuitem', { name: /cerrar sesión/i }),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('cierra el menú al segundo click en el perfil', async () => {
    const events = userEvent.setup();
    renderNavbar();

    const perfil = screen.getByRole('button', { name: /perfil/i });
    await events.click(perfil);
    expect(
      screen.getByRole('menuitem', { name: /cerrar sesión/i }),
    ).toBeInTheDocument();

    await events.click(perfil);
    expect(
      screen.queryByRole('menuitem', { name: /cerrar sesión/i }),
    ).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('redirige al login tras un logout exitoso', async () => {
    const events = userEvent.setup();
    vi.mocked(logoutRequest).mockResolvedValue(undefined);
    renderNavbar();

    await events.click(screen.getByRole('button', { name: /perfil/i }));
    await events.click(
      screen.getByRole('menuitem', { name: /cerrar sesión/i }),
    );

    await waitFor(() => {
      expect(logoutRequest).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith('/login');
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('muestra el dialog de error y no redirige si el logout falla', async () => {
    const events = userEvent.setup();
    vi.mocked(logoutRequest).mockRejectedValue(
      new ApiError({
        statusCode: 500,
        message: 'Fallo al cerrar sesión',
        error: 'Internal Server Error',
        path: '/api/auth/logout',
        timestamp: new Date().toISOString(),
      }),
    );
    renderNavbar();

    await events.click(screen.getByRole('button', { name: /perfil/i }));
    await events.click(
      screen.getByRole('menuitem', { name: /cerrar sesión/i }),
    );

    expect(
      await screen.findByText(/no se pudo cerrar la sesión/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Fallo al cerrar sesión')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });
});
