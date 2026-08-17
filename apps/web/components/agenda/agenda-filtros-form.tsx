'use client';

import type { AuthRole } from '@turnos/shared-types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  AGENDA_FILTER_ALL,
  buildAgendaHref,
  type ParsedAgendaParams,
} from '@/lib/agenda/url-params';
import {
  fetchEspecialidades,
  fetchMedicos,
  fetchPacientes,
} from '@/lib/api/turnos-client';
import { useQuery } from '@tanstack/react-query';

const filtrosSchema = z.object({
  medicoId: z.string(),
  especialidadId: z.string(),
  pacienteId: z.string(),
});

type FiltrosFormValues = z.infer<typeof filtrosSchema>;

const SELECT_FIELD_CLASS =
  'select-field cursor-pointer rounded-md border border-border bg-input pl-3 py-2 text-sm text-input-foreground disabled:cursor-not-allowed disabled:opacity-60';

type AgendaFiltrosFormProps = {
  rol: AuthRole;
  params: ParsedAgendaParams;
};

/**
 * Formulario de filtros de agenda (médico, especialidad, paciente).
 * Leaf client: RHF + Zod; solo refetchea al presionar Aplicar.
 *
 * @param props - Rol del usuario y params actuales de URL.
 * @returns Franja de filtros con botón Aplicar.
 */
export function AgendaFiltrosForm({ rol, params }: AgendaFiltrosFormProps) {
  const router = useRouter();
  const isMedico = rol === 'MEDICO';

  const medicosQuery = useQuery({
    queryKey: ['medicos'],
    queryFn: fetchMedicos,
  });
  const especialidadesQuery = useQuery({
    queryKey: ['especialidades'],
    queryFn: fetchEspecialidades,
  });
  const pacientesQuery = useQuery({
    queryKey: ['pacientes'],
    queryFn: fetchPacientes,
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
      medicoId:
        isMedico || values.medicoId === AGENDA_FILTER_ALL
          ? isMedico
            ? params.medicoId
            : undefined
          : values.medicoId,
      especialidadId:
        values.especialidadId === AGENDA_FILTER_ALL
          ? undefined
          : values.especialidadId,
      pacienteId:
        values.pacienteId === AGENDA_FILTER_ALL ? undefined : values.pacienteId,
    };
    router.replace(buildAgendaHref(next));
  }

  return (
    <form
      className="flex flex-wrap items-end gap-4 rounded-lg border border-border bg-background p-4"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-medico" className="text-sm font-medium">
          Médico
        </label>
        <select
          id="filtro-medico"
          className={SELECT_FIELD_CLASS}
          disabled={isMedico || medicosQuery.isLoading}
          {...form.register('medicoId')}
        >
          {!isMedico && <option value={AGENDA_FILTER_ALL}>Todos</option>}
          {(medicosQuery.data ?? []).map((medico) => (
            <option key={medico.id} value={medico.id}>
              {medico.apellido}, {medico.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-especialidad" className="text-sm font-medium">
          Especialidad
        </label>
        <select
          id="filtro-especialidad"
          className={SELECT_FIELD_CLASS}
          disabled={especialidadesQuery.isLoading}
          {...form.register('especialidadId')}
        >
          <option value={AGENDA_FILTER_ALL}>Todos</option>
          {(especialidadesQuery.data ?? []).map((esp) => (
            <option key={esp.id} value={esp.id}>
              {esp.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="flex min-w-[180px] flex-1 flex-col gap-1">
        <label htmlFor="filtro-paciente" className="text-sm font-medium">
          Paciente
        </label>
        <select
          id="filtro-paciente"
          className={SELECT_FIELD_CLASS}
          disabled={pacientesQuery.isLoading}
          {...form.register('pacienteId')}
        >
          <option value={AGENDA_FILTER_ALL}>Todos</option>
          {(pacientesQuery.data ?? []).map((paciente) => (
            <option key={paciente.id} value={paciente.id}>
              {paciente.apellido}, {paciente.nombre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="cursor-pointer rounded-md bg-primary px-6 py-2 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
      >
        Aplicar
      </button>
    </form>
  );
}
