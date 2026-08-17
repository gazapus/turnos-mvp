import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ESTADO_LABELS, TurnoEstadoPill } from './turno-estado-pill';

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
});
