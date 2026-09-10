'use client';

import { useCallback, useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { finalizarTurno } from '@/lib/api/turnos-client';

export const FINALIZAR_TOAST = 'Turno finalizado correctamente';
export const FRIENDLY_FINALIZAR_ERROR = 'No se pudo finalizar el turno';

/**
 * Finaliza un turno: toast de éxito o dialog de error, con flag de pending.
 *
 * @returns `finalizar` y `pending`.
 */
export function useFinalizarTurno(): {
  finalizar: (id: string) => Promise<boolean>;
  pending: boolean;
} {
  const { toastSuccess, showError } = useFeedback();
  const [pending, setPending] = useState(false);

  const finalizar = useCallback(
    async (id: string): Promise<boolean> => {
      setPending(true);
      try {
        await finalizarTurno(id);
        toastSuccess(FINALIZAR_TOAST);
        return true;
      } catch (error) {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_FINALIZAR_ERROR, detail);
        return false;
      } finally {
        setPending(false);
      }
    },
    [showError, toastSuccess],
  );

  return { finalizar, pending };
}
