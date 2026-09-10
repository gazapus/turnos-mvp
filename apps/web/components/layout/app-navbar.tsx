'use client';

import type { AuthUser } from '@turnos/shared-types';
import { Menu, User } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError, logoutRequest } from '@/lib/api/auth-client';

const LOGO_ICON = '/images/login/logo_icono.png';
const CERRAR_SESION_LABEL = 'Cerrar sesión';
const FRIENDLY_LOGOUT_ERROR = 'No se pudo cerrar la sesión';

type AppNavbarProps = {
  user: AuthUser;
  onOpenMobileNav: () => void;
};

/**
 * Detalle de error para el dialog de logout.
 *
 * @param error - Fallo desconocido.
 * @returns Texto de detalle.
 */
function logoutErrorDetail(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

/**
 * Barra superior del shell: logo/menú mobile y control de perfil con logout.
 *
 * @param props - Usuario y callback para abrir drawer.
 * @returns Header glass del shell.
 */
export function AppNavbar({ user, onOpenMobileNav }: AppNavbarProps) {
  const router = useRouter();
  const { showError } = useFeedback();
  const displayName = `${user.nombre} ${user.apellido}`.trim();
  const menuId = useId();
  const menuRootRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    /**
     * Cierra el menú con Escape.
     *
     * @param event - Tecla pulsada.
     */
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    /**
     * Cierra el menú si el pointer ocurre fuera del control.
     *
     * @param event - Pointer en el documento.
     */
    function onPointerDown(event: PointerEvent): void {
      const target = event.target;
      if (
        target instanceof Node &&
        menuRootRef.current &&
        !menuRootRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  /**
   * Abre o cierra el menú de sesión.
   */
  function handleToggleMenu(): void {
    setMenuOpen((open) => !open);
  }

  /**
   * Cierra sesión y vuelve al login si el backend responde éxito.
   */
  async function handleLogout(): Promise<void> {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    setMenuOpen(false);
    try {
      await logoutRequest();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      showError(FRIENDLY_LOGOUT_ERROR, logoutErrorDetail(error));
      setLoggingOut(false);
    }
  }

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
        <div className="relative" ref={menuRootRef}>
          <button
            type="button"
            className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-primary/20 bg-accent-soft text-primary shadow-help-bot"
            aria-label="Perfil de usuario"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-controls={menuId}
            onClick={handleToggleMenu}
          >
            <User className="size-5" aria-hidden />
          </button>
          {menuOpen ? (
            <div
              id={menuId}
              role="menu"
              aria-label="Sesión"
              className="absolute right-0 top-full z-40 mt-2 min-w-44 rounded-lg border border-border bg-surface-elevated py-1 shadow-help-bot"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full cursor-pointer px-4 py-2 text-left text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                disabled={loggingOut}
                onClick={() => {
                  void handleLogout();
                }}
              >
                {CERRAR_SESION_LABEL}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
