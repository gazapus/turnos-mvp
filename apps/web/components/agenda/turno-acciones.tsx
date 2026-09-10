'use client';

import type { AuthRole, EstadoTurno } from '@turnos/shared-types';
import { Check, Phone, X } from 'lucide-react';

import { canCancelarTurno } from '@/lib/agenda/can-cancelar-turno';
import { canConfirmarTurno } from '@/lib/agenda/can-confirmar-turno';
import { canFinalizarTurno } from '@/lib/agenda/can-finalizar-turno';
import { canLlamarTurno } from '@/lib/agenda/can-llamar-turno';
import { useCancelarTurno } from './use-cancelar-turno';
import { useConfirmarTurno } from './use-confirmar-turno';
import { useFinalizarTurno } from './use-finalizar-turno';
import { useLlamarTurno } from './use-llamar-turno';

type TurnoAccionesProps = {
  rol: AuthRole;
  estado: EstadoTurno;
  fecha: string;
  turnoId: string;
  llamado: boolean;
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
 * Botones de acción por rol. Confirmar, Cancelar, Llamar y Finalizar ejecutan la transición.
 *
 * @param props - Rol, turno y callback tras mutar.
 * @returns Icon buttons circulares con tooltip según rol.
 */
export function TurnoAcciones({
  rol,
  estado,
  fecha,
  turnoId,
  llamado,
  onConfirmado,
}: TurnoAccionesProps) {
  const { confirmar, pending: confirming } = useConfirmarTurno();
  const { cancelar, pending: canceling } = useCancelarTurno();
  const { llamar, pending: calling } = useLlamarTurno();
  const { finalizar, pending: finishing } = useFinalizarTurno();
  const pending = confirming || canceling || calling || finishing;
  const showConfirmar = canConfirmarTurno({ rol, estado, fecha });
  const showCancelar = canCancelarTurno({ rol, estado });
  const showLlamar = canLlamarTurno({ rol, estado, fecha });
  const showFinalizar = canFinalizarTurno({ rol, estado, fecha, llamado });

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

  /**
   * Abre confirmación de cancelar sin abrir el detalle.
   *
   * @param event - Click del ícono.
   */
  async function handleCancelar(event: {
    stopPropagation: () => void;
  }): Promise<void> {
    event.stopPropagation();
    const ok = await cancelar(turnoId);
    if (ok) {
      onConfirmado();
    }
  }

  /**
   * Llama al paciente sin abrir el detalle.
   *
   * @param event - Click del ícono.
   */
  async function handleLlamar(event: {
    stopPropagation: () => void;
  }): Promise<void> {
    event.stopPropagation();
    const ok = await llamar(turnoId);
    if (ok) {
      onConfirmado();
    }
  }

  /**
   * Finaliza el turno sin abrir el detalle.
   *
   * @param event - Click del ícono.
   */
  async function handleFinalizar(event: {
    stopPropagation: () => void;
  }): Promise<void> {
    event.stopPropagation();
    const ok = await finalizar(turnoId);
    if (ok) {
      onConfirmado();
    }
  }

  if (rol === 'MEDICO') {
    return (
      <div className="flex items-center gap-2" onClick={stopRowClick}>
        {showLlamar ? (
          <button
            type="button"
            title="Llamar al paciente"
            aria-label="Llamar al paciente"
            disabled={pending}
            className={`${BOTON_ACCION_BASE} text-on-elevated hover:border-on-elevated/40 hover:bg-on-elevated/10`}
            onClick={(event) => void handleLlamar(event)}
          >
            <Phone className="size-[1.3rem]" aria-hidden />
          </button>
        ) : null}
        {showFinalizar ? (
          <button
            type="button"
            title="Finalizar turno"
            aria-label="Finalizar turno"
            disabled={pending}
            className={`${BOTON_ACCION_BASE} text-success hover:border-success/40 hover:bg-success/10`}
            onClick={(event) => void handleFinalizar(event)}
          >
            <Check className="size-[1.3rem]" aria-hidden />
          </button>
        ) : null}
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
      {showCancelar ? (
        <button
          type="button"
          title="Cancelar turno"
          aria-label="Cancelar turno"
          disabled={pending}
          className={`${BOTON_ACCION_BASE} text-danger hover:border-danger/40 hover:bg-danger/10`}
          onClick={handleCancelar}
        >
          <X className="size-[1.3rem]" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
