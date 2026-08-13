'use client';

import type { AuthUser } from '@turnos/shared-types';
import { Menu, User } from 'lucide-react';
import Image from 'next/image';

const LOGO_ICON = '/images/login/logo_icono.png';

type AppNavbarProps = {
  user: AuthUser;
  onOpenMobileNav: () => void;
};

/**
 * Barra superior del shell: logo/menú mobile y control de perfil.
 *
 * @param props - Usuario y callback para abrir drawer.
 * @returns Header glass del shell.
 */
export function AppNavbar({ user, onOpenMobileNav }: AppNavbarProps) {
  const displayName = `${user.nombre} ${user.apellido}`.trim();

  return (
    <header className="glass-panel z-30 flex h-16 shrink-0 items-center justify-between !rounded-none !border-t-0 !border-r-0 !border-l-0 px-6 max-md:px-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="hidden cursor-pointer items-center justify-center rounded-md p-2 text-foreground hover:bg-muted max-md:inline-flex"
          aria-label="Abrir menú"
          onClick={onOpenMobileNav}
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <Image
          src={LOGO_ICON}
          alt="Hospital Clínica Salud"
          width={40}
          height={40}
          className="h-10 w-auto object-contain max-md:hidden"
          priority
        />
      </div>

      <div className="flex items-center gap-3">
        <span className="font-sans text-base text-muted-foreground max-md:hidden">
          {displayName || user.mail}
        </span>
        <button
          type="button"
          className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-primary/20 bg-accent-soft text-primary shadow-help-bot"
          aria-label="Perfil de usuario"
          onClick={() => {
            console.log('[shell] perfil clicked', { userId: user.id });
          }}
        >
          <User className="size-5" aria-hidden />
        </button>
      </div>
    </header>
  );
}
