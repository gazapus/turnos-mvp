import { describe, expect, it } from 'vitest';

import { canConfirmarTurno } from './can-confirmar-turno';
import { todayYmd } from '@/lib/agenda/fecha-dia';

describe('canConfirmarTurno', () => {
  const now = new Date('2026-09-08T15:00:00.000Z');
  const hoy = todayYmd(now);

  it('permite recepcionista con PROGRAMADO de hoy', () => {
    expect(
      canConfirmarTurno({
        rol: 'RECEPCIONISTA',
        estado: 'PROGRAMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(true);
  });

  it('permite administrador con PROGRAMADO de hoy', () => {
    expect(
      canConfirmarTurno({
        rol: 'ADMIN',
        estado: 'PROGRAMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(true);
  });

  it('oculta para médico', () => {
    expect(
      canConfirmarTurno({
        rol: 'MEDICO',
        estado: 'PROGRAMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(false);
  });

  it('oculta si no es hoy', () => {
    expect(
      canConfirmarTurno({
        rol: 'RECEPCIONISTA',
        estado: 'PROGRAMADO',
        fecha: '2026-09-09',
        now,
      }),
    ).toBe(false);
  });

  it('oculta si ya está confirmado', () => {
    expect(
      canConfirmarTurno({
        rol: 'RECEPCIONISTA',
        estado: 'CONFIRMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(false);
  });
});
