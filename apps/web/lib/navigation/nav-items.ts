import type { AuthRole } from '@turnos/shared-types';
import { AUTH_ROLES } from '@turnos/shared-types';

/**
 * Rutas de paneles del shell autenticado.
 */
export const APP_PATHS = {
  AGENDA: '/agenda',
  CONSULTORIOS: '/consultorios',
  PACIENTES: '/pacientes',
  USUARIOS: '/usuarios',
  SALA_ESPERA: '/sala-espera',
} as const;

/**
 * Identificador de icono de navegación (mapeado a Lucide en el sidebar).
 */
export type NavIconId =
  'agenda' | 'consultorios' | 'pacientes' | 'usuarios' | 'sala-espera';

/**
 * Ítem de menú del sidebar.
 */
export type AppNavItem = {
  id: string;
  label: string;
  href: (typeof APP_PATHS)[keyof typeof APP_PATHS];
  icon: NavIconId;
  roles: readonly AuthRole[];
};

const ALL_ROLES = AUTH_ROLES;

const STAFF_ROLES = [
  'ADMIN',
  'RECEPCIONISTA',
] as const satisfies readonly AuthRole[];

/**
 * Catálogo completo de navegación; filtrar con {@link navItemsForRole}.
 */
export const APP_NAV_ITEMS: readonly AppNavItem[] = [
  {
    id: 'agenda',
    label: 'AGENDA',
    href: APP_PATHS.AGENDA,
    icon: 'agenda',
    roles: ALL_ROLES,
  },
  {
    id: 'consultorios',
    label: 'CONSULTORIOS',
    href: APP_PATHS.CONSULTORIOS,
    icon: 'consultorios',
    roles: STAFF_ROLES,
  },
  {
    id: 'pacientes',
    label: 'PACIENTES',
    href: APP_PATHS.PACIENTES,
    icon: 'pacientes',
    roles: STAFF_ROLES,
  },
  {
    id: 'usuarios',
    label: 'USUARIOS',
    href: APP_PATHS.USUARIOS,
    icon: 'usuarios',
    roles: ['ADMIN'],
  },
  {
    id: 'sala-espera',
    label: 'SALA DE ESPERA',
    href: APP_PATHS.SALA_ESPERA,
    icon: 'sala-espera',
    roles: STAFF_ROLES,
  },
] as const;

/**
 * Prefijos de rutas protegidas por sesión (middleware).
 */
export const PROTECTED_APP_PREFIXES = [
  APP_PATHS.AGENDA,
  APP_PATHS.CONSULTORIOS,
  APP_PATHS.PACIENTES,
  APP_PATHS.USUARIOS,
  APP_PATHS.SALA_ESPERA,
] as const;

/**
 * Clave localStorage para el estado colapsado del sidebar (desktop).
 */
export const SIDEBAR_COLLAPSED_STORAGE_KEY =
  'turnos-sidebar-collapsed' as const;

/**
 * Filtra las opciones de menú visibles para un rol.
 *
 * @param rol - Rol del usuario autenticado.
 * @returns Ítems de navegación permitidos.
 */
export function navItemsForRole(rol: AuthRole): AppNavItem[] {
  return APP_NAV_ITEMS.filter((item) => item.roles.includes(rol));
}
