import { describe, expect, it } from 'vitest';

import { navItemsForRole } from './nav-items';

describe('navItemsForRole', () => {
  it('incluye Agenda para todos los roles', () => {
    for (const rol of ['ADMIN', 'RECEPCIONISTA', 'MEDICO'] as const) {
      const hrefs = navItemsForRole(rol).map((item) => item.href);
      expect(hrefs).toContain('/agenda');
    }
  });

  it('filtra menú de administrador', () => {
    expect(navItemsForRole('ADMIN').map((i) => i.id)).toEqual([
      'agenda',
      'consultorios',
      'pacientes',
      'usuarios',
      'sala-espera',
    ]);
  });

  it('filtra menú de recepcionista sin Usuarios', () => {
    expect(navItemsForRole('RECEPCIONISTA').map((i) => i.id)).toEqual([
      'agenda',
      'consultorios',
      'pacientes',
      'sala-espera',
    ]);
  });

  it('filtra menú de médico solo Agenda', () => {
    expect(navItemsForRole('MEDICO').map((i) => i.id)).toEqual(['agenda']);
  });
});
