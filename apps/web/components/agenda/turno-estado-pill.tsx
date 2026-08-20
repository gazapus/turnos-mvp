import type { EstadoTurno } from '@turnos/shared-types';

const ESTADO_LABELS: Record<EstadoTurno, string> = {
  PROGRAMADO: 'Programado',
  CONFIRMADO: 'Confirmado',
  ATENDIDO: 'Atendido',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
};

const ESTADO_STYLES: Record<EstadoTurno, string> = {
  PROGRAMADO: 'bg-brand-subtle text-on-elevated',
  CONFIRMADO: 'bg-success text-success-foreground',
  ATENDIDO: 'bg-accent-soft text-accent-foreground',
  AUSENTE: 'border border-border bg-muted text-foreground',
  CANCELADO: 'bg-danger text-danger-foreground',
};

type TurnoEstadoPillProps = {
  estado: EstadoTurno;
  /**
   * En modo Día: deja ambas etiquetas en el DOM para compactar por CSS.
   * El modo Lista no lo usa (texto completo + min-width 7.5rem).
   */
  compactible?: boolean;
};

/**
 * Recorta un label de estado a las primeras tres letras en mayúsculas.
 *
 * @param label - Texto completo del estado (ej. "Programado").
 * @returns Sigla de tres letras (ej. "PRO").
 */
export function compactEstadoLabel(label: string): string {
  return label.slice(0, 3).toUpperCase();
}

const ESTADO_LABELS_COMPACT: Record<EstadoTurno, string> = {
  PROGRAMADO: compactEstadoLabel(ESTADO_LABELS.PROGRAMADO),
  CONFIRMADO: compactEstadoLabel(ESTADO_LABELS.CONFIRMADO),
  ATENDIDO: compactEstadoLabel(ESTADO_LABELS.ATENDIDO),
  AUSENTE: compactEstadoLabel(ESTADO_LABELS.AUSENTE),
  CANCELADO: compactEstadoLabel(ESTADO_LABELS.CANCELADO),
};

/**
 * Pill de color por estado de turno usando tokens semánticos del tema.
 *
 * @param props - Estado del turno y si admite versión compacta (vista Día).
 * @returns Badge con texto del estado.
 */
export function TurnoEstadoPill({
  estado,
  compactible = false,
}: TurnoEstadoPillProps) {
  const label = ESTADO_LABELS[estado];
  const compact = ESTADO_LABELS_COMPACT[estado];

  return (
    <span
      className={[
        'turno-estado-pill inline-flex h-8 items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase',
        compactible
          ? 'turno-estado-pill--compactible min-w-[7.5rem]'
          : 'min-w-[7.5rem]',
        ESTADO_STYLES[estado],
      ].join(' ')}
      title={compactible ? label : undefined}
      aria-label={compactible ? label : undefined}
    >
      <span className="turno-estado-pill-full">{label}</span>
      {compactible && (
        <span className="turno-estado-pill-short" aria-hidden>
          {compact}
        </span>
      )}
    </span>
  );
}

export { ESTADO_LABELS, ESTADO_LABELS_COMPACT };
