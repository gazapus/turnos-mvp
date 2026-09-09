'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuthUser,
  TipoTurno,
  TurnoDetalleDto,
} from '@turnos/shared-types';
import {
  CalendarPlus,
  Check,
  Clock,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import { Controller, useForm } from 'react-hook-form';

import { Combobox, useFeedback } from '@/components/ui';
import { todayYmd } from '@/lib/agenda/fecha-dia';
import { canConfirmarTurno } from '@/lib/agenda/can-confirmar-turno';
import { addMinutesHm, digitsOnly } from '@/lib/agenda/hora';
import { ApiError } from '@/lib/api/auth-client';
import {
  createTurno,
  fetchEspecialidades,
  fetchMedicos,
  fetchPacienteByDocumento,
  fetchPrimeraVez,
  fetchTurnoById,
  updateTurno,
} from '@/lib/api/turnos-client';
import {
  emptyTurnoFormValues,
  turnoFormSchema,
  type TurnoFormValues,
} from '@/lib/schemas/turno-form-schema';
import { useConfirmarTurno } from './use-confirmar-turno';

const LOOKUP_DEBOUNCE_MS = 1500;
const FRIENDLY_SAVE_ERROR = 'No se pudo guardar el turno';

const INPUT_BASE_CLASS =
  'w-full rounded-md border bg-input px-3 py-2 text-sm text-input-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-input disabled:text-input-foreground disabled:opacity-100 disabled:[-webkit-text-fill-color:var(--input-foreground)]';

const TIME_INPUT_CLASS = `${INPUT_BASE_CLASS} pr-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:size-0 [&::-webkit-calendar-picker-indicator]:opacity-0`;

const FORM_SECTION_CLASS =
  'rounded-lg border border-border bg-glass-form-section-bg p-4';

export type TurnoFormMode =
  | { kind: 'create'; fecha?: string; horaInicio?: string }
  | { kind: 'detail'; turnoId: string };

type TurnoFormDialogProps = {
  open: boolean;
  mode: TurnoFormMode | null;
  user: AuthUser;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Mensaje de error con altura reservada para no saltar el layout.
 *
 * @param props - Mensaje opcional.
 * @returns Línea de error.
 */
function FieldError({ message }: { message?: string }) {
  return (
    <p
      className="mt-1 min-h-5 text-xs text-danger"
      role={message ? 'alert' : undefined}
    >
      {message ?? '\u00a0'}
    </p>
  );
}

type NotifySwitchProps = {
  id: string;
  disabled: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/**
 * Switch de notificación por email (checkbox accesible con pista visual).
 *
 * @param props - Id, estado y handlers.
 * @returns Toggle al estilo wireframe.
 */
function NotifySwitch({ id, disabled, checked, onChange }: NotifySwitchProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-3 text-sm disabled:cursor-not-allowed"
      title="Se enviará un recordatorio por email"
    >
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          disabled={disabled}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          title="Se enviará un recordatorio por email"
        />
        <span
          aria-hidden
          className="block h-6 w-11 rounded-full border border-border bg-muted transition-colors peer-checked:border-on-elevated peer-checked:bg-on-elevated peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-0.5 left-0.5 block size-5 rounded-full bg-background shadow-sm transition-transform peer-checked:translate-x-5"
        />
      </span>
      Notificar al paciente
    </label>
  );
}

type TimeFieldProps = {
  id: string;
  label: string;
  invalid: boolean;
  disabled: boolean;
  registerProps: ComponentProps<'input'>;
  pickerLabel: string;
};

/**
 * Campo de hora con un único botón de reloj que abre el time picker nativo.
 *
 * @param props - Id, registro RHF y estado.
 * @returns Input time + botón.
 */
function TimeField({
  id,
  label,
  invalid,
  disabled,
  registerProps,
  pickerLabel,
}: TimeFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { ref, ...inputRest } = registerProps;

  /**
   * Abre el selector nativo de hora si el navegador lo soporta.
   */
  function openTimePicker(): void {
    inputRef.current?.showPicker?.();
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="time"
          ref={(element) => {
            inputRef.current = element;
            if (typeof ref === 'function') {
              ref(element);
            } else if (ref) {
              ref.current = element;
            }
          }}
          className={`${TIME_INPUT_CLASS} ${invalid ? 'border-danger' : 'border-border'}`}
          disabled={disabled}
          {...inputRest}
        />
        <button
          type="button"
          aria-label={pickerLabel}
          className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
          onClick={openTimePicker}
        >
          <Clock className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/**
 * Popup de alta y detalle de turno.
 *
 * @param props - Apertura, modo, usuario y callbacks.
 * @returns Dialog modal o null.
 */
export function TurnoFormDialog({
  open,
  mode,
  user,
  onClose,
  onSaved,
}: TurnoFormDialogProps) {
  const queryClient = useQueryClient();
  const { toastSuccess, showError } = useFeedback();
  const { confirmar, pending: confirming } = useConfirmarTurno();
  const canWrite = user.rol === 'ADMIN' || user.rol === 'RECEPCIONISTA';
  const isMedico = user.rol === 'MEDICO';
  const [pacienteLocked, setPacienteLocked] = useState(false);
  const [horaFinTouched, setHoraFinTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedEstado, setLoadedEstado] = useState<
    TurnoDetalleDto['estado'] | null
  >(null);
  const [loadedFecha, setLoadedFecha] = useState<string | null>(null);
  const lookupTimer = useRef<number | null>(null);
  const lastLookupRef = useRef('');

  const form = useForm<TurnoFormValues>({
    resolver: zodResolver(turnoFormSchema),
    mode: 'onChange',
    defaultValues: emptyTurnoFormValues(),
  });

  const isDetail = mode?.kind === 'detail';
  const turnoId = mode?.kind === 'detail' ? mode.turnoId : undefined;

  const detailQuery = useQuery({
    queryKey: ['turno-detalle', turnoId],
    queryFn: ({ signal }) => fetchTurnoById(turnoId as string, signal),
    enabled: open && isDetail && Boolean(turnoId),
    retry: false,
  });

  const medicosQuery = useQuery({
    queryKey: ['medicos'],
    queryFn: fetchMedicos,
    enabled: open,
  });
  const especialidadesQuery = useQuery({
    queryKey: ['especialidades'],
    queryFn: fetchEspecialidades,
    enabled: open,
  });

  const medicoId = form.watch('medicoId');
  const especialidadId = form.watch('especialidadId');
  const pacienteId = form.watch('pacienteId');
  const tipo = form.watch('tipo');
  const horaInicio = form.watch('horaInicio');
  const mail = form.watch('mail');
  const documento = form.watch('documento');
  const mailValido = isUsableEmail(mail);

  const primeraVezQuery = useQuery({
    queryKey: ['primera-vez', pacienteId, medicoId, turnoId],
    queryFn: () => fetchPrimeraVez(pacienteId, medicoId, turnoId),
    enabled: open && Boolean(pacienteId) && Boolean(medicoId),
    retry: false,
  });

  const medicosFiltrados = useMemo(() => {
    const medicos = medicosQuery.data ?? [];
    if (!especialidadId) {
      return medicos;
    }
    return medicos.filter((item) =>
      item.especialidadIds.includes(especialidadId),
    );
  }, [especialidadId, medicosQuery.data]);

  const especialidadesFiltradas = useMemo(() => {
    const especialidades = especialidadesQuery.data ?? [];
    if (!medicoId) {
      return especialidades;
    }
    return especialidades.filter((item) => item.medicoIds.includes(medicoId));
  }, [especialidadesQuery.data, medicoId]);

  const loadingDetalle =
    isDetail && (detailQuery.isFetching || detailQuery.isPending);
  const fechaEditable =
    !isDetail ||
    (loadedEstado === 'PROGRAMADO' &&
      Boolean(loadedFecha) &&
      (loadedFecha as string) >= todayYmd());
  const readOnly =
    isMedico || !canWrite || loadingDetalle || (isDetail && !fechaEditable);
  const showGuardar = canWrite && (!isDetail || fechaEditable);
  const showConfirmar =
    isDetail &&
    loadedEstado !== null &&
    loadedFecha !== null &&
    canConfirmarTurno({
      rol: user.rol,
      estado: loadedEstado,
      fecha: loadedFecha,
    });
  const isValid = form.formState.isValid;
  const isDirty = form.formState.isDirty;
  const guardarEnabled =
    showGuardar &&
    isValid &&
    !saving &&
    !loadingDetalle &&
    !readOnly &&
    (mode?.kind === 'create' || isDirty);
  const guardarTooltip =
    mode?.kind === 'detail' && isValid && !isDirty
      ? 'No hay cambios que guardar'
      : 'Completá los campos obligatorios para guardar';

  useEffect(() => {
    if (!open || !mode) {
      return;
    }
    lastLookupRef.current = '';
    setPacienteLocked(false);
    setHoraFinTouched(false);
    setSaving(false);
    setLoadedEstado(null);
    setLoadedFecha(null);
    const defaults = emptyTurnoFormValues();
    if (mode.kind === 'create') {
      if (mode.fecha) {
        defaults.fecha = mode.fecha;
      }
      if (mode.horaInicio) {
        defaults.horaInicio = mode.horaInicio;
        defaults.horaFin = addMinutesHm(mode.horaInicio, 30);
      }
    }
    form.reset(defaults);
  }, [form, mode, open]);

  useEffect(() => {
    if (!open || !detailQuery.data || mode?.kind !== 'detail') {
      return;
    }
    const turno = detailQuery.data;
    setLoadedEstado(turno.estado);
    setLoadedFecha(turno.fecha);
    setPacienteLocked(true);
    lastLookupRef.current = turno.paciente.documento;
    form.reset(valuesFromDetalle(turno));
  }, [detailQuery.data, form, mode, open]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    if (medicoId && !medicosFiltrados.some((item) => item.id === medicoId)) {
      form.setValue('medicoId', '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else if (!medicoId && medicosFiltrados.length === 1) {
      form.setValue('medicoId', medicosFiltrados[0].id, {
        shouldValidate: true,
      });
    }
  }, [form, medicoId, medicosFiltrados, readOnly]);

  useEffect(() => {
    if (readOnly) {
      return;
    }
    if (
      especialidadId &&
      !especialidadesFiltradas.some((item) => item.id === especialidadId)
    ) {
      form.setValue('especialidadId', '', {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else if (!especialidadId && especialidadesFiltradas.length === 1) {
      form.setValue('especialidadId', especialidadesFiltradas[0].id, {
        shouldValidate: true,
      });
    }
  }, [especialidadId, especialidadesFiltradas, form, readOnly]);

  useEffect(() => {
    if (readOnly || tipo === 'URGENTE' || tipo === 'SOBRETURNO') {
      return;
    }
    if (!medicoId) {
      return;
    }
    if (!pacienteId) {
      form.setValue('tipo', 'PRIMER_TURNO', { shouldValidate: true });
      return;
    }
    if (primeraVezQuery.data?.primeraVez === true) {
      form.setValue('tipo', 'PRIMER_TURNO', { shouldValidate: true });
    } else if (primeraVezQuery.data?.primeraVez === false) {
      form.setValue('tipo', 'CONTROL', { shouldValidate: true });
    }
  }, [form, medicoId, pacienteId, primeraVezQuery.data, readOnly, tipo]);

  useEffect(() => {
    if (readOnly || horaFinTouched || !horaInicio) {
      return;
    }
    form.setValue('horaFin', addMinutesHm(horaInicio, 30), {
      shouldValidate: true,
    });
  }, [form, horaFinTouched, horaInicio, readOnly]);

  useEffect(() => {
    if (!mailValido && form.getValues('notificarMail')) {
      form.setValue('notificarMail', false, { shouldValidate: true });
    }
  }, [form, mailValido]);

  /**
   * Busca paciente por documento y precarga o limpia campos.
   *
   * @param raw - Documento del input.
   */
  const lookupPaciente = useCallback(
    async (raw: string): Promise<void> => {
      const normalized = digitsOnly(raw);
      if (!normalized || normalized === lastLookupRef.current) {
        return;
      }
      if (form.getValues('pacienteId')) {
        form.setValue('nombre', '');
        form.setValue('apellido', '');
        form.setValue('telefono', '');
        form.setValue('mail', '');
        form.setValue('pacienteId', '');
        form.setValue('notificarMail', false);
        setPacienteLocked(false);
      }
      lastLookupRef.current = normalized;
      try {
        const found = await fetchPacienteByDocumento(raw);
        if (!found) {
          return;
        }
        lastLookupRef.current = found.documento;
        setPacienteLocked(true);
        form.setValue('pacienteId', found.id, { shouldValidate: true });
        form.setValue('nombre', found.nombre, { shouldValidate: true });
        form.setValue('apellido', found.apellido, { shouldValidate: true });
        form.setValue('telefono', found.telefono ?? '', {
          shouldValidate: true,
        });
        form.setValue('mail', found.mail ?? '', { shouldValidate: true });
      } catch {
        lastLookupRef.current = '';
      }
    },
    [form],
  );

  useEffect(() => {
    if (!open || readOnly) {
      return;
    }
    if (lookupTimer.current) {
      window.clearTimeout(lookupTimer.current);
    }
    lookupTimer.current = window.setTimeout(() => {
      void lookupPaciente(documento);
    }, LOOKUP_DEBOUNCE_MS);
    return () => {
      if (lookupTimer.current) {
        window.clearTimeout(lookupTimer.current);
      }
    };
  }, [documento, lookupPaciente, open, readOnly]);

  /**
   * Cierra el popup y cancela la carga de detalle.
   */
  function handleClose(): void {
    if (turnoId) {
      void queryClient.cancelQueries({ queryKey: ['turno-detalle', turnoId] });
    }
    form.reset(emptyTurnoFormValues());
    onClose();
  }

  /**
   * Envía alta o edición.
   *
   * @param values - Formulario validado.
   */
  async function onSubmit(values: TurnoFormValues): Promise<void> {
    setSaving(true);
    const body = toUpsertBody(values);
    try {
      if (mode?.kind === 'detail' && turnoId) {
        const saved = await updateTurno(turnoId, body);
        form.reset(valuesFromDetalle(saved));
        toastSuccess('Turno guardado correctamente');
        onSaved();
      } else {
        await createTurno(body);
        toastSuccess('Turno guardado correctamente');
        form.reset(emptyTurnoFormValues());
        onSaved();
        onClose();
      }
    } catch (error) {
      const detail =
        error instanceof ApiError
          ? error.message
          : 'No se pudo completar la operación. Intentá de nuevo.';
      showError(FRIENDLY_SAVE_ERROR, detail);
    } finally {
      setSaving(false);
    }
  }

  /**
   * Confirma el turno del detalle y cierra el popup si sale bien.
   */
  async function handleConfirmar(): Promise<void> {
    if (!turnoId) {
      return;
    }
    const ok = await confirmar(turnoId);
    if (ok) {
      onSaved();
      handleClose();
    }
  }

  if (!open || !mode) {
    return null;
  }

  const title = mode.kind === 'create' ? 'Nuevo Turno' : 'Detalle de Turno';
  const errors = form.formState.errors;
  const inputClass = (invalid: boolean) =>
    `${INPUT_BASE_CLASS} ${invalid ? 'border-danger' : 'border-border'}`;
  const horaInicioRegister = form.register('horaInicio');
  const horaFinRegister = form.register('horaFin', {
    onChange: () => setHoraFinTouched(true),
  });
  const notificarDisabled = readOnly || !mailValido;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-brand/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="turno-form-title"
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-xl border border-border bg-background bg-cover bg-center p-6 shadow-elevated"
        style={{
          backgroundImage:
            'linear-gradient(var(--glass-form-bg), var(--glass-form-bg)), url(/images/agenda/appointments-background.png)',
        }}
      >
        {(loadingDetalle || saving || confirming) && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/70"
            data-testid="turno-form-overlay"
          >
            <LoaderCircle
              className="size-8 animate-spin text-primary"
              aria-hidden
            />
            <span className="sr-only">
              {saving ? 'Guardando turno' : 'Cargando turno'}
            </span>
          </div>
        )}

        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-on-elevated text-brand-foreground">
              <CalendarPlus className="size-5" aria-hidden />
            </span>
            <h2
              id="turno-form-title"
              className="font-heading text-2xl font-bold text-on-elevated"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="cursor-pointer rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
            onClick={handleClose}
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <section className={`mb-4 ${FORM_SECTION_CLASS}`}>
            <h3 className="mb-4 text-base font-semibold text-on-elevated">
              Información del turno
            </h3>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              <div>
                <label
                  htmlFor="turno-medico"
                  className="mb-1 block text-sm font-medium"
                >
                  Médico
                </label>
                <Controller
                  control={form.control}
                  name="medicoId"
                  render={({ field }) => (
                    <Combobox
                      id="turno-medico"
                      value={field.value}
                      onChange={field.onChange}
                      options={medicosFiltrados.map((medico) => ({
                        id: medico.id,
                        label: `${medico.apellido}, ${medico.nombre}`,
                      }))}
                      placeholder="Seleccioná"
                      disabled={readOnly}
                      invalid={Boolean(errors.medicoId)}
                    />
                  )}
                />
                <FieldError message={errors.medicoId?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-especialidad"
                  className="mb-1 block text-sm font-medium"
                >
                  Especialidad
                </label>
                <Controller
                  control={form.control}
                  name="especialidadId"
                  render={({ field }) => (
                    <Combobox
                      id="turno-especialidad"
                      value={field.value}
                      onChange={field.onChange}
                      options={especialidadesFiltradas.map((item) => ({
                        id: item.id,
                        label: item.nombre,
                      }))}
                      placeholder="Seleccioná"
                      disabled={readOnly}
                      invalid={Boolean(errors.especialidadId)}
                    />
                  )}
                />
                <FieldError message={errors.especialidadId?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-tipo"
                  className="mb-1 block text-sm font-medium"
                >
                  Tipo de turno
                </label>
                <select
                  id="turno-tipo"
                  className={inputClass(Boolean(errors.tipo))}
                  disabled={readOnly}
                  {...form.register('tipo')}
                >
                  {tipo === 'PRIMER_TURNO' ? (
                    <option value="PRIMER_TURNO">Primer turno</option>
                  ) : null}
                  <option value="CONTROL">Control</option>
                  <option value="URGENTE">Urgente</option>
                  {tipo === 'SOBRETURNO' ? (
                    <option value="SOBRETURNO">Sobreturno</option>
                  ) : null}
                </select>
                <FieldError message={errors.tipo?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-fecha"
                  className="mb-1 block text-sm font-medium"
                >
                  Fecha
                </label>
                <input
                  id="turno-fecha"
                  type="date"
                  min={todayYmd()}
                  className={inputClass(Boolean(errors.fecha))}
                  disabled={readOnly}
                  {...form.register('fecha')}
                />
                <FieldError message={errors.fecha?.message} />
              </div>
              <div>
                <TimeField
                  id="turno-hora-inicio"
                  label="Hora de inicio"
                  invalid={Boolean(errors.horaInicio)}
                  disabled={readOnly}
                  registerProps={horaInicioRegister}
                  pickerLabel="Seleccionar hora de inicio"
                />
                <FieldError message={errors.horaInicio?.message} />
              </div>
              <div>
                <TimeField
                  id="turno-hora-fin"
                  label="Hora de fin"
                  invalid={Boolean(errors.horaFin)}
                  disabled={readOnly}
                  registerProps={horaFinRegister}
                  pickerLabel="Seleccionar hora de fin"
                />
                <FieldError message={errors.horaFin?.message} />
              </div>
            </div>
          </section>

          <section className={`mb-6 ${FORM_SECTION_CLASS}`}>
            <h3 className="mb-4 text-base font-semibold text-on-elevated">
              Datos del paciente
            </h3>
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
              <div>
                <label
                  htmlFor="turno-documento"
                  className="mb-1 block text-sm font-medium"
                >
                  Documento
                </label>
                <input
                  id="turno-documento"
                  className={inputClass(Boolean(errors.documento))}
                  disabled={readOnly}
                  {...form.register('documento', {
                    onBlur: () => {
                      void lookupPaciente(form.getValues('documento'));
                    },
                  })}
                />
                <FieldError message={errors.documento?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-nombre"
                  className="mb-1 block text-sm font-medium"
                >
                  Nombre
                </label>
                <input
                  id="turno-nombre"
                  className={inputClass(Boolean(errors.nombre))}
                  readOnly={pacienteLocked || readOnly}
                  {...form.register('nombre')}
                />
                <FieldError message={errors.nombre?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-apellido"
                  className="mb-1 block text-sm font-medium"
                >
                  Apellido
                </label>
                <input
                  id="turno-apellido"
                  className={inputClass(Boolean(errors.apellido))}
                  readOnly={pacienteLocked || readOnly}
                  {...form.register('apellido')}
                />
                <FieldError message={errors.apellido?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-telefono"
                  className="mb-1 block text-sm font-medium"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <input
                    id="turno-telefono"
                    inputMode="numeric"
                    className={`${inputClass(Boolean(errors.telefono))} pr-9`}
                    readOnly={pacienteLocked || readOnly}
                    {...form.register('telefono', {
                      onChange: (event) => {
                        event.target.value = digitsOnly(
                          event.target.value,
                        ).slice(0, 15);
                      },
                    })}
                  />
                  <Phone className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <FieldError message={errors.telefono?.message} />
              </div>
              <div>
                <label
                  htmlFor="turno-mail"
                  className="mb-1 block text-sm font-medium"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="turno-mail"
                    type="email"
                    className={`${inputClass(Boolean(errors.mail))} pr-9`}
                    readOnly={pacienteLocked || readOnly}
                    {...form.register('mail')}
                  />
                  <Mail className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <FieldError message={errors.mail?.message} />
              </div>
              <div className="flex items-end pb-6">
                <Controller
                  control={form.control}
                  name="notificarMail"
                  render={({ field }) => (
                    <NotifySwitch
                      id="turno-notificar-mail"
                      disabled={notificarDisabled}
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>
          </section>

          {showConfirmar ? (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                disabled={confirming}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-10 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleConfirmar()}
              >
                <Check className="size-4" aria-hidden />
                Confirmar turno
              </button>
            </div>
          ) : null}

          {isDetail && isMedico ? (
            <div className="mb-4 flex justify-center">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-10 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary-hover"
              >
                <Phone className="size-4" aria-hidden />
                Llamar paciente
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {isDetail && canWrite ? (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-danger underline hover:opacity-80"
              >
                <Trash2 className="size-4" aria-hidden />
                Anular turno
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-on-elevated/35 bg-background px-4 py-2 text-sm font-semibold uppercase text-on-elevated shadow-sm transition-colors hover:border-on-elevated/55 hover:bg-surface-elevated"
                onClick={handleClose}
              >
                <X className="size-4" aria-hidden />
                Salir
              </button>
              {showGuardar ? (
                <span
                  title={!guardarEnabled ? guardarTooltip : undefined}
                  className="inline-flex"
                >
                  <button
                    type="submit"
                    disabled={!guardarEnabled}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-on-elevated px-4 py-2 text-sm font-semibold uppercase text-brand-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save className="size-4" aria-hidden />
                    Guardar
                  </button>
                </span>
              ) : null}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Valida mail no vacío para habilitar notificación.
 *
 * @param value - Mail del form.
 * @returns true si se puede notificar.
 */
function isUsableEmail(value: string): boolean {
  return value.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Arma el body de POST/PATCH.
 *
 * @param values - Formulario.
 * @returns Request de upsert.
 */
function toUpsertBody(values: TurnoFormValues) {
  const tipo = values.tipo as TipoTurno;
  const notificarMail = values.notificarMail && isUsableEmail(values.mail);
  if (values.pacienteId) {
    return {
      pacienteId: values.pacienteId,
      medicoId: values.medicoId,
      especialidadId: values.especialidadId,
      fecha: values.fecha,
      horaInicio: values.horaInicio,
      horaFin: values.horaFin,
      tipo,
      notificarMail,
    };
  }
  return {
    paciente: {
      documento: values.documento,
      nombre: values.nombre,
      apellido: values.apellido,
      telefono: values.telefono || null,
      mail: values.mail || null,
    },
    medicoId: values.medicoId,
    especialidadId: values.especialidadId,
    fecha: values.fecha,
    horaInicio: values.horaInicio,
    horaFin: values.horaFin,
    tipo,
    notificarMail,
  };
}

/**
 * Rehidrata el form desde un detalle guardado.
 *
 * @param turno - Detalle persistido.
 * @returns Valores de form.
 */
function valuesFromDetalle(turno: TurnoDetalleDto): TurnoFormValues {
  return {
    medicoId: turno.medicoId,
    especialidadId: turno.especialidadId,
    tipo: turno.tipo,
    fecha: turno.fecha,
    horaInicio: turno.horaInicio,
    horaFin: turno.horaFin,
    documento: turno.paciente.documento,
    nombre: turno.paciente.nombre,
    apellido: turno.paciente.apellido,
    telefono: turno.paciente.telefono ?? '',
    mail: turno.paciente.mail ?? '',
    notificarMail: turno.notificarMail,
    pacienteId: turno.paciente.id,
  };
}
