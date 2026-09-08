import type { AuthRole } from '@turnos/shared-types';
import { Check, Phone, X } from 'lucide-react';

type TurnoAccionesProps = {
  rol: AuthRole;
};

/**
 * Evita que el click en Acciones abra el detalle de la fila.
 *
 * @param event - Click en el contenedor de botones.
 */
function stopRowClick(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

/**
 * Botones de acción estáticos por rol (sin handlers funcionales).
 *
 * @param props - Rol del usuario autenticado.
 * @returns Icon buttons con tooltip según rol.
 */
const BOTON_ACCION_BASE =
  'inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-surface p-2 transition-all duration-200 ease-out hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Botones de acción estáticos por rol (sin handlers funcionales).
 *
 * @param props - Rol del usuario autenticado.
 * @returns Icon buttons circulares con animación de hover y tooltip según rol.
 */
export function TurnoAcciones({ rol }: TurnoAccionesProps) {
  if (rol === 'MEDICO') {
    return (
      <div className="flex items-center gap-2" onClick={stopRowClick}>
        <button
          type="button"
          title="Llamar al paciente"
          aria-label="Llamar al paciente"
          className={`${BOTON_ACCION_BASE} text-on-elevated hover:border-on-elevated/40 hover:bg-on-elevated/10`}
        >
          <Phone className="size-[1.3rem]" aria-hidden />
        </button>
        <button
          type="button"
          title="Finalizar turno"
          aria-label="Finalizar turno"
          className={`${BOTON_ACCION_BASE} text-success hover:border-success/40 hover:bg-success/10`}
        >
          <Check className="size-[1.3rem]" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2" onClick={stopRowClick}>
      <button
        type="button"
        title="Confirmar paciente"
        aria-label="Confirmar paciente"
        className={`${BOTON_ACCION_BASE} text-on-elevated hover:border-on-elevated/40 hover:bg-on-elevated/10`}
      >
        <Check className="size-[1.3rem]" aria-hidden />
      </button>
      <button
        type="button"
        title="Cancelar turno"
        aria-label="Cancelar turno"
        className={`${BOTON_ACCION_BASE} text-danger hover:border-danger/40 hover:bg-danger/10`}
      >
        <X className="size-[1.3rem]" aria-hidden />
      </button>
    </div>
  );
}
