'use client';

import type { VistaAgenda } from '@turnos/shared-types';
import { VISTA_AGENDA } from '@turnos/shared-types';
import { useRouter } from 'next/navigation';

import {
  buildAgendaHref,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';

const TAB_LABELS: Record<VistaAgenda, string> = {
  lista: 'Lista',
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
};

type AgendaTabsProps = {
  params: ParsedAgendaParams;
};

/**
 * Tabs de modo de visualización de la agenda.
 * Leaf client: actualiza query param `vista` vía router.replace.
 *
 * @param props - Params actuales de la URL.
 * @returns Tabs Lista / Día / Semana / Mes.
 */
export function AgendaTabs({ params }: AgendaTabsProps) {
  const router = useRouter();

  /**
   * Cambia la vista activa persistiendo filtros en la URL.
   *
   * @param vista - Vista seleccionada.
   */
  function selectVista(vista: VistaAgenda): void {
    router.replace(buildAgendaHref({ ...params, vista }));
  }

  return (
    <div
      className="flex gap-0"
      role="tablist"
      aria-label="Modo de visualización"
    >
      {VISTA_AGENDA.map((vista, index) => {
        const active = params.vista === vista;
        return (
          <button
            key={vista}
            type="button"
            role="tab"
            aria-selected={active}
            className={[
              'cursor-pointer rounded-none border border-border bg-glass-bg px-4 py-2 text-sm font-semibold uppercase tracking-wide',
              index > 0 ? '-ml-px' : '',
              active
                ? 'border-b-[3px] border-b-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectVista(vista)}
          >
            {TAB_LABELS[vista]}
          </button>
        );
      })}
    </div>
  );
}
