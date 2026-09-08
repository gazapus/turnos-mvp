import { describe, expect, it } from 'vitest';

import { todayYmd } from '@/lib/agenda/fecha-dia';
import { emptyTurnoFormValues, turnoFormSchema } from './turno-form-schema';

/**
 * Valores mínimos válidos para el schema de turno.
 *
 * @returns Formulario válido.
 */
function validValues() {
  return {
    ...emptyTurnoFormValues(),
    medicoId: 'm1',
    especialidadId: 'e1',
    fecha: todayYmd(),
    horaInicio: '09:00',
    horaFin: '09:30',
    documento: '12345678',
    nombre: 'María',
    apellido: 'González',
  };
}

describe('turnoFormSchema', () => {
  it('acepta un alta completa', () => {
    expect(turnoFormSchema.safeParse(validValues()).success).toBe(true);
  });

  it('rechaza fecha anterior a hoy', () => {
    const result = turnoFormSchema.safeParse({
      ...validValues(),
      fecha: '2000-01-01',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'fecha'),
      ).toBe(true);
    }
  });

  it('rechaza hora de fin igual a la de inicio', () => {
    const result = turnoFormSchema.safeParse({
      ...validValues(),
      horaFin: '09:00',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === 'horaFin'),
      ).toBe(true);
    }
  });

  it('rechaza nombre corto', () => {
    const result = turnoFormSchema.safeParse({
      ...validValues(),
      nombre: 'Al',
    });
    expect(result.success).toBe(false);
  });
});
