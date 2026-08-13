'use client';

import { Bot } from 'lucide-react';

/**
 * Botón flotante de acceso al chatbot (stub: solo console.log).
 *
 * @returns FAB inferior derecho AYUDA BOT.
 */
export function HelpBotButton() {
  return (
    <button
      type="button"
      className="fixed bottom-0 right-6 z-50 flex cursor-pointer items-center gap-2 rounded-t-lg border border-primary bg-primary px-5 py-3 font-sans text-xs font-bold tracking-widest text-primary-foreground shadow-help-bot backdrop-blur-md transition-all hover:-translate-y-1 max-md:right-3"
      onClick={() => {
        console.log('[shell] ayuda-bot clicked');
      }}
    >
      <Bot className="size-5" aria-hidden />
      AYUDA BOT
    </button>
  );
}
