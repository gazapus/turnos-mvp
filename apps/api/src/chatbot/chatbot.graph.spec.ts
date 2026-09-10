import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  CHATBOT_GREETING_REPLY,
  CHATBOT_REFUSAL_MESSAGE,
} from './chatbot.constants';
import { createChatbotGraph, type ChatbotLlmAdapter } from './chatbot.graph';

describe('createChatbotGraph', () => {
  const corpus = 'Manual de prueba: cómo confirmar un turno.';

  it('no importa Prisma ni ToolNode', () => {
    const source = readFileSync(
      path.join(__dirname, 'chatbot.graph.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/prisma/i);
    expect(source).not.toMatch(/ToolNode/);
  });

  it('genera cuando classify está en dominio', async () => {
    const generate = jest.fn().mockResolvedValue('Confirmá el mismo día.');
    const llm: ChatbotLlmAdapter = {
      classify: jest.fn().mockResolvedValue(true),
      generate,
    };
    const graph = createChatbotGraph(llm, corpus);

    const result = await graph.invoke(
      { mensaje: 'cómo confirmo un turno' },
      { configurable: { thread_id: 'u1' } },
    );

    expect(result.dentroDeDominio).toBe(true);
    expect(result.respuesta).toBe('Confirmá el mismo día.');
    expect(generate).toHaveBeenCalled();
  });

  it('rechaza sin llamar generate fuera de dominio', async () => {
    const generate = jest.fn();
    const llm: ChatbotLlmAdapter = {
      classify: jest.fn().mockResolvedValue(false),
      generate,
    };
    const graph = createChatbotGraph(llm, corpus);

    const result = await graph.invoke(
      { mensaje: '¿qué hora es en Tokio?' },
      { configurable: { thread_id: 'u1' } },
    );

    expect(result.dentroDeDominio).toBe(false);
    expect(result.respuesta).toBe(CHATBOT_REFUSAL_MESSAGE);
    expect(generate).not.toHaveBeenCalled();
  });

  it('responde un saludo sin llamar al LLM', async () => {
    const classify = jest.fn();
    const generate = jest.fn();
    const llm: ChatbotLlmAdapter = { classify, generate };
    const graph = createChatbotGraph(llm, corpus);

    const result = await graph.invoke(
      { mensaje: '¡Hola!' },
      { configurable: { thread_id: 'u1' } },
    );

    expect(result.dentroDeDominio).toBe(true);
    expect(result.respuesta).toBe(CHATBOT_GREETING_REPLY);
    expect(classify).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });
});
