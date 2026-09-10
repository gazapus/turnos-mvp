import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { TurnoListItemDto } from '@turnos/shared-types';

import { todayYmd } from '@/lib/agenda/fecha-dia';
import { TurnoDiaCard } from './turno-dia-card';

/**
 * Ítem de turno PROGRAMADO de hoy para la card.
 *
 * @returns DTO de listado.
 */
function turnoHoy(): TurnoListItemDto {
  return {
    id: 't1',
    fecha: todayYmd(),
    hora: '09:00',
    horaFin: '09:30',
    paciente: { nombre: 'María', apellido: 'González' },
    medico: { nombre: 'Carlos', apellido: 'Médico' },
    especialidad: { nombre: 'Cardiología' },
    estado: 'PROGRAMADO',
    tipo: 'PRIMER_TURNO',
    llamado: false,
  };
}

describe('TurnoDiaCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('no muestra un control de confirmar ni de cancelar sobre la card', () => {
    render(<TurnoDiaCard turno={turnoHoy()} />);
    expect(
      screen.queryByRole('button', { name: /confirmar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /cancelar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /llamar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /finalizar/i }),
    ).not.toBeInTheDocument();
  });
});
