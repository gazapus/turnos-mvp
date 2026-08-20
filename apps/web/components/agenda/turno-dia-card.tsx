import type { EstadoTurno, TurnoListItemDto } from '@turnos/shared-types';
import { Stethoscope, User } from 'lucide-react';

import { TurnoEstadoPill } from './turno-estado-pill';
import { TurnoTipoIcon } from './turno-tipo-icon';

const ESTADO_CARD_BG: Record<EstadoTurno, string> = {
  PROGRAMADO: 'bg-estado-programado-soft',
  CONFIRMADO: 'bg-estado-confirmado-soft',
  ATENDIDO: 'bg-estado-atendido-soft',
  AUSENTE: 'bg-estado-ausente-soft',
  CANCELADO: 'bg-estado-cancelado-soft',
};

type TurnoDiaCardProps = {
  turno: TurnoListItemDto;
};

/**
 * Contenido de la card de un turno en la grilla del modo Día.
 *
 * @param props - Turno a visualizar.
 * @returns Card con médico, paciente, estado y tipo.
 */
export function TurnoDiaCard({ turno }: TurnoDiaCardProps) {
  const medicoNombre = `${turno.medico.nombre} ${turno.medico.apellido}`;
  const pacienteNombre = `${turno.paciente.nombre} ${turno.paciente.apellido}`;

  return (
    <div
      className={[
        'flex h-full min-h-0 items-center gap-1.5 overflow-hidden rounded-md p-1.5 text-foreground',
        ESTADO_CARD_BG[turno.estado],
      ].join(' ')}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="flex min-w-0 items-center gap-1 truncate text-xs font-semibold">
          <Stethoscope className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{medicoNombre}</span>
        </p>
        <p className="flex min-w-0 items-center gap-1 truncate text-xs">
          <User className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{pacienteNombre}</span>
        </p>
      </div>
      <div className="shrink-0">
        <TurnoEstadoPill estado={turno.estado} />
      </div>
      <div className="shrink-0">
        <TurnoTipoIcon tipo={turno.tipo} size="sm" />
      </div>
    </div>
  );
}
