const SALA_ESPERA_STREAM_PATH = '/api/sala-espera/stream';

const SSE_RESPONSE_HEADERS = {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;

/**
 * Origen del API Nest (mismo default que el rewrite).
 *
 * @returns URL absoluta del backend.
 */
function apiOrigin(): string {
  return process.env.API_URL ?? 'http://localhost:3001';
}

/**
 * Proxy del SSE de sala de espera hacia Nest, sin pasar por el rewrite
 * de Next (ese proxy espera el cierre de la respuesta y no entrega eventos).
 *
 * @param request - Request del browser (cookies de sesión).
 * @returns Stream `text/event-stream`.
 */
export async function proxySalaEsperaStream(
  request: Request,
): Promise<Response> {
  const upstream = await fetch(`${apiOrigin()}${SALA_ESPERA_STREAM_PATH}`, {
    method: 'GET',
    headers: {
      accept: 'text/event-stream',
      cookie: request.headers.get('cookie') ?? '',
    },
    cache: 'no-store',
    signal: request.signal,
  });

  if (!upstream.body) {
    return new Response(null, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: SSE_RESPONSE_HEADERS,
  });
}
