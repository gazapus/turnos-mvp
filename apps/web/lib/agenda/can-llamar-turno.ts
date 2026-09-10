import type { AuthRole, EstadoTurno } from '@turnos/shared-types';

import { todayYmd } from '@/lib/agenda/fecha-dia';

type CanLlamarTurnoParams = {
  rol: AuthRole;
  estado: EstadoTurno;
  fecha: string;
  now?: Date;
};

/**
 * Indica si el médico puede ver y usar Llamar para ese turno.
 *
 * @param params - Rol, estado, fecha civil del turno y instante opcional.
 * @returns true si aplica Llamar.
 */
export function canLlamarTurno(params: CanLlamarTurnoParams): boolean {
  if (params.rol !== 'MEDICO') {
    return false;
  }
  if (params.estado !== 'CONFIRMADO') {
    return false;
  }
  return params.fecha === todayYmd(params.now);
}
