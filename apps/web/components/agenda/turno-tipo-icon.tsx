import type { TipoTurno } from '@turnos/shared-types';
import Image from 'next/image';

const TIPO_TOOLTIPS: Record<TipoTurno, string> = {
  PRIMER_TURNO: 'Primer turno',
  CONTROL: 'Control',
  SOBRETURNO: 'Urgencia o sobreturno',
  URGENTE: 'Urgencia o sobreturno',
};

const TIPO_ICON_SRC: Record<TipoTurno, string> = {
  PRIMER_TURNO: '/images/general/primer_turno.webp',
  CONTROL: '/images/general/control.webp',
  SOBRETURNO: '/images/general/urgente.webp',
  URGENTE: '/images/general/urgente.webp',
};

const TIPO_ICON_PX = {
  md: 35,
  sm: 22,
} as const;

const TIPO_ICON_CLASS = {
  md: 'size-[2.1875rem] object-contain',
  sm: 'size-[1.375rem] object-contain',
} as const;

type TurnoTipoIconProps = {
  tipo: TipoTurno;
  /** `sm` es el tamaño de la vista Día (50% del listado + 25%). */
  size?: keyof typeof TIPO_ICON_PX;
};

/**
 * Ícono visual del tipo de turno (3 grupos: primer turno, control, urgencia).
 *
 * @param props - Tipo de turno Prisma y tamaño opcional.
 * @returns Ícono con tooltip accesible.
 */
export function TurnoTipoIcon({ tipo, size = 'md' }: TurnoTipoIconProps) {
  const tooltip = TIPO_TOOLTIPS[tipo];
  const px = TIPO_ICON_PX[size];

  return (
    <span title={tooltip} aria-label={tooltip} className="inline-flex">
      <Image
        src={TIPO_ICON_SRC[tipo]}
        alt=""
        width={px}
        height={px}
        className={TIPO_ICON_CLASS[size]}
        aria-hidden
      />
    </span>
  );
}

export { TIPO_TOOLTIPS };
