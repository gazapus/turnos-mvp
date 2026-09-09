'use client';

import type { AuthUser } from '@turnos/shared-types';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import type { ParsedAgendaParams } from '@/lib/agenda/url-params';
import { AgendaPendientesToggle } from './agenda-pendientes-toggle';
import { AgendaDia } from './agenda-dia';
import { AgendaFiltrosForm } from './agenda-filtros-form';
import { AgendaQueryProvider } from './agenda-query-provider';
import { AgendaTabs } from './agenda-tabs';
import { AgendaVistaPlaceholder } from './agenda-vista-placeholder';
import { TurnoFormDialog, type TurnoFormMode } from './turno-form-dialog';
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
  return (
    <AgendaQueryProvider>
      <AgendaContentInner user={user} params={params} />
    </AgendaQueryProvider>
  );
}

/**
 * Contenido de agenda que usa QueryClient (dialog + invalidación).
 *
 * @param props - Usuario y params.
 * @returns Sección de agenda.
 */
function AgendaContentInner({ user, params }: AgendaContentProps) {
  const queryClient = useQueryClient();
  const canCreateTurno = user.rol === 'ADMIN' || user.rol === 'RECEPCIONISTA';
  const [mode, setMode] = useState<TurnoFormMode | null>(null);

  /**
   * Invalida listados de agenda tras guardar.
   */
  function handleSaved(): void {
    void queryClient.invalidateQueries({ queryKey: ['turnos'] });
    void queryClient.invalidateQueries({ queryKey: ['turnos-dia'] });
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Agenda de Turnos
        </h1>
        {canCreateTurno && (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
            onClick={() => setMode({ kind: 'create' })}
          >
            <Plus className="size-4" aria-hidden />
            Nuevo Turno
          </button>
        )}
      </div>

      <AgendaFiltrosForm user={user} params={params} />

      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <AgendaTabs params={params} />
          <AgendaPendientesToggle params={params} />
        </div>

        <div>
          {params.vista === 'lista' && (
            <TurnosListado
              rol={user.rol}
              params={params}
              onAbrirTurno={(turnoId) => setMode({ kind: 'detail', turnoId })}
              onConfirmado={handleSaved}
            />
          )}
          {params.vista === 'dia' && (
            <AgendaDia
              params={params}
              canCreate={canCreateTurno}
              onCrearEnHueco={(fecha, horaInicio) =>
                setMode({ kind: 'create', fecha, horaInicio })
              }
              onAbrirTurno={(turnoId) => setMode({ kind: 'detail', turnoId })}
            />
          )}
          {params.vista === 'semana' && (
            <AgendaVistaPlaceholder vista="semana" />
          )}
          {params.vista === 'mes' && <AgendaVistaPlaceholder vista="mes" />}
        </div>
      </div>

      <TurnoFormDialog
        open={mode !== null}
        mode={mode}
        user={user}
        onClose={() => setMode(null)}
        onSaved={handleSaved}
      />
    </section>
  );
}
