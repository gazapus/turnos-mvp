import { describe, expect, it } from 'vitest';

import {
  CONSULTORIOS_MAX_COLS,
  splitConsultorioColumns,
} from './split-columns';

describe('splitConsultorioColumns', () => {
  it('5 consultorios: una columna en cualquier viewport', () => {
    expect(splitConsultorioColumns(5, CONSULTORIOS_MAX_COLS.desktop)).toEqual([
      5,
    ]);
    expect(splitConsultorioColumns(5, CONSULTORIOS_MAX_COLS.medium)).toEqual([
      5,
    ]);
    expect(splitConsultorioColumns(5, CONSULTORIOS_MAX_COLS.small)).toEqual([
      5,
    ]);
  });

  it('10 consultorios: 8+2 en desktop y mediana, 10 en chica', () => {
    expect(splitConsultorioColumns(10, CONSULTORIOS_MAX_COLS.desktop)).toEqual([
      8, 2,
    ]);
    expect(splitConsultorioColumns(10, CONSULTORIOS_MAX_COLS.medium)).toEqual([
      8, 2,
    ]);
    expect(splitConsultorioColumns(10, CONSULTORIOS_MAX_COLS.small)).toEqual([
      10,
    ]);
  });

  it('20 consultorios: 8+8+4 desktop, 10+10 mediana, 20 chica', () => {
    expect(splitConsultorioColumns(20, CONSULTORIOS_MAX_COLS.desktop)).toEqual([
      8, 8, 4,
    ]);
    expect(splitConsultorioColumns(20, CONSULTORIOS_MAX_COLS.medium)).toEqual([
      10, 10,
    ]);
    expect(splitConsultorioColumns(20, CONSULTORIOS_MAX_COLS.small)).toEqual([
      20,
    ]);
  });

  it('25 consultorios: 9+8+8 desktop, 13+12 mediana', () => {
    expect(splitConsultorioColumns(25, CONSULTORIOS_MAX_COLS.desktop)).toEqual([
      9, 8, 8,
    ]);
    expect(splitConsultorioColumns(25, CONSULTORIOS_MAX_COLS.medium)).toEqual([
      13, 12,
    ]);
    expect(splitConsultorioColumns(25, CONSULTORIOS_MAX_COLS.small)).toEqual([
      25,
    ]);
  });

  it('30 consultorios: 10+10+10 desktop, 15+15 mediana', () => {
    expect(splitConsultorioColumns(30, CONSULTORIOS_MAX_COLS.desktop)).toEqual([
      10, 10, 10,
    ]);
    expect(splitConsultorioColumns(30, CONSULTORIOS_MAX_COLS.medium)).toEqual([
      15, 15,
    ]);
    expect(splitConsultorioColumns(30, CONSULTORIOS_MAX_COLS.small)).toEqual([
      30,
    ]);
  });
});
