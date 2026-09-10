import type {
  LlamadoSalaEsperaDto,
  SalaEsperaSnapshot,
} from '@turnos/shared-types';

import { ApiError, type ApiErrorBody } from '@/lib/api/auth-client';

/**
 * Snapshot de los últimos avisos de sala de espera.
 *
 * @returns Hasta 5 llamados, el más reciente primero.
 */
export async function fetchSalaEspera(): Promise<SalaEsperaSnapshot> {
  const response = await fetch('/api/sala-espera', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    if (
      data !== null &&
      typeof data === 'object' &&
      'message' in data &&
      'statusCode' in data
    ) {
      throw new ApiError(data as ApiErrorBody);
    }
    throw new Error(`HTTP ${response.status}`);
  }
  return (await response.json()) as SalaEsperaSnapshot;
}

/**
 * Abre el stream SSE de llamados.
 *
 * @param onItem - Callback por cada aviso nuevo.
 * @returns Función para cerrar el stream.
 */
export function subscribeSalaEspera(
  onItem: (item: LlamadoSalaEsperaDto) => void,
): () => void {
  const source = new EventSource('/api/sala-espera/stream', {
    withCredentials: true,
  });
  source.onmessage = (event: MessageEvent<string>) => {
    const item = parseLlamadoEvent(event.data);
    if (item) {
      onItem(item);
    }
  };
  return () => source.close();
}

/**
 * Interpreta un payload SSE de llamado.
 *
 * @param raw - `event.data` del EventSource.
 * @returns DTO o null si no es un llamado.
 */
function parseLlamadoEvent(raw: string): LlamadoSalaEsperaDto | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'consultorioNumero' in parsed &&
      'pacienteNombre' in parsed &&
      'pacienteApellido' in parsed &&
      'llamadoEn' in parsed
    ) {
      return parsed as LlamadoSalaEsperaDto;
    }
    return null;
  } catch {
    return null;
  }
}
