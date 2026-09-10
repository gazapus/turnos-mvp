import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderChatMarkdown } from './render-chat-markdown';

describe('renderChatMarkdown', () => {
  it('renderiza negritas sin mostrar asteriscos', () => {
    render(
      <p>{renderChatMarkdown('Solo para **Recepcionista** y **Administrador**.')}</p>,
    );

    expect(screen.getByText('Recepcionista').tagName).toBe('STRONG');
    expect(screen.getByText('Administrador').tagName).toBe('STRONG');
    expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument();
  });
});
