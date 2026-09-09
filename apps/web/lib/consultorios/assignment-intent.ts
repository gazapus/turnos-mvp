import type { ConsultorioDto } from '@turnos/shared-types';

/** Id sentinela de la opción para desasignar (no es UUID). */
export const SIN_ASIGNAR_OPTION_ID = 'sin-asignar' as const;

/** Label de desasignar. */
export const SIN_ASIGNAR_LABEL = 'Sin asignar' as const;

/**
 * Formato Apellido, Nombre usado en agenda y confirmaciones.
 *
 * @param persona - Nombre y apellido.
 * @returns Label.
 */
export function consultorioPersonaLabel(persona: {
  nombre: string;
  apellido: string;
}): string {
  return `${persona.apellido}, ${persona.nombre}`;
}

/** Resultado de evaluar un cambio de asignación en el cliente. */
export type AssignmentIntent =
  | { kind: 'noop' }
  | { kind: 'immediate'; medicoId: string }
  | { kind: 'confirm'; medicoId: string | null; title: string };

type ResolveArgs = {
  target: ConsultorioDto;
  catalog: ConsultorioDto[];
  selectedOptionId: string;
  selectedMedicoLabel: string;
};

/**
 * Decide si el cambio es no-op, inmediato o requiere confirmación.
 *
 * @param args - Fila destino, catálogo y opción elegida.
 * @returns Intent de persistencia.
 */
export function resolveAssignmentIntent(args: ResolveArgs): AssignmentIntent {
  const { target, catalog, selectedOptionId, selectedMedicoLabel } = args;
  if (selectedOptionId === '') {
    return { kind: 'noop' };
  }

  const selectedMedicoId =
    selectedOptionId === SIN_ASIGNAR_OPTION_ID ? null : selectedOptionId;
  const currentId = target.medico?.id ?? null;
  if (selectedMedicoId === currentId) {
    return { kind: 'noop' };
  }

  if (selectedMedicoId === null) {
    if (!target.medico) {
      return { kind: 'noop' };
    }
    return {
      kind: 'confirm',
      medicoId: null,
      title: `¿Desasignar a ${consultorioPersonaLabel(target.medico)} del consultorio ${target.numero}?`,
    };
  }

  const previous = catalog.find(
    (item) => item.medico?.id === selectedMedicoId && item.id !== target.id,
  );
  const occupant = target.medico;

  if (!previous && !occupant) {
    return { kind: 'immediate', medicoId: selectedMedicoId };
  }

  if (previous && !occupant) {
    return {
      kind: 'confirm',
      medicoId: selectedMedicoId,
      title: `${selectedMedicoLabel} ya está en el ${previous.numero}. ¿Moverlo al ${target.numero} y dejar el ${previous.numero} libre?`,
    };
  }

  if (!previous && occupant) {
    const occupantLabel = consultorioPersonaLabel(occupant);
    return {
      kind: 'confirm',
      medicoId: selectedMedicoId,
      title: `El consultorio ${target.numero} está asignado a ${occupantLabel}. ¿Asignarlo a ${selectedMedicoLabel} y dejar a ${occupantLabel} sin consultorio?`,
    };
  }

  const previousNumero = previous?.numero ?? 0;
  const occupantLabel = occupant
    ? consultorioPersonaLabel(occupant)
    : selectedMedicoLabel;
  return {
    kind: 'confirm',
    medicoId: selectedMedicoId,
    title: `${selectedMedicoLabel} ya está en el ${previousNumero} y el ${target.numero} está asignado a ${occupantLabel}. ¿Mover a ${selectedMedicoLabel} al ${target.numero}, dejar el ${previousNumero} libre y dejar a ${occupantLabel} sin consultorio?`,
  };
}
