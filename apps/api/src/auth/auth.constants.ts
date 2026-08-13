/**
 * Constantes del módulo de autenticación.
 */
export const AUTH_CONSTANTS = {
  MAX_FAILED_ATTEMPTS: 3,
  LOCK_DURATION_MS: 10 * 60 * 1000,
  JWT_EXPIRES_IN: '8h',
  GENERIC_CREDENTIALS_MESSAGE:
    'Credenciales inválidas. Verifique mail y contraseña.',
  LOCKED_MESSAGE:
    'Acceso temporalmente bloqueado. Intente nuevamente en unos minutos.',
} as const;
