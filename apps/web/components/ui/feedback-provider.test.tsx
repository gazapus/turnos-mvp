import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { FeedbackProvider, useFeedback } from './feedback-provider';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/**
 * Botón de prueba que dispara toast y error.
 *
 * @returns Controles de prueba.
 */
function FeedbackProbe() {
  const { toastSuccess, showError } = useFeedback();
  return (
    <div>
      <button
        type="button"
        onClick={() => toastSuccess('Turno guardado correctamente')}
      >
        toast
      </button>
      <button
        type="button"
        onClick={() =>
          showError('No se pudo guardar el turno', 'Médico inválido')
        }
      >
        error
      </button>
    </div>
  );
}

describe('FeedbackProvider', () => {
  it('muestra un toast de éxito', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <FeedbackProbe />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'toast' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'Turno guardado correctamente',
    );
  });

  it('muestra el dialog de error con detalle y cierra con Cerrar', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <FeedbackProbe />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'error' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'No se pudo guardar el turno',
    );
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Médico inválido',
    );

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
