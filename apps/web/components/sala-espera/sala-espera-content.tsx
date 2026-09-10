'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LlamadoSalaEsperaDto } from '@turnos/shared-types';

import { useFeedback } from '@/components/ui';
import { ApiError } from '@/lib/api/auth-client';
import {
  fetchSalaEspera,
  subscribeSalaEspera,
} from '@/lib/api/sala-espera-client';
import {
  formatMonitorDate,
  formatMonitorTime,
  playWaitingRoomChime,
  prependLlamado,
} from '@/lib/sala-espera';
import { SalaEsperaBoard } from './sala-espera-board';

const FRIENDLY_SALA_ERROR = 'No se pudo cargar la sala de espera';

/**
 * Tablero vivo: snapshot, SSE, sonido y pantalla completa.
 *
 * @returns Monitor de avisos.
 */
export function SalaEsperaContent() {
  const { showError } = useFeedback();
  const panelRef = useRef<HTMLDivElement>(null);
  const audioUnlocked = useRef(false);
  const [items, setItems] = useState<LlamadoSalaEsperaDto[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchSalaEspera()
      .then((snapshot) => {
        if (!cancelled) {
          setItems(snapshot.items);
        }
      })
      .catch((error: unknown) => {
        const detail =
          error instanceof ApiError
            ? error.message
            : 'No se pudo completar la operación. Intentá de nuevo.';
        showError(FRIENDLY_SALA_ERROR, detail);
      });
    return () => {
      cancelled = true;
    };
  }, [showError]);

  useEffect(() => {
    const unsubscribe = subscribeSalaEspera((item) => {
      setItems((current) => prependLlamado(current, item));
      if (audioUnlocked.current) {
        playWaitingRoomChime();
      }
    });
    return unsubscribe;
  }, []);

  const handleFullscreen = useCallback(() => {
    audioUnlocked.current = true;
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    void panel.requestFullscreen();
  }, []);

  return (
    <SalaEsperaBoard
      items={items}
      dateLabel={formatMonitorDate(now)}
      timeLabel={formatMonitorTime(now)}
      panelRef={panelRef}
      onFullscreen={handleFullscreen}
    />
  );
}
