import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { TurnoAcciones } from './turno-acciones';

describe('TurnoAcciones', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra confirmar y cancelar para recepcionista', () => {
    render(<TurnoAcciones rol="RECEPCIONISTA" />);
    expect(
      screen.getByRole('button', { name: /confirmar paciente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /cancelar turno/i }),
    ).toBeInTheDocument();
  });

  it('muestra llamar y finalizar para médico', () => {
    render(<TurnoAcciones rol="MEDICO" />);
    expect(
      screen.getByRole('button', { name: /llamar al paciente/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /finalizar turno/i }),
    ).toBeInTheDocument();
  });
});
