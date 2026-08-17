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
};

/**
 * Pill de color por estado de turno usando tokens semánticos del tema.
 *
 * @param props - Estado del turno.
 * @returns Badge con texto del estado.
 */
export function TurnoEstadoPill({ estado }: TurnoEstadoPillProps) {
  return (
    <span
      className={[
        'inline-flex h-8 min-w-[7.5rem] items-center justify-center rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase',
        ESTADO_STYLES[estado],
      ].join(' ')}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

export { ESTADO_LABELS };
