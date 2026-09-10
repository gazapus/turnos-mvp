import { isChatbotGreeting } from './chatbot-greeting';

describe('isChatbotGreeting', () => {
  it('acepta saludos cortos', () => {
    expect(isChatbotGreeting('hola')).toBe(true);
    expect(isChatbotGreeting('¡Hola!')).toBe(true);
    expect(isChatbotGreeting('Buenos días')).toBe(true);
    expect(isChatbotGreeting('hola, cómo estás')).toBe(true);
    expect(isChatbotGreeting('hola buenas')).toBe(true);
    expect(isChatbotGreeting('Buenas tardes')).toBe(true);
  });

  it('rechaza preguntas o pedidos', () => {
    expect(isChatbotGreeting('hola, qué turnos tengo hoy')).toBe(false);
    expect(isChatbotGreeting('cómo creo un turno')).toBe(false);
    expect(isChatbotGreeting('qué hora es en Tokio')).toBe(false);
  });
});
