/**
 * Detecta un saludo breve (sin pedido de datos ni de acción).
 *
 * @param mensaje - Texto del usuario ya recortado.
 * @returns true si es solo un saludo.
 */
export function isChatbotGreeting(mensaje: string): boolean {
  const folded = mensaje
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[!¡?¿.]+/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!folded) {
    return false;
  }

  const patterns = [
    /^(hola|holis|hey|hi|hello)( que tal| como estas| como va| bot| chat| chatbot| ayuda)?$/,
    /^(hola )?(buenas|buenas tardes|buenas noches|buen dia|buenos dias)$/,
    /^(que tal|como estas|como va)$/,
  ];

  return patterns.some((pattern) => pattern.test(folded));
}
