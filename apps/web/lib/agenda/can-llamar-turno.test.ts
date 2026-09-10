import { describe, expect, it } from 'vitest';

import { canLlamarTurno } from './can-llamar-turno';
import { todayYmd } from '@/lib/agenda/fecha-dia';

describe('canLlamarTurno', () => {
  const now = new Date('2026-09-08T15:00:00.000Z');
  const hoy = todayYmd(now);

  it('permite médico con CONFIRMADO de hoy', () => {
    expect(
      canLlamarTurno({
        rol: 'MEDICO',
        estado: 'CONFIRMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(true);
  });

  it('oculta para recepcionista', () => {
    expect(
      canLlamarTurno({
        rol: 'RECEPCIONISTA',
        estado: 'CONFIRMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(false);
  });

  it('oculta si no es hoy', () => {
    expect(
      canLlamarTurno({
        rol: 'MEDICO',
        estado: 'CONFIRMADO',
        fecha: '2026-09-09',
        now,
      }),
    ).toBe(false);
  });

  it('oculta si está programado', () => {
    expect(
      canLlamarTurno({
        rol: 'MEDICO',
        estado: 'PROGRAMADO',
        fecha: hoy,
        now,
      }),
    ).toBe(false);
  });
});
