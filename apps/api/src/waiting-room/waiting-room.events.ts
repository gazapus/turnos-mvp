import { Injectable } from '@nestjs/common';
import { Observable, Subject, map, merge, timer } from 'rxjs';
import type { LlamadoSalaEsperaDto } from '@turnos/shared-types';

const SSE_PING_MS = 15_000;

/**
 * Evento SSE que Nest serializa como `data:`.
 */
export type WaitingRoomSseEvent = {
  data: LlamadoSalaEsperaDto | string;
  type?: string;
};

/**
 * Bus in-memory de llamados para el stream de sala de espera.
 */
@Injectable()
export class WaitingRoomEvents {
  private readonly subject = new Subject<LlamadoSalaEsperaDto>();

  /**
   * Publica un llamado a los clientes SSE conectados.
   *
   * @param item - Snapshot del llamado.
   */
  emit(item: LlamadoSalaEsperaDto): void {
    this.subject.next(item);
  }

  /**
   * Observable de eventos SSE (llamados + ping de keep-alive).
   *
   * @returns Stream de llamados.
   */
  stream(): Observable<WaitingRoomSseEvent> {
    const pings$ = timer(0, SSE_PING_MS).pipe(
      map(() => ({ type: 'ping', data: 'ping' })),
    );
    const llamados$ = this.subject
      .asObservable()
      .pipe(map((data) => ({ data })));
    return merge(pings$, llamados$);
  }
}
