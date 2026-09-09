import type { AuthRole, EstadoTurno } from '@turnos/shared-types';

import { todayYmd } from '@/lib/agenda/fecha-dia';

type CanConfirmarTurnoParams = {
  rol: AuthRole;
  estado: EstadoTurno;
  fecha: string;
  now?: Date;
};

/**
 * Indica si el usuario puede ver y usar Confirmar para ese turno.
 *
 * @param params - Rol, estado, fecha civil del turno y instante opcional.
 * @returns true si aplica Confirmar.
 */
export function canConfirmarTurno(params: CanConfirmarTurnoParams): boolean {
  if (params.rol !== 'ADMIN' && params.rol !== 'RECEPCIONISTA') {
    return false;
  }
  if (params.estado !== 'PROGRAMADO') {
    return false;
  }
  return params.fecha === todayYmd(params.now);
}
