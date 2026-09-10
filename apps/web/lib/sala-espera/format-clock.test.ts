import { describe, expect, it } from 'vitest';

import { formatMonitorDate, formatMonitorTime } from './format-clock';

describe('formatMonitorDate', () => {
  it('capitaliza weekday y mes al estilo del monitor', () => {
    const label = formatMonitorDate(new Date('2026-08-26T13:24:00.000Z'));
    expect(label).toMatch(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+ \d{1,2} de [A-ZÁÉÍÓÚÑ]/);
  });
});

describe('formatMonitorTime', () => {
  it('devuelve HH:mm en zona de clínica', () => {
    expect(formatMonitorTime(new Date('2026-08-26T13:24:00.000Z'))).toBe(
      '10:24',
    );
  });
});
