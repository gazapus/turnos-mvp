import { proxySalaEsperaStream } from '@/lib/api/sala-espera-stream-proxy';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/sala-espera/stream — proxy SSE same-origin hacia Nest.
 *
 * @param request - Request del browser.
 * @returns Stream de llamados.
 */
export function GET(request: Request): Promise<Response> {
  return proxySalaEsperaStream(request);
}
