import { foldDiacritics, escapeLikePattern } from './fold-diacritics';

describe('foldDiacritics', () => {
  it('iguala variantes con y sin tilde', () => {
    expect(foldDiacritics('González')).toBe(foldDiacritics('gonzalez'));
    expect(foldDiacritics('María')).toBe(foldDiacritics('maria'));
    expect(foldDiacritics('Pérez')).toBe(foldDiacritics('PEREZ'));
    expect(foldDiacritics('Ñandú')).toBe(foldDiacritics('nandu'));
  });
});

describe('escapeLikePattern', () => {
  it('escapa comodines de LIKE', () => {
    expect(escapeLikePattern('100%_off\\x')).toBe('100\\%\\_off\\\\x');
  });
});
