import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';

const replace = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, refresh }),
}));

vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/auth-client')>(
    '@/lib/api/auth-client',
  );
  return {
    ...actual,
    loginRequest: vi.fn(),
  };
});

import { ApiError, loginRequest } from '@/lib/api/auth-client';

describe('LoginForm', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra validación cuando el mail es inválido', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/correo electrónico/i), 'no-es-mail');
    await user.type(screen.getByLabelText(/^contraseña$/i), 'secreta');
    await user.click(screen.getByRole('button', { name: /^iniciar sesión$/i }));

    expect(await screen.findByText(/mail inválido/i)).toBeInTheDocument();
    expect(loginRequest).not.toHaveBeenCalled();
  });

  it('redirige al panel admin tras login exitoso', async () => {
    const user = userEvent.setup();
    vi.mocked(loginRequest).mockResolvedValue({
      user: {
        id: '1',
        mail: 'admin@clinica.local',
        nombre: 'Admin',
        apellido: 'Sistema',
        rol: 'ADMIN',
      },
    });

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      'admin@clinica.local',
    );
    await user.type(screen.getByLabelText(/^contraseña$/i), 'Admin123!@#$');
    await user.click(screen.getByRole('button', { name: /^iniciar sesión$/i }));

    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalled();
      expect(replace).toHaveBeenCalledWith('/usuarios');
    });
  });

  it('alterna visibilidad de contraseña e icono del ojo', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const toggle = screen.getByRole('button', { name: /mostrar contraseña/i });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggle);

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: /ocultar contraseña/i }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /ocultar contraseña/i }),
    );

    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('muestra error del servidor cuando las credenciales fallan', async () => {
    const user = userEvent.setup();
    vi.mocked(loginRequest).mockRejectedValue(
      new ApiError({
        statusCode: 401,
        message: 'Credenciales inválidas. Verifique mail y contraseña.',
        error: 'INVALID_CREDENTIALS',
        path: '/api/auth/login',
        timestamp: new Date().toISOString(),
      }),
    );

    render(<LoginForm />);

    await user.type(
      screen.getByLabelText(/correo electrónico/i),
      'admin@clinica.local',
    );
    await user.type(screen.getByLabelText(/^contraseña$/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /^iniciar sesión$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /credenciales inválidas/i,
    );
  });
});
