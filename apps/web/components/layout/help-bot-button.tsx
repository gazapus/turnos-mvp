'use client';

import { Bot } from 'lucide-react';

type HelpBotButtonProps = {
  open: boolean;
  onToggle: () => void;
};

/**
 * Botón flotante de acceso al chatbot de ayuda.
 *
 * @param props - Estado abierto y callback de toggle.
 * @returns FAB inferior derecho AYUDA BOT.
 */
export function HelpBotButton({ open, onToggle }: HelpBotButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="help-chat-panel"
      className="fixed bottom-0 right-6 z-50 flex origin-bottom cursor-pointer items-center gap-2 rounded-t-lg border border-primary bg-primary px-5 py-3 font-sans text-xs font-bold tracking-widest text-primary-foreground shadow-help-bot backdrop-blur-md transition hover:scale-[1.04] hover:bg-primary-hover max-md:right-3"
      onClick={onToggle}
    >
      <Bot className="size-5" aria-hidden />
      AYUDA BOT
    </button>
  );
}
