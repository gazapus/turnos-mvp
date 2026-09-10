'use client';

import { useState } from 'react';

import { HelpBotButton } from './help-bot-button';
import { HelpChatPanel } from './help-chat-panel';

/**
 * Chat de ayuda del shell: FAB + panel.
 *
 * @returns Botón AYUDA BOT y panel condicional.
 */
export function HelpChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <HelpChatPanel open={open} />
      <HelpBotButton open={open} onToggle={() => setOpen((prev) => !prev)} />
    </>
  );
}
