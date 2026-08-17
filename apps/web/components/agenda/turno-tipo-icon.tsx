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

type TurnoTipoIconProps = {
  tipo: TipoTurno;
};

/**
 * Ícono visual del tipo de turno (3 grupos: primer turno, control, urgencia).
 *
 * @param props - Tipo de turno Prisma.
 * @returns Ícono con tooltip accesible.
 */
export function TurnoTipoIcon({ tipo }: TurnoTipoIconProps) {
  const tooltip = TIPO_TOOLTIPS[tipo];

  return (
    <span title={tooltip} aria-label={tooltip} className="inline-flex">
      <Image
        src={TIPO_ICON_SRC[tipo]}
        alt=""
        width={35}
        height={35}
        className="size-[2.1875rem] object-contain"
        aria-hidden
      />
    </span>
  );
}

export { TIPO_TOOLTIPS };
