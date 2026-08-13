'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ROLE_HOME_PATHS, type AuthRole } from '@turnos/shared-types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiError, loginRequest } from '@/lib/api/auth-client';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/login-schema';

/**
 * Formulario de inicio de sesión (leaf client): RHF + Zod + API cookie.
 *
 * @returns Formulario interactivo de login.
 */
export function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mail: '', password: '' },
  });

  /**
   * Envía credenciales al API y redirige según rol.
   *
   * @param values - Valores validados del formulario.
   */
  async function onSubmit(values: LoginFormValues): Promise<void> {
    setServerError(null);
    try {
      const result = await loginRequest(values);
      const rol = result.user.rol as AuthRole;
      router.replace(ROLE_HOME_PATHS[rol]);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        return;
      }
      setServerError(
        'No se pudo conectar con el servidor. Intente nuevamente.',
      );
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold text-on-elevated"
          htmlFor="mail"
        >
          Correo electrónico
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              aria-hidden
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <input
            id="mail"
            type="email"
            autoComplete="email"
            placeholder="nombre@clinica.com"
            className="block w-full rounded-lg border-none bg-input py-2.5 pl-10 pr-3 text-sm text-input-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('mail')}
          />
        </div>
        {errors.mail && (
          <p className="mt-1 text-xs text-danger">{errors.mail.message}</p>
        )}
      </div>

      <div>
        <label
          className="mb-1.5 block text-xs font-semibold text-on-elevated"
          htmlFor="password"
        >
          Contraseña
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              aria-hidden
              className="h-5 w-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className="block w-full rounded-lg border-none bg-input py-2.5 pl-10 pr-10 text-sm text-input-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            {...register('password')}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-muted-foreground hover:text-foreground"
            aria-label={
              showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <svg
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg
                aria-hidden
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      {serverError && (
        <p
          className="rounded-md bg-danger-foreground px-3 py-2 text-sm text-danger"
          role="alert"
        >
          {serverError}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full cursor-pointer items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          <svg
            aria-hidden
            className="ml-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M14 5l7 7m0 0l-7 7m7-7H3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        ¿No puedes ingresar?{' '}
        <span className="font-semibold text-link-accent">
          Contacta al administrador.
        </span>
      </p>
    </form>
  );
}
