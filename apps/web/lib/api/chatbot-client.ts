import type {
  ChatbotMensajeRequest,
  ChatbotMensajeResponse,
} from '@turnos/shared-types';

import { ApiError, type ApiErrorBody } from '@/lib/api/auth-client';

/**
 * Fetch JSON same-origin (proxy Next → Nest) con cookies.
 *
 * @param path - Ruta relativa bajo `/api`.
 * @param init - Opciones fetch.
 * @returns JSON tipado.
 */
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (
      data !== null &&
      typeof data === 'object' &&
      'message' in data &&
      'statusCode' in data
    ) {
      throw new ApiError(data as ApiErrorBody);
    }
    throw new Error(`HTTP ${response.status}`);
  }

  return data as T;
}

/**
 * Envía un mensaje al chatbot de documentación.
 *
 * @param body - Pregunta del usuario.
 * @returns Respuesta del asistente.
 */
export function enviarMensajeChatbot(
  body: ChatbotMensajeRequest,
): Promise<ChatbotMensajeResponse> {
  return apiFetch<ChatbotMensajeResponse>('/api/chatbot/mensajes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
