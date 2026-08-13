import type { AuthRole } from '@turnos/shared-types';
import { ROLE_HOME_PATHS } from '@turnos/shared-types';

/**
 * Resuelve la ruta de panel según el rol del usuario.
 *
 * @param rol - Rol autenticado.
 * @returns Path absoluto del panel.
 */
export function homePathForRole(rol: AuthRole): string {
  return ROLE_HOME_PATHS[rol];
}
