import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { loadChatbotCorpus } from './chatbot.corpus';
import {
  createChatbotGraph,
  type ChatbotCompiledGraph,
  type ChatbotLlmAdapter,
} from './chatbot.graph';
import { GeminiChatbotLlm } from './gemini-chatbot-llm';

/**
 * Compila y ejecuta el grafo LangGraph del chatbot de documentación.
 */
@Injectable()
export class ChatbotGraphService implements OnModuleInit {
  private graph!: ChatbotCompiledGraph;

  constructor(
    @InjectPinoLogger(ChatbotGraphService.name)
    private readonly logger: PinoLogger,
    private readonly llm: GeminiChatbotLlm,
  ) {}

  /**
   * Carga el corpus y compila el grafo al iniciar el módulo.
   */
  onModuleInit(): void {
    const corpus = loadChatbotCorpus();
    this.graph = createChatbotGraph(this.llm, corpus);
    this.logger.info('Grafo del chatbot de documentación listo');
  }

  /**
   * Inicializa con un corpus y adaptador (tests).
   *
   * @param corpus - Markdown.
   * @param llm - Adaptador.
   */
  initForTests(corpus: string, llm: ChatbotLlmAdapter): void {
    this.graph = createChatbotGraph(llm, corpus);
  }

  /**
   * Ejecuta un turno de conversación.
   *
   * @param mensaje - Pregunta.
   * @param userId - `sub` del JWT (thread_id).
   * @returns Respuesta y flag de dominio.
   */
  async invoke(
    mensaje: string,
    userId: string,
  ): Promise<{ respuesta: string; dentroDeDominio: boolean }> {
    const result = await this.graph.invoke(
      { mensaje },
      { configurable: { thread_id: userId } },
    );
    return {
      respuesta: result.respuesta,
      dentroDeDominio: result.dentroDeDominio,
    };
  }
}
