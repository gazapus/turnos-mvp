import { afterEach, describe, expect, it, vi } from 'vitest';

import { proxySalaEsperaStream } from './sala-espera-stream-proxy';

describe('proxySalaEsperaStream', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reenvía la cookie y deja el body en streaming', async () => {
    const body = new ReadableStream();
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request('http://localhost:3000/api/sala-espera/stream', {
      headers: { cookie: 'turnos_session=abc' },
    });
    const response = await proxySalaEsperaStream(request);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/api/sala-espera/stream',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: {
          accept: 'text/event-stream',
          cookie: 'turnos_session=abc',
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toMatch(/text\/event-stream/);
    expect(response.headers.get('Cache-Control')).toMatch(/no-transform/);
    expect(response.body).toBe(body);
  });
});
