import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TIPO_TOOLTIPS, TurnoTipoIcon } from './turno-tipo-icon';

describe('TurnoTipoIcon', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra tooltip de primer turno', () => {
    render(<TurnoTipoIcon tipo="PRIMER_TURNO" />);
    expect(
      screen.getByLabelText(TIPO_TOOLTIPS.PRIMER_TURNO),
    ).toBeInTheDocument();
  });

  it('muestra tooltip de control', () => {
    render(<TurnoTipoIcon tipo="CONTROL" />);
    expect(screen.getByLabelText(TIPO_TOOLTIPS.CONTROL)).toBeInTheDocument();
  });

  it('agrupa sobreturno y urgente con el mismo tooltip', () => {
    const { unmount } = render(<TurnoTipoIcon tipo="SOBRETURNO" />);
    expect(screen.getByLabelText(TIPO_TOOLTIPS.SOBRETURNO)).toBeInTheDocument();
    unmount();
    render(<TurnoTipoIcon tipo="URGENTE" />);
    expect(screen.getByLabelText(TIPO_TOOLTIPS.URGENTE)).toBeInTheDocument();
  });
});
