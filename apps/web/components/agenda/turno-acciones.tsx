'use client';

import type { AuthRole, EstadoTurno } from '@turnos/shared-types';
import { Check, Phone, X } from 'lucide-react';

import { canConfirmarTurno } from '@/lib/agenda/can-confirmar-turno';
import { useConfirmarTurno } from './use-confirmar-turno';

type TurnoAccionesProps = {
  rol: AuthRole;
  estado: EstadoTurno;
  fecha: string;
  turnoId: string;
  onConfirmado: () => void;
};

/**
 * Evita que el click en Acciones abra el detalle de la fila.
 *
 * @param event - Click en el contenedor de botones.
 */
function stopRowClick(event: { stopPropagation: () => void }): void {
  event.stopPropagation();
}

const BOTON_ACCION_BASE =
  'inline-flex cursor-pointer items-center justify-center rounded-full border border-border bg-surface p-2 transition-all duration-200 ease-out hover:scale-110 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100';

/**
 * Botones de acción por rol. Confirmar ejecuta la transición; el resto es stub.
 *
 * @param props - Rol, turno y callback tras confirmar.
 * @returns Icon buttons circulares con tooltip según rol.
 */
export function TurnoAcciones({
  rol,
  estado,
  fecha,
  turnoId,
  onConfirmado,
}: TurnoAccionesProps) {
  const { confirmar, pending } = useConfirmarTurno();
  const showConfirmar = canConfirmarTurno({ rol, estado, fecha });

  /**
   * Confirma sin abrir el detalle de la fila.
   *
   * @param event - Click del ícono.
   */
  async function handleConfirmar(event: {
    stopPropagation: () => void;
  }): Promise<void> {
    event.stopPropagation();
    const ok = await confirmar(turnoId);
    if (ok) {
      onConfirmado();
    }
  }

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
      {showConfirmar ? (
        <button
          type="button"
          title="Confirmar paciente"
          aria-label="Confirmar paciente"
          disabled={pending}
          className={`${BOTON_ACCION_BASE} text-on-elevated hover:border-on-elevated/40 hover:bg-on-elevated/10`}
          onClick={handleConfirmar}
        >
          <Check className="size-[1.3rem]" aria-hidden />
        </button>
      ) : null}
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
