'use client';

import { useCallback, useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { confirmarTurno } from '@/lib/api/turnos-client';

export const CONFIRMAR_TOAST = 'Turno confirmado correctamente';
export const FRIENDLY_CONFIRM_ERROR = 'No se pudo confirmar el turno';

/**
 * Confirma un turno: toast de éxito o dialog de error, con flag de pending.
 *
 * @returns `confirmar` y `pending`.
 */
export function useConfirmarTurno(): {
  confirmar: (id: string) => Promise<boolean>;
  pending: boolean;
} {
  const { toastSuccess, showError } = useFeedback();
  const [pending, setPending] = useState(false);

  const confirmar = useCallback(
    async (id: string): Promise<boolean> => {
      setPending(true);
      try {
        await confirmarTurno(id);
        toastSuccess(CONFIRMAR_TOAST);
        return true;
      } catch (error) {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_CONFIRM_ERROR, detail);
        return false;
      } finally {
        setPending(false);
      }
    },
    [showError, toastSuccess],
  );

  return { confirmar, pending };
}
