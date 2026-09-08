import { z } from 'zod';

import { todayYmd } from '@/lib/agenda/fecha-dia';

const HM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Schema Zod del formulario de alta/edición de turno.
 */
export const turnoFormSchema = z
  .object({
    medicoId: z.string().min(1, 'Seleccioná un médico'),
    especialidadId: z.string().min(1, 'Seleccioná una especialidad'),
    tipo: z.enum(['PRIMER_TURNO', 'CONTROL', 'SOBRETURNO', 'URGENTE']),
    fecha: z
      .string()
      .regex(YMD_PATTERN, 'Fecha inválida')
      .refine((value) => value >= todayYmd(), {
        message: 'La fecha no puede ser anterior a hoy',
      }),
    horaInicio: z.string().regex(HM_PATTERN, 'Hora inválida'),
    horaFin: z.string().regex(HM_PATTERN, 'Hora inválida'),
    documento: z.string().min(1, 'Documento requerido'),
    nombre: z
      .string()
      .min(3, 'Mínimo 3 caracteres')
      .max(45, 'Máximo 45 caracteres'),
    apellido: z
      .string()
      .min(3, 'Mínimo 3 caracteres')
      .max(45, 'Máximo 45 caracteres'),
    telefono: z
      .string()
      .refine((value) => value === '' || /^\d{1,15}$/.test(value), {
        message: 'Solo dígitos, máximo 15',
      }),
    mail: z
      .string()
      .max(50, 'Máximo 50 caracteres')
      .refine(
        (value) => value === '' || z.string().email().safeParse(value).success,
        { message: 'Mail inválido' },
      ),
    notificarMail: z.boolean(),
    pacienteId: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.horaFin === values.horaInicio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['horaFin'],
        message: 'La hora de fin debe ser posterior a la de inicio',
      });
    }
  });

/**
 * Valores del formulario de turno.
 */
export type TurnoFormValues = z.infer<typeof turnoFormSchema>;

/**
 * Valores vacíos para un alta.
 *
 * @returns Defaults del formulario.
 */
export function emptyTurnoFormValues(): TurnoFormValues {
  return {
    medicoId: '',
    especialidadId: '',
    tipo: 'CONTROL',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    documento: '',
    nombre: '',
    apellido: '',
    telefono: '',
    mail: '',
    notificarMail: false,
    pacienteId: '',
  };
}
