'use client';

import { useCallback, useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { cancelarTurno } from '@/lib/api/turnos-client';

export const CANCELAR_TOAST = 'Turno cancelado correctamente';
export const FRIENDLY_CANCEL_ERROR = 'No se pudo cancelar el turno';
export const CANCELAR_CONFIRM_TITLE = '¿Cancelar este turno?';
export const MOTIVO_CANCELACION_LABEL = 'Motivo (opcional)';
export const MOTIVO_CANCELACION_MAX = 500;

/**
 * Confirma y cancela un turno: dialog warning, toast de éxito o error.
 *
 * @returns `cancelar` y `pending`.
 */
export function useCancelarTurno(): {
  cancelar: (id: string) => Promise<boolean>;
  pending: boolean;
} {
  const { toastSuccess, showError, showConfirm } = useFeedback();
  const [pending, setPending] = useState(false);

  const cancelar = useCallback(
    async (id: string): Promise<boolean> => {
      const result = await showConfirm({
        title: CANCELAR_CONFIRM_TITLE,
        optionalText: {
          label: MOTIVO_CANCELACION_LABEL,
          maxLength: MOTIVO_CANCELACION_MAX,
        },
      });
      if (!result.accepted) {
        return false;
      }
      setPending(true);
      try {
        await cancelarTurno(id, result.text || undefined);
        toastSuccess(CANCELAR_TOAST);
        return true;
      } catch (error) {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_CANCEL_ERROR, detail);
        return false;
      } finally {
        setPending(false);
      }
    },
    [showConfirm, showError, toastSuccess],
  );

  return { cancelar, pending };
}
