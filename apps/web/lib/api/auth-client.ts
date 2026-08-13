import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
} from '@turnos/shared-types';

/**
 * Shape de error de la API Nest (AllExceptionsFilter).
 */
export type ApiErrorBody = {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
};

/**
 * Error HTTP tipado desde el backend.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  /**
   * @param body - Cuerpo de error de la API.
   */
  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.statusCode = body.statusCode;
    this.code = body.error;
  }
}

/**
 * Fetch JSON same-origin (proxy Next → Nest) con cookies.
 *
 * @param path - Ruta relativa bajo `/api`.
 * @param init - Opciones fetch.
 * @returns JSON tipado.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      data !== null &&
      typeof data === 'object' &&
      'message' in data &&
      'statusCode' in data
    ) {
      throw new ApiError(data as ApiErrorBody);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  return data as T;
}

/**
 * Inicia sesión con mail y contraseña.
 *
 * @param body - Credenciales.
 * @returns Usuario autenticado.
 */
export function loginRequest(body: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Cierra la sesión actual.
 */
export function logoutRequest(): Promise<void> {
  return apiFetch<void>('/api/auth/logout', { method: 'POST' });
}

/**
 * Consulta la sesión actual.
 *
 * @returns Usuario autenticado o null si no hay sesión.
 */
export async function meRequest(): Promise<AuthUser | null> {
  try {
    return await apiFetch<AuthUser>('/api/auth/me', { method: 'GET' });
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return null;
    }
    throw error;
  }
}
