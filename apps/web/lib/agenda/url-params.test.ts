import type { AuthUser } from '@turnos/shared-types';
import { describe, expect, it } from 'vitest';

import {
  defaultSoloPendientesForRole,
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
  it('incluye soloPendientes=true cuando el checkbox está marcado', () => {
    const search = serializeAgendaUrlParams({
      vista: 'lista',
      soloPendientes: true,
      fecha: '2026-08-16',
    });

    expect(search.get('soloPendientes')).toBe('true');
  });

  it('incluye soloPendientes=false cuando el checkbox está desmarcado', () => {
    const search = serializeAgendaUrlParams({
      vista: 'lista',
      soloPendientes: false,
      fecha: '2026-08-16',
    });

    expect(search.get('soloPendientes')).toBe('false');
  });
});

describe('parseAgendaUrlParams', () => {
  it('aplica default por rol cuando soloPendientes no está en la URL', () => {
    expect(parseAgendaUrlParams({}, adminUser).soloPendientes).toBe(
      defaultSoloPendientesForRole('ADMIN'),
    );
    expect(parseAgendaUrlParams({}, medicoUser).soloPendientes).toBe(
      defaultSoloPendientesForRole('MEDICO'),
    );
  });

  it('ignora el query param cancelados legado', () => {
    expect(
      parseAgendaUrlParams({ cancelados: 'true' }, medicoUser).soloPendientes,
    ).toBe(true);
    expect(
      parseAgendaUrlParams({ cancelados: 'false' }, adminUser).soloPendientes,
    ).toBe(false);
  });

  it('hidrata fecha desde la URL y defaulta a hoy si falta', () => {
    expect(parseAgendaUrlParams({ fecha: '2026-08-16' }, adminUser).fecha).toBe(
      '2026-08-16',
    );
    expect(parseAgendaUrlParams({}, adminUser).fecha).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});

describe('soloPendientes round-trip', () => {
  it('preserva soloPendientes=true al serializar y parsear (regresión médico)', () => {
    const serialized = serializeAgendaUrlParams({
      vista: 'lista',
      soloPendientes: true,
      fecha: '2026-08-16',
    });

    const record = Object.fromEntries(serialized.entries());
    const parsed = parseAgendaUrlParams(record, adminUser);

    expect(parsed.soloPendientes).toBe(true);
  });
});
