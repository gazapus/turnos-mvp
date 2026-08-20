import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  compactEstadoLabel,
  ESTADO_LABELS,
  ESTADO_LABELS_COMPACT,
  TurnoEstadoPill,
} from './turno-estado-pill';

describe('TurnoEstadoPill', () => {
  afterEach(() => {
    cleanup();
  });

  it.each(Object.entries(ESTADO_LABELS))(
    'muestra pill para estado %s',
    (estado, label) => {
      render(<TurnoEstadoPill estado={estado as keyof typeof ESTADO_LABELS} />);
      expect(screen.getByText(label)).toBeInTheDocument();
    },
  );

  it('en Lista no renderiza la etiqueta compacta', () => {
    render(<TurnoEstadoPill estado="PROGRAMADO" />);
    expect(screen.getByText('Programado')).toBeInTheDocument();
    expect(screen.queryByText('PRO')).not.toBeInTheDocument();
  });

  it('en modo compactible deja ambas etiquetas y el tooltip del label completo', () => {
    render(<TurnoEstadoPill estado="PROGRAMADO" compactible />);
    expect(screen.getByText('Programado')).toBeInTheDocument();
    expect(screen.getByText('PRO')).toBeInTheDocument();
    expect(screen.getByLabelText('Programado')).toHaveAttribute(
      'title',
      'Programado',
    );
  });
});

describe('compactEstadoLabel', () => {
  it.each(Object.entries(ESTADO_LABELS))(
    'mapea %s a las primeras tres letras',
    (estado, label) => {
      expect(compactEstadoLabel(label)).toBe(
        ESTADO_LABELS_COMPACT[estado as keyof typeof ESTADO_LABELS_COMPACT],
      );
      expect(compactEstadoLabel(label)).toHaveLength(3);
    },
  );

  it('produce las siglas de spec', () => {
    expect(ESTADO_LABELS_COMPACT.PROGRAMADO).toBe('PRO');
    expect(ESTADO_LABELS_COMPACT.CONFIRMADO).toBe('CON');
    expect(ESTADO_LABELS_COMPACT.ATENDIDO).toBe('ATE');
    expect(ESTADO_LABELS_COMPACT.AUSENTE).toBe('AUS');
    expect(ESTADO_LABELS_COMPACT.CANCELADO).toBe('CAN');
  });
});
