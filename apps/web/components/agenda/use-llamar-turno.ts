'use client';

import { useCallback, useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { llamarTurno } from '@/lib/api/turnos-client';

export const LLAMAR_TOAST = 'Paciente llamado correctamente';
export const FRIENDLY_LLAMAR_ERROR = 'No se pudo llamar al paciente';

/**
 * Llama un turno: toast de éxito o dialog de error, con flag de pending.
 *
 * @returns `llamar` y `pending`.
 */
export function useLlamarTurno(): {
  llamar: (id: string) => Promise<boolean>;
  pending: boolean;
} {
  const { toastSuccess, showError } = useFeedback();
  const [pending, setPending] = useState(false);

  const llamar = useCallback(
    async (id: string): Promise<boolean> => {
      setPending(true);
      try {
        await llamarTurno(id);
        toastSuccess(LLAMAR_TOAST);
        return true;
      } catch (error) {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_LLAMAR_ERROR, detail);
        return false;
      } finally {
        setPending(false);
      }
    },
    [showError, toastSuccess],
  );

  return { llamar, pending };
}
