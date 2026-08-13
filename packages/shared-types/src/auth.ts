/**
 * Roles de usuario autenticado (alineados a RolUsuario de Prisma).
 */
export const AUTH_ROLES = ['ADMIN', 'RECEPCIONISTA', 'MEDICO'] as const;

/**
 * Rol de un usuario de sesión.
 */
export type AuthRole = (typeof AUTH_ROLES)[number];

/**
 * Credenciales de inicio de sesión.
 */
export interface LoginRequest {
  mail: string;
  password: string;
}

/**
 * Datos públicos del usuario autenticado (sin secretos).
 */
export interface AuthUser {
  id: string;
  mail: string;
  nombre: string;
  apellido: string;
  rol: AuthRole;
}

/**
 * Respuesta de login exitoso.
 */
export interface LoginResponse {
  user: AuthUser;
}

/**
 * Códigos de error de autenticación tipados.
 */
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

/**
 * Código de error de autenticación.
 */
export type AuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/**
 * Nombre de la cookie httpOnly de sesión JWT.
 */
export const AUTH_COOKIE_NAME = 'turnos_session' as const;

/**
 * Rutas de panel post-login por rol.
 */
export const ROLE_HOME_PATHS = {
  ADMIN: '/usuarios',
  RECEPCIONISTA: '/agenda',
  MEDICO: '/agenda',
} as const satisfies Record<AuthRole, string>;
