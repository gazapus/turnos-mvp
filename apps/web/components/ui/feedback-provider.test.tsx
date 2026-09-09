import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { FeedbackProvider, useFeedback } from './feedback-provider';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.body.removeAttribute('data-confirm-text');
  document.body.removeAttribute('data-confirm-dismissed');
});

/**
 * Botón de prueba que dispara toast, error y confirmación.
 *
 * @returns Controles de prueba.
 */
function FeedbackProbe() {
  const { toastSuccess, showError, showConfirm } = useFeedback();
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
      <button
        type="button"
        onClick={async () => {
          const result = await showConfirm({
            title: '¿Cancelar este turno?',
            optionalText: { label: 'Motivo (opcional)', maxLength: 500 },
          });
          if (result.accepted) {
            document.body.setAttribute('data-confirm-text', result.text);
          } else {
            document.body.setAttribute('data-confirm-dismissed', '1');
          }
        }}
      >
        confirm
      </button>
      <div role="dialog" aria-labelledby="form-title">
        <h2 id="form-title">Detalle de Turno</h2>
      </div>
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
    const errorDialog = screen.getByRole('alertdialog');
    expect(errorDialog).toHaveTextContent('No se pudo guardar el turno');
    expect(errorDialog).toHaveTextContent('Médico inválido');
    expect(errorDialog).toHaveClass('border-danger');

    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('warning Cancelar no confirma', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <FeedbackProbe />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'confirm' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      '¿Cancelar este turno?',
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(document.body.getAttribute('data-confirm-dismissed')).toBe('1');
    expect(document.body.getAttribute('data-confirm-text')).toBeNull();
  });

  it('warning Aceptar devuelve el texto', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <FeedbackProbe />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'confirm' }));
    await user.type(
      screen.getByLabelText(/motivo \(opcional\)/i),
      'Paciente reprogramó',
    );
    await user.click(screen.getByRole('button', { name: 'Aceptar' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(document.body.getAttribute('data-confirm-text')).toBe(
      'Paciente reprogramó',
    );
  });

  it('warning se muestra sobre otra modal', async () => {
    const user = userEvent.setup();
    render(
      <FeedbackProvider>
        <FeedbackProbe />
      </FeedbackProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'confirm' }));
    expect(
      screen.getByRole('dialog', { name: /detalle de turno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});
