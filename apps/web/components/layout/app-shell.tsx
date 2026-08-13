'use client';

import type { AuthUser } from '@turnos/shared-types';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { SIDEBAR_COLLAPSED_STORAGE_KEY } from '@/lib/navigation';

import { AppBackground } from './app-background';
import { AppNavbar } from './app-navbar';
import { AppSidebar } from './app-sidebar';
import { HelpBotButton } from './help-bot-button';

type AppShellProps = {
  user: AuthUser;
  children: React.ReactNode;
};

/**
 * Composición del layout autenticado: fondo, sidebar, navbar y contenido.
 *
 * @param props - Usuario de sesión y children de la página.
 * @returns Shell viewport sin scroll de página innecesario.
 */
export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      if (stored === 'true') {
        setCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /**
   * Alterna colapso del sidebar y persiste preferencia en localStorage.
   */
  function handleToggleCollapsed(): void {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <div className="relative flex h-dvh overflow-hidden font-sans text-foreground">
      <AppBackground />

      <AppSidebar
        rol={user.rol}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapsed={handleToggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={[
          'relative z-20 flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ease-in-out',
          collapsed ? 'ml-sidebar-collapsed' : 'ml-sidebar',
          'max-md:ml-0',
        ].join(' ')}
      >
        <AppNavbar user={user} onOpenMobileNav={() => setMobileOpen(true)} />
        <div className="relative z-20 flex-1 overflow-y-auto p-6 max-md:p-3">
          {children}
        </div>
        <HelpBotButton />
      </div>
    </div>
  );
}
