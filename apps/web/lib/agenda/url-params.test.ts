import type { AuthUser } from '@turnos/shared-types';
import { describe, expect, it } from 'vitest';

import {
  defaultCanceladosForRole,
  parseAgendaUrlParams,
  serializeAgendaUrlParams,
} from './url-params';

const adminUser: AuthUser = {
  id: 'admin-1',
  mail: 'admin@test.com',
  nombre: 'Admin',
  apellido: 'User',
  rol: 'ADMIN',
};

const medicoUser: AuthUser = {
  id: 'medico-1',
  mail: 'medico@test.com',
  nombre: 'Carlos',
  apellido: 'Médico',
  rol: 'MEDICO',
};

describe('serializeAgendaUrlParams', () => {
  it('incluye cancelados=true cuando el checkbox está marcado', () => {
    const search = serializeAgendaUrlParams({
      vista: 'lista',
      cancelados: true,
    });

    expect(search.get('cancelados')).toBe('true');
  });

  it('incluye cancelados=false cuando el checkbox está desmarcado', () => {
    const search = serializeAgendaUrlParams({
      vista: 'lista',
      cancelados: false,
    });

    expect(search.get('cancelados')).toBe('false');
  });
});

describe('parseAgendaUrlParams', () => {
  it('aplica default por rol cuando cancelados no está en la URL', () => {
    expect(
      parseAgendaUrlParams({}, adminUser).cancelados,
    ).toBe(defaultCanceladosForRole('ADMIN'));
    expect(
      parseAgendaUrlParams({}, medicoUser).cancelados,
    ).toBe(defaultCanceladosForRole('MEDICO'));
  });

  it('respeta cancelados=false explícito en la URL', () => {
    expect(
      parseAgendaUrlParams({ cancelados: 'false' }, adminUser).cancelados,
    ).toBe(false);
  });
});

describe('cancelados round-trip', () => {
  it('preserva cancelados=false al serializar y parsear (regresión admin)', () => {
    const serialized = serializeAgendaUrlParams({
      vista: 'lista',
      cancelados: false,
    });

    const record = Object.fromEntries(serialized.entries());
    const parsed = parseAgendaUrlParams(record, adminUser);

    expect(parsed.cancelados).toBe(false);
  });
});
