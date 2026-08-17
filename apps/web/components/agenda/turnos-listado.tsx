'use client';

import type { AuthRole } from '@turnos/shared-types';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
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
};

type PageParam = {
  cursor?: string;
  direccion?: 'siguiente' | 'anterior';
};

/**
 * Grilla de turnos con scroll infinito bidireccional (modo Lista).
 * Leaf client: useInfiniteQuery sin caché; filtra cancelados en memoria.
 *
 * @param props - Rol y params aplicados desde la URL.
 * @returns Tabla de turnos con paginación por cursor.
 */
export function TurnosListado({ rol, params }: TurnosListadoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollSnapshotRef = useRef<{
    scrollHeight: number;
    scrollTop: number;
  } | null>(null);
  const appliedFilters = useMemo(() => toAppliedFilters(params), [params]);

  const query = useInfiniteQuery({
    queryKey: [
      'turnos',
      appliedFilters.medicoId,
      appliedFilters.especialidadId,
      appliedFilters.pacienteId,
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
    getPreviousPageParam: (firstPage) =>
      firstPage.cursorAnterior
        ? { cursor: firstPage.cursorAnterior, direccion: 'anterior' as const }
        : undefined,
  });

  const {
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    hasNextPage,
    hasPreviousPage,
    fetchNextPage,
    fetchPreviousPage,
    data,
  } = query;

  const allItems = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data?.pages],
  );

  const visibleItems = useMemo(
    () =>
      params.cancelados
        ? allItems
        : allItems.filter((item) => item.estado !== 'CANCELADO'),
    [allItems, params.cancelados],
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
    if (el.scrollTop <= threshold) {
      if (hasPreviousPage && !isFetchingPreviousPage) {
        scrollSnapshotRef.current = {
          scrollHeight: el.scrollHeight,
          scrollTop: el.scrollTop,
        };
        void fetchPreviousPage();
      }
    }
  }, [
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
  ]);

  useLayoutEffect(() => {
    if (isFetchingPreviousPage || scrollSnapshotRef.current === null) {
      return;
    }

    const el = containerRef.current;
    const snapshot = scrollSnapshotRef.current;
    scrollSnapshotRef.current = null;

    if (!el) {
      return;
    }

    const heightDelta = el.scrollHeight - snapshot.scrollHeight;
    if (heightDelta > 0) {
      el.scrollTop = snapshot.scrollTop + heightDelta;
    }
  }, [isFetchingPreviousPage, data?.pages.length]);

  useEffect(() => {
    if (isLoading || isError || isFetching) {
      return;
    }
    if (visibleItems.length > 0) {
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
      return;
    }
    if (hasPreviousPage && !isFetchingPreviousPage) {
      void fetchPreviousPage();
    }
  }, [
    visibleItems.length,
    isLoading,
    isError,
    isFetching,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
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
    visibleItems.length === 0 &&
    !hasNextPage &&
    !hasPreviousPage &&
    !isFetchingNextPage &&
    !isFetchingPreviousPage;

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

      {!isLoading && !isError && visibleItems.length > 0 && (
        <>
          {/*
            Extension point: doble click en fila → detalle de turno (futura iteración).
          */}
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
              {visibleItems.map((turno) => (
                <tr
                  key={turno.id}
                  className="border-t border-border hover:bg-muted/50"
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
                  <td className="px-4 py-3">
                    <TurnoAcciones rol={rol} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {(isFetchingNextPage || isFetchingPreviousPage) && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          Cargando más turnos…
        </p>
      )}
    </div>
  );
}
