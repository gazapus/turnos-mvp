import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => <span>{props.alt}</span>,
}));

vi.mock('@/components/auth/login-form', () => ({
  LoginForm: () => <form aria-label="login" />,
}));

import LoginPage from './page';

describe('LoginPage', () => {
  it('no muestra AYUDA BOT ni el panel de chat', () => {
    render(<LoginPage />);

    expect(
      screen.queryByRole('button', { name: /ayuda bot/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/chat de ayuda/i)).not.toBeInTheDocument();
  });
});
