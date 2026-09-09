import type { ConsultorioDto } from '@turnos/shared-types';
import { describe, expect, it } from 'vitest';

import {
  resolveAssignmentIntent,
  SIN_ASIGNAR_OPTION_ID,
} from './assignment-intent';

const perez = { id: 'm-perez', nombre: 'Juan', apellido: 'Pérez' };
const gomez = { id: 'm-gomez', nombre: 'Laura', apellido: 'Gómez' };

const catalog: ConsultorioDto[] = [
  { id: 'c3', numero: 3, medico: perez },
  { id: 'c4', numero: 4, medico: null },
  { id: 'c7', numero: 7, medico: gomez },
];

describe('resolveAssignmentIntent', () => {
  it('ignora el tipeo vacío', () => {
    expect(
      resolveAssignmentIntent({
        target: catalog[1]!,
        catalog,
        selectedOptionId: '',
        selectedMedicoLabel: '',
      }),
    ).toEqual({ kind: 'noop' });
  });

  it('no-op si elige el mismo médico', () => {
    expect(
      resolveAssignmentIntent({
        target: catalog[0]!,
        catalog,
        selectedOptionId: perez.id,
        selectedMedicoLabel: 'Pérez, Juan',
      }),
    ).toEqual({ kind: 'noop' });
  });

  it('inmediato si hueco y médico libre', () => {
    expect(
      resolveAssignmentIntent({
        target: catalog[1]!,
        catalog,
        selectedOptionId: 'm-libre',
        selectedMedicoLabel: 'Ruiz, Diego',
      }),
    ).toEqual({ kind: 'immediate', medicoId: 'm-libre' });
  });

  it('confirma al mover', () => {
    const intent = resolveAssignmentIntent({
      target: catalog[1]!,
      catalog,
      selectedOptionId: perez.id,
      selectedMedicoLabel: 'Pérez, Juan',
    });
    expect(intent.kind).toBe('confirm');
    if (intent.kind === 'confirm') {
      expect(intent.medicoId).toBe(perez.id);
      expect(intent.title).toContain('ya está en el 3');
      expect(intent.title).toContain('dejar el 3 libre');
    }
  });

  it('confirma al reemplazar', () => {
    const intent = resolveAssignmentIntent({
      target: catalog[2]!,
      catalog,
      selectedOptionId: 'm-libre',
      selectedMedicoLabel: 'Ruiz, Diego',
    });
    expect(intent.kind).toBe('confirm');
    if (intent.kind === 'confirm') {
      expect(intent.title).toContain('está asignado a Gómez, Laura');
      expect(intent.title).toContain('dejar a Gómez, Laura sin consultorio');
    }
  });

  it('confirma al mover y desalojar', () => {
    const intent = resolveAssignmentIntent({
      target: catalog[2]!,
      catalog,
      selectedOptionId: perez.id,
      selectedMedicoLabel: 'Pérez, Juan',
    });
    expect(intent.kind).toBe('confirm');
    if (intent.kind === 'confirm') {
      expect(intent.title).toContain('ya está en el 3');
      expect(intent.title).toContain('asignado a Gómez, Laura');
    }
  });

  it('confirma al desasignar', () => {
    const intent = resolveAssignmentIntent({
      target: catalog[0]!,
      catalog,
      selectedOptionId: SIN_ASIGNAR_OPTION_ID,
      selectedMedicoLabel: SIN_ASIGNAR_OPTION_ID,
    });
    expect(intent).toEqual({
      kind: 'confirm',
      medicoId: null,
      title: '¿Desasignar a Pérez, Juan del consultorio 3?',
    });
  });
});
