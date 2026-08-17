'use client';

import type { AuthUser } from '@turnos/shared-types';
import { Plus } from 'lucide-react';

import type { ParsedAgendaParams } from '@/lib/agenda/url-params';
import { AgendaCanceladosToggle } from './agenda-cancelados-toggle';
import { AgendaFiltrosForm } from './agenda-filtros-form';
import { AgendaQueryProvider } from './agenda-query-provider';
import { AgendaTabs } from './agenda-tabs';
import { AgendaVistaPlaceholder } from './agenda-vista-placeholder';
import { TurnosListado } from './turnos-listado';

type AgendaContentProps = {
  user: AuthUser;
  params: ParsedAgendaParams;
};

/**
 * Layout interactivo de la Agenda de Turnos (filtros, tabs, listado).
 * Leaf client wrapper con QueryClientProvider acotado.
 *
 * @param props - Usuario de sesión y params de URL.
 * @returns Layout completo de agenda según wireframe.
 */
export function AgendaContent({ user, params }: AgendaContentProps) {
  const canCreateTurno = user.rol === 'ADMIN' || user.rol === 'RECEPCIONISTA';

  return (
    <AgendaQueryProvider>
      <section className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Agenda de Turnos
          </h1>
          {canCreateTurno && (
            <button
              type="button"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
            >
              <Plus className="size-4" aria-hidden />
              Nuevo Turno
            </button>
          )}
        </div>

        <AgendaFiltrosForm rol={user.rol} params={params} />

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <AgendaTabs params={params} />
            <AgendaCanceladosToggle params={params} />
          </div>

          <div>
            {params.vista === 'lista' && (
              <TurnosListado rol={user.rol} params={params} />
            )}
            {params.vista === 'dia' && <AgendaVistaPlaceholder vista="dia" />}
            {params.vista === 'semana' && (
              <AgendaVistaPlaceholder vista="semana" />
            )}
            {params.vista === 'mes' && <AgendaVistaPlaceholder vista="mes" />}
          </div>
        </div>
      </section>
    </AgendaQueryProvider>
  );
}
