import { ROLE_HOME_PATHS } from '@turnos/shared-types';
import { describe, expect, it } from 'vitest';

import { homePathForRole } from './role-home';

describe('homePathForRole', () => {
  it('redirige médico a agenda unificada', () => {
    expect(homePathForRole('MEDICO')).toBe('/agenda');
    expect(ROLE_HOME_PATHS.MEDICO).toBe('/agenda');
  });

  it('mantiene homes de admin y recepción', () => {
    expect(homePathForRole('ADMIN')).toBe('/usuarios');
    expect(homePathForRole('RECEPCIONISTA')).toBe('/agenda');
  });
});
