import { describe, expect, it } from 'vitest';

import { canFinalizarTurno } from './can-finalizar-turno';
import { todayYmd } from '@/lib/agenda/fecha-dia';

describe('canFinalizarTurno', () => {
  const now = new Date('2026-09-08T15:00:00.000Z');
  const hoy = todayYmd(now);

  it('permite médico con CONFIRMADO de hoy ya llamado', () => {
    expect(
      canFinalizarTurno({
        rol: 'MEDICO',
        estado: 'CONFIRMADO',
        fecha: hoy,
        llamado: true,
        now,
      }),
    ).toBe(true);
  });

  it('oculta hasta el primer llamado', () => {
    expect(
      canFinalizarTurno({
        rol: 'MEDICO',
        estado: 'CONFIRMADO',
        fecha: hoy,
        llamado: false,
        now,
      }),
    ).toBe(false);
  });

  it('oculta para recepcionista', () => {
    expect(
      canFinalizarTurno({
        rol: 'RECEPCIONISTA',
        estado: 'CONFIRMADO',
        fecha: hoy,
        llamado: true,
        now,
      }),
    ).toBe(false);
  });

  it('oculta si no es hoy', () => {
    expect(
      canFinalizarTurno({
        rol: 'MEDICO',
        estado: 'CONFIRMADO',
        fecha: '2026-09-09',
        llamado: true,
        now,
      }),
    ).toBe(false);
  });
});
