import { Injectable } from '@nestjs/common';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DEFAULT_GEMINI_MODEL } from './chatbot.constants';
import type { ChatbotLlmAdapter } from './chatbot.graph';

const CLASSIFY_SCHEMA = {
  type: 'object',
  properties: {
    dentroDeDominio: {
      type: 'boolean',
      description:
        'true si es un saludo breve, una pregunta de cómo usar esta aplicación o de sus términos (primer turno, estados, especialidades) según el manual; false si pide datos reales, acciones (cancelá este turno) o temas ajenos',
    },
  },
  required: ['dentroDeDominio'],
  additionalProperties: false,
} as const;

/**
 * Adaptador Gemini: clasificación estructurada y generación con stuffing.
 */
@Injectable()
export class GeminiChatbotLlm implements ChatbotLlmAdapter {
  private readonly model: ChatGoogleGenerativeAI;

  constructor() {
    this.model = new ChatGoogleGenerativeAI({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
      apiKey: process.env.GOOGLE_API_KEY,
      temperature: 0,
    });
  }

  /**
   * Decide si el mensaje es uso documentado de la app.
   *
   * @param mensaje - Pregunta del usuario.
   * @param corpus - Manual markdown.
   * @returns true si está en dominio.
   */
  async classify(mensaje: string, corpus: string): Promise<boolean> {
    const structured = this.model.withStructuredOutput(CLASSIFY_SCHEMA);
    const result = (await structured.invoke([
      {
        role: 'user',
        content: `Sos un clasificador. El manual de la app es:\n\n${corpus}\n\nPregunta del usuario:\n${mensaje}\n\n¿El mensaje es un saludo breve (hola, buen día), una pregunta de términos de la app (qué es un primer turno, estados, especialidades) o pide ayuda para usar esta aplicación según el manual? Eso es dominio (true). Si pide el clima, datos operativos (qué turnos tengo), o que ejecutes una acción sobre un turno concreto (cancelá este, llamá a Juan), dentroDeDominio es false.`,
      },
    ])) as { dentroDeDominio: boolean };
    return result.dentroDeDominio === true;
  }

  /**
   * Genera una respuesta solo con el corpus.
   *
   * @param mensaje - Pregunta del usuario.
   * @param corpus - Manual markdown.
   * @param historial - Turnos previos de la conversación.
   * @returns Texto de ayuda.
   */
  async generate(
    mensaje: string,
    corpus: string,
    historial: string[],
  ): Promise<string> {
    const historyBlock =
      historial.length > 0
        ? `\n\nConversación previa:\n${historial.join('\n')}`
        : '';
    const response = await this.model.invoke([
      {
        role: 'user',
        content: `Sos el asistente de ayuda de una clínica. Respondé en español, breve y claro, SOLO con el manual. Si el usuario solo saluda, respondé con cordialidad en una o dos oraciones y ofrecé ayuda sobre el uso de la app, sin volcar el manual. Si preguntan un término (primer turno, estados, especialidad, llamado), explicá con el glosario. Si el manual no alcanza, decí que no está documentado. No inventes pantallas. No consultes bases de datos. Destacá nombres de botones, pantallas y roles con markdown **negrita**. Poné cada paso numerado en su propia línea.\n\nManual:\n${corpus}${historyBlock}\n\nPregunta:\n${mensaje}`,
      },
    ]);
    const text = response.content;
    if (typeof text === 'string') {
      return text;
    }
    if (Array.isArray(text)) {
      return text
        .map((part) => {
          if (typeof part === 'string') {
            return part;
          }
          if (
            part &&
            typeof part === 'object' &&
            'text' in part &&
            typeof part.text === 'string'
          ) {
            return part.text;
          }
          return '';
        })
        .join('');
    }
    return String(text);
  }
}
