import { describe, expect, it } from 'vitest';

import { prependLlamado } from './prepend-llamado';

describe('prependLlamado', () => {
  it('pone el nuevo primero', () => {
    const result = prependLlamado(
      [{ id: 'a' }, { id: 'b' }],
      { id: 'c' },
    );
    expect(result.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });

  it('recorta a 5', () => {
    const current = [
      { id: '1' },
      { id: '2' },
      { id: '3' },
      { id: '4' },
      { id: '5' },
    ];
    const result = prependLlamado(current, { id: 'n' });
    expect(result).toHaveLength(5);
    expect(result[0]?.id).toBe('n');
    expect(result[4]?.id).toBe('4');
  });
});
