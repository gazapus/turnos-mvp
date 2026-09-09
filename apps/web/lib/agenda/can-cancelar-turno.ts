import type { AuthRole, EstadoTurno } from '@turnos/shared-types';

type CanCancelarTurnoParams = {
  rol: AuthRole;
  estado: EstadoTurno;
};

/**
 * Indica si el usuario puede ver y usar Cancelar para ese turno.
 *
 * @param params - Rol y estado del turno.
 * @returns true si aplica Cancelar.
 */
export function canCancelarTurno(params: CanCancelarTurnoParams): boolean {
  if (params.rol !== 'ADMIN' && params.rol !== 'RECEPCIONISTA') {
    return false;
  }
  return params.estado === 'PROGRAMADO' || params.estado === 'CONFIRMADO';
}
