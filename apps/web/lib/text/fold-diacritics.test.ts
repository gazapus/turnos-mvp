import { describe, expect, it } from 'vitest';

import { foldDiacritics } from './fold-diacritics';

describe('foldDiacritics', () => {
  it('iguala variantes con y sin tilde', () => {
    expect(foldDiacritics('Pérez')).toBe(foldDiacritics('perez'));
    expect(foldDiacritics('Alarcón')).toBe(foldDiacritics('alarcon'));
  });
});
