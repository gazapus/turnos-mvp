'use client';

import type { AuthRole } from '@turnos/shared-types';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from 'react';

import {
  toAppliedFilters,
  toTurnosListQuery,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';
import { fetchTurnos } from '@/lib/api/turnos-client';
import { TurnoAcciones } from './turno-acciones';
import { TurnoEstadoPill } from './turno-estado-pill';
import { TurnoTipoIcon } from './turno-tipo-icon';

type TurnosListadoProps = {
  rol: AuthRole;
  params: ParsedAgendaParams;
  onAbrirTurno: (turnoId: string) => void;
  onConfirmado: () => void;
};

/**
 * Evita que el click en Acciones abra el detalle de la fila.
 *
 * @param event - Click en la celda de acciones.
 */
function stopAccionesClick(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

/**
 * Abre el detalle con teclado cuando la fila está enfocada.
 *
 * @param event - Keydown en la fila.
 * @param turnoId - Turno de la fila.
 * @param onAbrirTurno - Callback de apertura.
 */
function handleRowKeyDown(
  event: KeyboardEvent<HTMLTableRowElement>,
  turnoId: string,
  onAbrirTurno: (id: string) => void,
): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onAbrirTurno(turnoId);
  }
}

type PageParam = {
  cursor?: string;
  direccion?: 'siguiente';
};

/**
 * Grilla de turnos con scroll infinito hacia adelante (modo Lista).
 * Leaf client: useInfiniteQuery anclado a hoy 00:00; no carga el pasado.
 *
 * @param props - Rol, params de URL y callbacks de detalle/confirmación.
 * @returns Tabla de turnos con paginación por cursor.
 */
export function TurnosListado({
  rol,
  params,
  onAbrirTurno,
  onConfirmado,
}: TurnosListadoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appliedFilters = useMemo(() => toAppliedFilters(params), [params]);

  const query = useInfiniteQuery({
    queryKey: [
      'turnos',
      appliedFilters.medicoId,
      appliedFilters.especialidadId,
      appliedFilters.pacienteId,
      appliedFilters.soloPendientes,
    ],
    queryFn: ({ pageParam }) => {
      const page = pageParam as PageParam;
      return fetchTurnos(
        toTurnosListQuery(
          appliedFilters,
          page.cursor,
          page.direccion ?? 'siguiente',
        ),
      );
    },
    initialPageParam: {} as PageParam,
    getNextPageParam: (lastPage) =>
      lastPage.cursorSiguiente
        ? { cursor: lastPage.cursorSiguiente, direccion: 'siguiente' as const }
        : undefined,
    getPreviousPageParam: () => undefined,
  });

  const {
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    data,
  } = query;

  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || isFetching) {
      return;
    }

    const threshold = 80;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      if (hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    }
  }, [isFetching, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (isLoading || isError || isFetching) {
      return;
    }
    if (allItems.length > 0) {
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [
    allItems.length,
    isLoading,
    isError,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  ]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const showEmptyMessage =
    !isLoading &&
    !isError &&
    allItems.length === 0 &&
    !hasNextPage &&
    !isFetchingNextPage;

  return (
    <div
      ref={containerRef}
      className="glass-panel-agenda max-h-[calc(100dvh-22rem)] overflow-auto rounded-b-lg"
      data-testid="turnos-listado-scroll"
    >
      {isLoading && (
        <p className="py-8 text-center text-muted-foreground">
          Cargando turnos…
        </p>
      )}

      {isError && (
        <p className="py-8 text-center text-danger" role="alert">
          No se pudieron cargar los turnos.
        </p>
      )}

      {showEmptyMessage && (
        <p className="py-8 text-center text-muted-foreground">
          No hay turnos para mostrar con los filtros actuales.
        </p>
      )}

      {!isLoading && !isError && allItems.length > 0 && (
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Doctor</th>
              <th className="px-4 py-3">Especialidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((turno) => (
              <tr
                key={turno.id}
                className="cursor-pointer border-t border-border hover:bg-muted/50"
                tabIndex={0}
                aria-label={`Ver detalle del turno de ${turno.paciente.apellido}, ${turno.paciente.nombre}`}
                onClick={() => onAbrirTurno(turno.id)}
                onKeyDown={(event) =>
                  handleRowKeyDown(event, turno.id, onAbrirTurno)
                }
              >
                <td className="px-4 py-3 whitespace-nowrap">{turno.fecha}</td>
                <td className="px-4 py-3 whitespace-nowrap">{turno.hora}</td>
                <td className="px-4 py-3">
                  {turno.paciente.apellido}, {turno.paciente.nombre}
                </td>
                <td className="px-4 py-3">
                  {turno.medico.apellido}, {turno.medico.nombre}
                </td>
                <td className="px-4 py-3">{turno.especialidad.nombre}</td>
                <td className="px-4 py-3">
                  <TurnoEstadoPill estado={turno.estado} />
                </td>
                <td className="px-4 py-3">
                  <TurnoTipoIcon tipo={turno.tipo} />
                </td>
                <td className="px-4 py-3" onClick={stopAccionesClick}>
                  <TurnoAcciones
                    rol={rol}
                    estado={turno.estado}
                    fecha={turno.fecha}
                    turnoId={turno.id}
                    llamado={turno.llamado}
                    onConfirmado={onConfirmado}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isFetchingNextPage && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          Cargando más turnos…
        </p>
      )}
    </div>
  );
}
