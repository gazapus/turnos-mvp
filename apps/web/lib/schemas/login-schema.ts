import { z } from 'zod';

/**
 * Esquema de ejemplo para formularios con React Hook Form + Zod.
 * Usar este patrón en pantallas de login y alta de usuarios.
 */
export const loginSchema = z.object({
  mail: z.string().email('Mail inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
