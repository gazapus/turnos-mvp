import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { isChatbotGreeting } from './chatbot-greeting';
import {
  CHATBOT_GREETING_REPLY,
  CHATBOT_REFUSAL_MESSAGE,
} from './chatbot.constants';

/**
 * Adaptador de LLM para clasificar y generar (inyectable en tests).
 */
export type ChatbotLlmAdapter = {
  classify: (mensaje: string, corpus: string) => Promise<boolean>;
  generate: (
    mensaje: string,
    corpus: string,
    historial: string[],
  ) => Promise<string>;
};

const ChatbotState = Annotation.Root({
  mensaje: Annotation<string>(),
  respuesta: Annotation<string>(),
  dentroDeDominio: Annotation<boolean>(),
  historial: Annotation<string[]>({
    reducer: (left: string[], right: string[]) => left.concat(right),
    default: () => [],
  }),
});

type ChatbotStateType = typeof ChatbotState.State;

/**
 * Compila el grafo classify → generate | refuse.
 *
 * @param llm - Adaptador de modelo.
 * @param corpus - Markdown concatenado.
 * @returns Grafo compilado con MemorySaver.
 */
export function createChatbotGraph(llm: ChatbotLlmAdapter, corpus: string) {
  const workflow = new StateGraph(ChatbotState)
    .addNode('classify', async (state: ChatbotStateType) => {
      if (isChatbotGreeting(state.mensaje)) {
        return { dentroDeDominio: true };
      }
      const dentroDeDominio = await llm.classify(state.mensaje, corpus);
      return { dentroDeDominio };
    })
    .addNode('generate', async (state: ChatbotStateType) => {
      const respuesta = isChatbotGreeting(state.mensaje)
        ? CHATBOT_GREETING_REPLY
        : await llm.generate(state.mensaje, corpus, state.historial);
      return {
        respuesta,
        historial: [`Usuario: ${state.mensaje}`, `Asistente: ${respuesta}`],
      };
    })
    .addNode('refuse', (state: ChatbotStateType) => {
      return {
        respuesta: CHATBOT_REFUSAL_MESSAGE,
        dentroDeDominio: false,
        historial: [
          `Usuario: ${state.mensaje}`,
          `Asistente: ${CHATBOT_REFUSAL_MESSAGE}`,
        ],
      };
    })
    .addEdge(START, 'classify')
    .addConditionalEdges('classify', (state: ChatbotStateType) =>
      state.dentroDeDominio ? 'generate' : 'refuse',
    )
    .addEdge('generate', END)
    .addEdge('refuse', END);

  return workflow.compile({ checkpointer: new MemorySaver() });
}

export type ChatbotCompiledGraph = ReturnType<typeof createChatbotGraph>;
