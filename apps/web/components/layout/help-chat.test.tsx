import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FeedbackProvider } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { enviarMensajeChatbot } from '@/lib/api/chatbot-client';
import { HelpChat } from './help-chat';
import { CHATBOT_FRIENDLY_ERROR } from './help-chat-panel';

vi.mock('@/lib/api/chatbot-client', () => ({
  enviarMensajeChatbot: vi.fn(),
}));

const mockEnviar = vi.mocked(enviarMensajeChatbot);

/**
 * Render del chat de ayuda con feedback.
 */
function renderHelpChat() {
  return render(
    <FeedbackProvider>
      <HelpChat />
    </FeedbackProvider>,
  );
}

describe('HelpChat', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('abre y cierra el panel con AYUDA BOT', async () => {
    const user = userEvent.setup();
    renderHelpChat();

    expect(screen.queryByLabelText(/chat de ayuda/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));
    expect(screen.getByLabelText(/chat de ayuda/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));
    expect(screen.queryByLabelText(/chat de ayuda/i)).not.toBeInTheDocument();
  });

  it('no pide autocompletado del navegador en el campo de mensaje', async () => {
    const user = userEvent.setup();
    renderHelpChat();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));

    const campo = screen.getByLabelText(/^mensaje$/i);
    expect(campo).toHaveAttribute('autocomplete', 'off');
    expect(campo.closest('form')).toHaveAttribute('autocomplete', 'off');
  });

  it('muestra la pregunta y la respuesta del asistente', async () => {
    const user = userEvent.setup();
    mockEnviar.mockResolvedValue({
      respuesta: 'Confirmá el mismo día.',
      dentroDeDominio: true,
    });
    renderHelpChat();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));
    await user.type(screen.getByLabelText(/^mensaje$/i), 'cómo confirmo');
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));

    expect(await screen.findByText('cómo confirmo')).toBeInTheDocument();
    expect(
      await screen.findByText('Confirmá el mismo día.'),
    ).toBeInTheDocument();
    expect(mockEnviar).toHaveBeenCalledWith({ mensaje: 'cómo confirmo' });
  });

  it('muestra negritas del asistente sin asteriscos markdown', async () => {
    const user = userEvent.setup();
    mockEnviar.mockResolvedValue({
      respuesta: 'Solo para **Recepcionista** y **Administrador**.',
      dentroDeDominio: true,
    });
    renderHelpChat();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));
    await user.type(screen.getByLabelText(/^mensaje$/i), 'cómo creo un turno');
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));

    expect(await screen.findByText('Recepcionista')).toHaveProperty(
      'tagName',
      'STRONG',
    );
    expect(screen.getByText('Administrador').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });

  it('muestra el dialog de error si falla el envío', async () => {
    const user = userEvent.setup();
    mockEnviar.mockRejectedValue(
      new ApiError({
        statusCode: 502,
        message: 'No se pudo obtener respuesta del asistente',
        error: 'Bad Gateway',
        path: '/api/chatbot/mensajes',
        timestamp: new Date().toISOString(),
      }),
    );
    renderHelpChat();

    await user.click(screen.getByRole('button', { name: /ayuda bot/i }));
    await user.type(screen.getByLabelText(/^mensaje$/i), 'hola');
    await user.click(screen.getByRole('button', { name: /^enviar$/i }));

    expect(await screen.findByText(CHATBOT_FRIENDLY_ERROR)).toBeInTheDocument();
    expect(
      screen.getByText('No se pudo obtener respuesta del asistente'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/chat de ayuda/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('hola')).toBeInTheDocument();
    });
  });
});
