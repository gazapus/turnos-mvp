'use client';

import type { AuthRole } from '@turnos/shared-types';
import {
  Armchair,
  Badge,
  BriefcaseMedical,
  CalendarDays,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { navItemsForRole, type NavIconId } from '@/lib/navigation';

const LOGO_FULL = '/images/login/logo_completo.png';
const LOGO_ICON = '/images/login/logo_icono.png';

const NAV_ICONS: Record<NavIconId, LucideIcon> = {
  agenda: CalendarDays,
  consultorios: BriefcaseMedical,
  pacientes: Users,
  usuarios: Badge,
  'sala-espera': Armchair,
};

type AppSidebarProps = {
  rol: AuthRole;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
};

/**
 * Sidebar glass con menú por rol, colapso desktop y drawer mobile.
 *
 * @param props - Rol, estado colapsado/drawer y callbacks.
 * @returns Navegación lateral del shell.
 */
export function AppSidebar({
  rol,
  collapsed,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}: AppSidebarProps) {
  const pathname = usePathname();
  const items = navItemsForRole(rol);

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 hidden cursor-pointer bg-brand/40 max-md:block"
          aria-label="Cerrar menú"
          onClick={onCloseMobile}
        />
      ) : null}

      <nav
        className={[
          'glass-panel glass-panel-sidebar fixed top-0 left-0 z-50 flex h-dvh flex-col py-6 transition-all duration-300 ease-in-out',
          collapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
          'max-md:w-sidebar',
          mobileOpen
            ? 'max-md:translate-x-0'
            : 'max-md:-translate-x-full max-md:pointer-events-none',
        ].join(' ')}
        aria-label="Navegación principal"
      >
        <div className="mb-6 flex flex-col gap-3 px-4">
          <div className="flex min-h-10 w-full shrink-0 items-center max-md:justify-end">
            <button
              type="button"
              className="hidden w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground max-md:hidden md:inline-flex"
              aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
              onClick={onToggleCollapsed}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-5 shrink-0" aria-hidden />
              ) : (
                <>
                  <PanelLeftClose className="size-5 shrink-0" aria-hidden />
                  <span className="text-xs font-semibold tracking-wider">
                    OCULTAR
                  </span>
                </>
              )}
            </button>
            <button
              type="button"
              className="hidden cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground max-md:inline-flex"
              aria-label="Cerrar menú"
              onClick={onCloseMobile}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="flex h-sidebar-logo w-full shrink-0 items-center justify-center">
            <Image
              src={collapsed && !mobileOpen ? LOGO_ICON : LOGO_FULL}
              alt="Hospital Clínica Salud"
              width={collapsed && !mobileOpen ? 48 : 200}
              height={collapsed && !mobileOpen ? 48 : 123}
              className={
                collapsed && !mobileOpen
                  ? 'h-12 w-12 object-contain'
                  : 'h-full w-auto max-w-full object-contain px-2'
              }
              priority
            />
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 px-4">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={[
                  'group flex items-center gap-4 rounded-lg border-l-4 px-4 py-3 transition-colors',
                  active
                    ? 'border-nav-active-border bg-nav-active-bg font-bold text-nav-active-fg shadow-help-bot'
                    : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  collapsed && !mobileOpen ? 'justify-center px-2' : '',
                ].join(' ')}
                title={item.label}
              >
                <Icon
                  className="size-5 shrink-0 transition-transform group-hover:scale-110"
                  aria-hidden
                />
                {collapsed && !mobileOpen ? (
                  <span className="sr-only">{item.label}</span>
                ) : (
                  <span className="text-xs font-semibold tracking-wider">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
