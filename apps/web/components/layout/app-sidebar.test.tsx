import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AppSidebar } from './app-sidebar';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt} />
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/agenda',
}));

describe('AppSidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('en colapso oculta etiquetas visibles y deja sr-only', () => {
    render(
      <AppSidebar
        rol="MEDICO"
        collapsed
        mobileOpen={false}
        onToggleCollapsed={() => undefined}
        onCloseMobile={() => undefined}
      />,
    );

    expect(screen.getByText('AGENDA')).toHaveClass('sr-only');
    expect(screen.queryByText('USUARIOS')).not.toBeInTheDocument();
  });

  it('expandido muestra etiquetas del rol admin', () => {
    render(
      <AppSidebar
        rol="ADMIN"
        collapsed={false}
        mobileOpen={false}
        onToggleCollapsed={() => undefined}
        onCloseMobile={() => undefined}
      />,
    );

    const label = screen.getByText('AGENDA');
    expect(label).not.toHaveClass('sr-only');
    expect(screen.getByText('USUARIOS')).toBeInTheDocument();
  });
});
