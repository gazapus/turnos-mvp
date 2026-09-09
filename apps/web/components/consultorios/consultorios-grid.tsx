'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConsultorioDto, MedicoOption } from '@turnos/shared-types';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Combobox, useFeedback, type ComboboxOption } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import {
  assignConsultorio,
  fetchConsultorios,
} from '@/lib/api/consultorios-client';
import { fetchMedicos } from '@/lib/api/turnos-client';
import {
  chunkColumnMajor,
  consultorioPersonaLabel,
  maxColsFromWidth,
  resolveAssignmentIntent,
  SIN_ASIGNAR_LABEL,
  SIN_ASIGNAR_OPTION_ID,
  splitConsultorioColumns,
} from '@/lib/consultorios';

/** Mensaje amigable si falla el PATCH. */
export const FRIENDLY_ASSIGN_ERROR = 'No se pudo asignar el consultorio';

/** Mensaje si falla el GET. */
export const CONSULTORIOS_LOAD_ERROR =
  'No se pudieron cargar los consultorios.';

/**
 * Máximo de columnas según el ancho de ventana (desktop-first).
 *
 * @returns 1, 2 o 3.
 */
function useConsultorioMaxCols(): number {
  const [maxCols, setMaxCols] = useState(3);

  useEffect(() => {
    /**
     * Sincroniza columnas con el viewport actual.
     */
    function update(): void {
      setMaxCols(maxColsFromWidth(window.innerWidth));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return maxCols;
}

/**
 * Grilla de asignación consultorio ↔ médico.
 *
 * @returns Panel con columnas de filas número + Combobox.
 */
export function ConsultoriosGrid() {
  const maxCols = useConsultorioMaxCols();
  const { showConfirm, showError } = useFeedback();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [comboEpoch, setComboEpoch] = useState<Record<string, number>>({});

  const catalogQuery = useQuery({
    queryKey: ['consultorios'],
    queryFn: fetchConsultorios,
  });
  const medicosQuery = useQuery({
    queryKey: ['medicos'],
    queryFn: fetchMedicos,
  });

  const catalog = useMemo(() => catalogQuery.data ?? [], [catalogQuery.data]);
  const medicos = useMemo(() => medicosQuery.data ?? [], [medicosQuery.data]);

  const medicoOptions = useMemo((): ComboboxOption[] => {
    const doctorOptions = medicos.map((medico: MedicoOption) => ({
      id: medico.id,
      label: consultorioPersonaLabel(medico),
    }));
    return [
      { id: SIN_ASIGNAR_OPTION_ID, label: SIN_ASIGNAR_LABEL },
      ...doctorOptions,
    ];
  }, [medicos]);

  const columns = useMemo(() => {
    const sizes = splitConsultorioColumns(catalog.length, maxCols);
    return chunkColumnMajor(catalog, sizes);
  }, [catalog, maxCols]);

  const mutation = useMutation({
    mutationFn: ({
      consultorioId,
      medicoId,
    }: {
      consultorioId: string;
      medicoId: string | null;
    }) => assignConsultorio(consultorioId, medicoId),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(['consultorios'], snapshot);
    },
  });

  const handleSelect = useCallback(
    async (consultorio: ConsultorioDto, optionId: string) => {
      const option = medicoOptions.find((item) => item.id === optionId);
      const intent = resolveAssignmentIntent({
        target: consultorio,
        catalog,
        selectedOptionId: optionId,
        selectedMedicoLabel: option?.label ?? '',
      });
      if (intent.kind === 'noop') {
        return;
      }
      if (intent.kind === 'confirm') {
        const { accepted } = await showConfirm({ title: intent.title });
        if (!accepted) {
          setComboEpoch((current) => ({
            ...current,
            [consultorio.id]: (current[consultorio.id] ?? 0) + 1,
          }));
          return;
        }
      }
      const medicoId = intent.medicoId;
      setPendingId(consultorio.id);
      try {
        await mutation.mutateAsync({
          consultorioId: consultorio.id,
          medicoId,
        });
      } catch (error) {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_ASSIGN_ERROR, detail);
        setComboEpoch((current) => ({
          ...current,
          [consultorio.id]: (current[consultorio.id] ?? 0) + 1,
        }));
      } finally {
        setPendingId(null);
      }
    },
    [catalog, medicoOptions, mutation, showConfirm, showError],
  );

  if (catalogQuery.isLoading) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Cargando consultorios…
      </p>
    );
  }

  if (catalogQuery.isError) {
    return (
      <p className="py-8 text-center text-danger" role="alert">
        {CONSULTORIOS_LOAD_ERROR}
      </p>
    );
  }

  return (
    <div
      className="glass-panel-agenda overflow-visible rounded-lg p-4"
      data-testid="consultorios-panel"
    >
      <div className="flex gap-8">
        {columns.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex min-w-0 flex-1 flex-col gap-3"
            data-testid="consultorios-column"
          >
            {column.map((consultorio) => {
              const selectedLabel = consultorio.medico
                ? consultorioPersonaLabel(consultorio.medico)
                : undefined;
              return (
                <div
                  key={consultorio.id}
                  className="flex items-center gap-3"
                  data-testid="consultorio-row"
                >
                  <span className="w-8 shrink-0 text-sm font-semibold text-muted-foreground">
                    {consultorio.numero}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Combobox
                      key={`${consultorio.id}-${comboEpoch[consultorio.id] ?? 0}`}
                      id={`consultorio-medico-${consultorio.id}`}
                      value={consultorio.medico?.id ?? ''}
                      selectedLabel={selectedLabel}
                      onChange={(optionId) => {
                        void handleSelect(consultorio, optionId);
                      }}
                      options={medicoOptions}
                      placeholder={SIN_ASIGNAR_LABEL}
                      disabled={
                        medicosQuery.isLoading || pendingId === consultorio.id
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
