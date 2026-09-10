import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LlamadoSalaEsperaDto } from '@turnos/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SalaEsperaBoard } from './sala-espera-board';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} />
  ),
}));

/**
 * Ítem de tablero para tests.
 *
 * @param id - Identificador.
 * @param overrides - Campos a pisar.
 * @returns DTO de llamado.
 */
function llamado(
  id: string,
  overrides: Partial<LlamadoSalaEsperaDto> = {},
): LlamadoSalaEsperaDto {
  return {
    id,
    consultorioNumero: 1,
    pacienteNombre: 'Pepe',
    pacienteApellido: 'Grillo',
    llamadoEn: '2026-09-09T13:00:00.000Z',
    ...overrides,
  };
}

describe('SalaEsperaBoard', () => {
  afterEach(() => {
    cleanup();
  });

  it('vacío no muestra filas de paciente', () => {
    render(
      <SalaEsperaBoard
        items={[]}
        dateLabel="Martes 26 de agosto"
        timeLabel="10:24"
        panelRef={null}
        onFullscreen={vi.fn()}
      />,
    );
    expect(screen.getByText('CONSULTORIO')).toBeInTheDocument();
    expect(screen.getByText('PACIENTE')).toBeInTheDocument();
    expect(screen.queryByText(/pepe grillo/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /pantalla completa/i }),
    ).toBeInTheDocument();
  });

  it('un llamado se destaca', () => {
    render(
      <SalaEsperaBoard
        items={[llamado('a')]}
        dateLabel="Martes 26 de agosto"
        timeLabel="10:24"
        panelRef={null}
        onFullscreen={vi.fn()}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/pepe grillo/i)).toBeInTheDocument();
  });

  it('recorta visualmente a los ítems recibidos (máximo 5)', () => {
    const items = [
      llamado('a', { pacienteNombre: 'Ana' }),
      llamado('b', { pacienteNombre: 'Beto' }),
      llamado('c', { pacienteNombre: 'Cora' }),
      llamado('d', { pacienteNombre: 'Dina' }),
      llamado('e', { pacienteNombre: 'Eva' }),
    ];
    render(
      <SalaEsperaBoard
        items={items}
        dateLabel="Martes 26 de agosto"
        timeLabel="10:24"
        panelRef={null}
        onFullscreen={vi.fn()}
      />,
    );
    expect(screen.getByText(/ana grillo/i)).toBeInTheDocument();
    expect(screen.getByText(/eva grillo/i)).toBeInTheDocument();
  });

  it('el nombre usa ellipsis por CSS', () => {
    render(
      <SalaEsperaBoard
        items={[
          llamado('a', {
            pacienteNombre: 'Juan Carlos',
            pacienteApellido: 'Pérez García de los Andes',
          }),
        ]}
        dateLabel="Martes 26 de agosto"
        timeLabel="10:24"
        panelRef={null}
        onFullscreen={vi.fn()}
      />,
    );
    const name = screen.getByText(/juan carlos/i);
    expect(name.className).toMatch(/truncate/);
  });

  it('el control de pantalla completa dispara el callback', async () => {
    const user = userEvent.setup();
    const onFullscreen = vi.fn();
    render(
      <SalaEsperaBoard
        items={[]}
        dateLabel="Martes 26 de agosto"
        timeLabel="10:24"
        panelRef={null}
        onFullscreen={onFullscreen}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: /pantalla completa/i }),
    );
    expect(onFullscreen).toHaveBeenCalledTimes(1);
  });
});
