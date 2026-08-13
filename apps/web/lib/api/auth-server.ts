import { AUTH_COOKIE_NAME, type AuthUser } from '@turnos/shared-types';
import { cookies } from 'next/headers';

/**
 * Origen del API Nest (mismo default que next.config rewrites).
 */
function apiOrigin(): string {
  return process.env.API_URL ?? 'http://localhost:3001';
}

/**
 * Obtiene el usuario de sesión en Server Components (forward de cookie).
 *
 * @returns Usuario autenticado o null si no hay sesión válida.
 */
export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${apiOrigin()}/api/auth/me`, {
      method: 'GET',
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as AuthUser;
  } catch {
    return null;
  }
}
