import { describe, expect, it } from 'vitest';

import {
  addDaysYmd,
  formatYmdDisplay,
  isValidYmd,
  parseDmy,
  ymdToDmy,
} from './fecha-dia';

describe('fecha-dia', () => {
  it('valida YYYY-MM-DD reales y rechaza calendarios imposibles', () => {
    expect(isValidYmd('2026-08-16')).toBe(true);
    expect(isValidYmd('2026-13-40')).toBe(false);
    expect(isValidYmd('16/08/2026')).toBe(false);
  });

  it('formatea el despliegue como día mes año', () => {
    expect(formatYmdDisplay('2026-08-16')).toBe('16 agosto 2026');
  });

  it('convierte entre YYYY-MM-DD y DD/MM/YYYY', () => {
    expect(ymdToDmy('2026-08-16')).toBe('16/08/2026');
    expect(parseDmy('16/08/2026')).toBe('2026-08-16');
    expect(parseDmy('31/02/2026')).toBeNull();
  });

  it('avanza y retrocede de a un día', () => {
    expect(addDaysYmd('2026-08-16', 1)).toBe('2026-08-17');
    expect(addDaysYmd('2026-08-16', -1)).toBe('2026-08-15');
    expect(addDaysYmd('2026-12-31', 1)).toBe('2027-01-01');
  });
});
