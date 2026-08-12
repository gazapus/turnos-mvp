import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthStatusPanel } from './health-status-panel';

describe('HealthStatusPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('muestra estado de carga inicial', () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined));

    render(<HealthStatusPanel />);

    expect(screen.getByText(/consultando backend/i)).toBeInTheDocument();
  });

  it('muestra datos del health check cuando la API responde', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        service: 'turnos-api',
        database: 'connected',
        timestamp: '2026-08-11T22:00:00.000Z',
      }),
    } as Response);

    render(<HealthStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('turnos-api')).toBeInTheDocument();
    });
    expect(screen.getByText('ok')).toBeInTheDocument();
    expect(screen.getByText('Conectada')).toBeInTheDocument();
  });
});
