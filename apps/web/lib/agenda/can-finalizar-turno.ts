import type { AuthRole, EstadoTurno } from '@turnos/shared-types';

import { todayYmd } from '@/lib/agenda/fecha-dia';

type CanFinalizarTurnoParams = {
  rol: AuthRole;
  estado: EstadoTurno;
  fecha: string;
  llamado: boolean;
  now?: Date;
};

/**
 * Indica si el médico puede ver y usar Finalizar para ese turno.
 *
 * @param params - Rol, estado, fecha, flag de llamado e instante opcional.
 * @returns true si aplica Finalizar.
 */
export function canFinalizarTurno(params: CanFinalizarTurnoParams): boolean {
  if (!params.llamado) {
    return false;
  }
  if (params.rol !== 'MEDICO') {
    return false;
  }
  if (params.estado !== 'CONFIRMADO') {
    return false;
  }
  return params.fecha === todayYmd(params.now);
}
