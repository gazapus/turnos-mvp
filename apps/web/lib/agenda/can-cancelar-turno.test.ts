import { describe, expect, it } from 'vitest';

import { canCancelarTurno } from './can-cancelar-turno';

describe('canCancelarTurno', () => {
  it('permite recepcionista con PROGRAMADO', () => {
    expect(
      canCancelarTurno({ rol: 'RECEPCIONISTA', estado: 'PROGRAMADO' }),
    ).toBe(true);
  });

  it('permite administrador con CONFIRMADO', () => {
    expect(canCancelarTurno({ rol: 'ADMIN', estado: 'CONFIRMADO' })).toBe(true);
  });

  it('oculta para médico', () => {
    expect(canCancelarTurno({ rol: 'MEDICO', estado: 'PROGRAMADO' })).toBe(
      false,
    );
  });

  it('oculta ATENDIDO, AUSENTE y CANCELADO', () => {
    expect(canCancelarTurno({ rol: 'RECEPCIONISTA', estado: 'ATENDIDO' })).toBe(
      false,
    );
    expect(canCancelarTurno({ rol: 'RECEPCIONISTA', estado: 'AUSENTE' })).toBe(
      false,
    );
    expect(
      canCancelarTurno({ rol: 'RECEPCIONISTA', estado: 'CANCELADO' }),
    ).toBe(false);
  });
});
