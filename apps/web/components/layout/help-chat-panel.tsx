'use client';

import { useState } from 'react';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import { enviarMensajeChatbot } from '@/lib/api/chatbot-client';
import { renderChatMarkdown } from '@/lib/chatbot';

export const CHATBOT_FRIENDLY_ERROR = 'No se pudo consultar la ayuda';

type ChatTurn = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

let nextTurnId = 0;

/**
 * Identificador estable para un globo del hilo.
 *
 * @returns Id incremental.
 */
function nextChatTurnId(): number {
  nextTurnId += 1;
  return nextTurnId;
}

type HelpChatPanelProps = {
  open: boolean;
};

/**
 * Extrae un mensaje de error para el dialog.
 *
 * @param error - Fallo desconocido.
 * @returns Texto de detalle.
 */
function errorDetail(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Error inesperado';
}

/**
 * Panel de conversación del asistente de documentación.
 *
 * @param props - Si el panel está visible.
 * @returns Panel de chat o null.
 */
export function HelpChatPanel({ open }: HelpChatPanelProps) {
  const { showError } = useFeedback();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);

  if (!open) {
    return null;
  }

  /**
   * Envía el borrador al API y agrega la respuesta al hilo.
   *
   * @param event - Submit del formulario.
   */
  async function handleSubmit(event: {
    preventDefault: () => void;
  }): Promise<void> {
    event.preventDefault();
    const mensaje = draft.trim();
    if (!mensaje || pending) {
      return;
    }

    setDraft('');
    setTurns((prev) => [
      ...prev,
      { id: nextChatTurnId(), role: 'user', text: mensaje },
    ]);
    setPending(true);

    try {
      const result = await enviarMensajeChatbot({ mensaje });
      setTurns((prev) => [
        ...prev,
        { id: nextChatTurnId(), role: 'assistant', text: result.respuesta },
      ]);
    } catch (error: unknown) {
      showError(CHATBOT_FRIENDLY_ERROR, errorDetail(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      id="help-chat-panel"
      aria-label="Chat de ayuda"
      className="fixed bottom-14 right-6 z-50 flex h-96 w-96 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-help-bot max-md:right-3 max-md:w-[calc(100vw-1.5rem)]"
    >
      <header className="relative z-10 shrink-0 border-b border-border px-4 py-3">
        <h2 className="font-heading text-sm font-semibold text-foreground">
          Ayuda
        </h2>
        <p className="text-xs text-muted-foreground">
          Preguntas sobre el uso de esta aplicación
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {turns.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Escribí cómo confirmar un turno, qué es un primer turno u otra
            función o término de la app.
          </p>
        ) : null}
        {turns.map((turn) =>
          turn.role === 'user' ? (
            <p
              key={turn.id}
              className="self-end rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
            >
              {turn.text}
            </p>
          ) : (
            <div
              key={turn.id}
              className="self-start rounded-md bg-muted px-3 py-2 text-sm text-foreground"
            >
              {renderChatMarkdown(turn.text)}
            </div>
          ),
        )}
        {pending ? (
          <output className="text-sm text-muted-foreground">Pensando…</output>
        ) : null}
      </div>

      <form
        autoComplete="off"
        className="flex gap-2 border-t border-border p-3"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="ayuda-bot-pregunta">
          Mensaje
        </label>
        <input
          id="ayuda-bot-pregunta"
          name="ayuda-bot-pregunta"
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck
          value={draft}
          maxLength={2000}
          disabled={pending}
          onChange={(event) => setDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-input-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
          placeholder="Escribí tu pregunta"
        />
        <button
          type="submit"
          disabled={pending || draft.trim().length === 0}
          className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}
