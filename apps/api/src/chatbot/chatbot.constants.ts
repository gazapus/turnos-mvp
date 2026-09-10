export const CHATBOT_REFUSAL_MESSAGE =
  'Solo puedo ayudarte con el uso de esta aplicación.' as const;

export const CHATBOT_GREETING_REPLY =
  '¡Hola! Decime en qué te ayudo con la aplicación: agenda, turnos, consultorios u otra función.' as const;

export const CHATBOT_MENSAJE_MAX_LENGTH = 2000 as const;

export const CHATBOT_MENSAJE_VACIO = 'El mensaje no puede estar vacío' as const;

export const CHATBOT_LLM_ERROR =
  'No se pudo obtener respuesta del asistente' as const;

export const DEFAULT_GEMINI_MODEL = 'gemini-flash-latest' as const;
