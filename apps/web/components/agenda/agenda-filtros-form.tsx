'use client';

import type { AuthUser } from '@turnos/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Combobox } from '@/components/ui';
import {
  PACIENTE_SEARCH_DEBOUNCE_MS,
  PACIENTE_SEARCH_MIN_LENGTH,
} from '@/lib/agenda/paciente-search';
import {
  AGENDA_FILTER_ALL,
  buildAgendaHref,
  defaultSoloPendientesForRole,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';
import {
  fetchEspecialidades,
  fetchMedicos,
  fetchPacienteById,
  fetchPacientes,
} from '@/lib/api/turnos-client';

const filtrosSchema = z.object({
  medicoId: z.string(),
  especialidadId: z.string(),
  pacienteId: z.string(),
});

type FiltrosFormValues = z.infer<typeof filtrosSchema>;

type AgendaFiltrosFormProps = {
  user: AuthUser;
  params: ParsedAgendaParams;
};

/**
 * Formatea una opción de persona como "Apellido, Nombre".
 *
 * @param persona - Nombre y apellido.
 * @returns Label del combobox.
 */
function personaLabel(persona: { nombre: string; apellido: string }): string {
  return `${persona.apellido}, ${persona.nombre}`;
}

/**
 * Formulario de filtros de agenda (médico, especialidad, paciente).
 * Leaf client: combobox + RHF + Zod; consulta turnos al Aplicar o resetear.
 *
 * @param props - Usuario de sesión y params actuales de URL.
 * @returns Franja de filtros con Aplicar y reset.
 */
export function AgendaFiltrosForm({ user, params }: AgendaFiltrosFormProps) {
  const router = useRouter();
  const isMedico = user.rol === 'MEDICO';

  const medicosQuery = useQuery({
    queryKey: ['medicos'],
    queryFn: fetchMedicos,
    enabled: !isMedico,
  });
  const especialidadesQuery = useQuery({
    queryKey: ['especialidades'],
    queryFn: fetchEspecialidades,
  });
  const pacienteSeleccionadoQuery = useQuery({
    queryKey: ['paciente', params.pacienteId],
    queryFn: () => fetchPacienteById(params.pacienteId as string),
    enabled: Boolean(params.pacienteId),
    retry: false,
  });

  const form = useForm<FiltrosFormValues>({
    resolver: zodResolver(filtrosSchema),
    defaultValues: {
      medicoId: params.medicoId ?? AGENDA_FILTER_ALL,
      especialidadId: params.especialidadId ?? AGENDA_FILTER_ALL,
      pacienteId: params.pacienteId ?? AGENDA_FILTER_ALL,
    },
  });

  useEffect(() => {
    form.reset({
      medicoId: params.medicoId ?? AGENDA_FILTER_ALL,
      especialidadId: params.especialidadId ?? AGENDA_FILTER_ALL,
      pacienteId: params.pacienteId ?? AGENDA_FILTER_ALL,
    });
  }, [params, form]);

  /**
   * Aplica filtros actualizando la URL (dispara refetch en listado).
   *
   * @param values - Valores del formulario.
   */
  function onSubmit(values: FiltrosFormValues): void {
    const next: ParsedAgendaParams = {
      ...params,
      medicoId: isMedico ? params.medicoId : values.medicoId || undefined,
      especialidadId: values.especialidadId || undefined,
      pacienteId: values.pacienteId || undefined,
    };
    router.replace(buildAgendaHref(next));
  }

  /**
   * Restablece filtros a los defaults del rol y dispara la búsqueda.
   */
  function handleReset(): void {
    const next: ParsedAgendaParams = {
      ...params,
      medicoId: isMedico ? user.id : undefined,
      especialidadId: undefined,
      pacienteId: undefined,
      soloPendientes: defaultSoloPendientesForRole(user.rol),
    };
    form.reset({
      medicoId: next.medicoId ?? AGENDA_FILTER_ALL,
      especialidadId: AGENDA_FILTER_ALL,
      pacienteId: AGENDA_FILTER_ALL,
    });
    router.replace(buildAgendaHref(next));
  }

  const medicoOptions = (medicosQuery.data ?? []).map((medico) => ({
    id: medico.id,
    label: personaLabel(medico),
  }));
  const especialidadOptions = (especialidadesQuery.data ?? []).map(
    (especialidad) => ({
      id: especialidad.id,
      label: especialidad.nombre,
    }),
  );

  return (
    <form
      className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-background p-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-medico" className="text-sm font-medium">
          Médico
        </label>
        <Controller
          control={form.control}
          name="medicoId"
          render={({ field }) => (
            <Combobox
              id="filtro-medico"
              value={field.value}
              onChange={field.onChange}
              options={medicoOptions}
              selectedLabel={isMedico ? personaLabel(user) : undefined}
              placeholder="Todos"
              disabled={isMedico || medicosQuery.isLoading}
            />
          )}
        />
      </div>

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-especialidad" className="text-sm font-medium">
          Especialidad
        </label>
        <Controller
          control={form.control}
          name="especialidadId"
          render={({ field }) => (
            <Combobox
              id="filtro-especialidad"
              value={field.value}
              onChange={field.onChange}
              options={especialidadOptions}
              placeholder="Todos"
              disabled={especialidadesQuery.isLoading}
            />
          )}
        />
      </div>

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-paciente" className="text-sm font-medium">
          Paciente
        </label>
        <Controller
          control={form.control}
          name="pacienteId"
          render={({ field }) => (
            <Combobox
              id="filtro-paciente"
              value={field.value}
              onChange={field.onChange}
              selectedLabel={
                field.value === params.pacienteId &&
                pacienteSeleccionadoQuery.data
                  ? personaLabel(pacienteSeleccionadoQuery.data)
                  : undefined
              }
              placeholder="Todos"
              minQueryLength={PACIENTE_SEARCH_MIN_LENGTH}
              debounceMs={PACIENTE_SEARCH_DEBOUNCE_MS}
              fetchOptions={async (query) => {
                const pacientes = await fetchPacientes(query);
                return pacientes.map((paciente) => ({
                  id: paciente.id,
                  label: personaLabel(paciente),
                }));
              }}
            />
          )}
        />
      </div>

      <button
        type="submit"
        className="cursor-pointer rounded-md bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
      >
        Aplicar
      </button>
      <button
        type="button"
        onClick={handleReset}
        aria-label="Restablecer filtros"
        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-md border border-foreground bg-background text-foreground hover:bg-muted"
      >
        <RotateCcw className="size-4" aria-hidden />
      </button>
    </form>
  );
}
