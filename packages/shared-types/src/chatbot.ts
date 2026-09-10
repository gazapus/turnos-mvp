/**
 * Body de POST /api/chatbot/mensajes.
 */
export type ChatbotMensajeRequest = {
  mensaje: string;
};

/**
 * Respuesta del asistente de documentación.
 */
export type ChatbotMensajeResponse = {
  respuesta: string;
  dentroDeDominio: boolean;
};
