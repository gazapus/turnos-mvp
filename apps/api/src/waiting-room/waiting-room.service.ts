import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma, RolUsuario } from '@turnos/database';
import type { JwtPayload } from '../auth';
import {
  SALA_ESPERA_LIMIT,
  SALA_ESPERA_NO_AUTORIZADO,
} from './waiting-room.constants';
import {
  LlamadoSalaEsperaResponseDto,
  SalaEsperaSnapshotResponseDto,
} from './dto';

/**
 * Snapshot de los últimos llamados para el tablero de sala de espera.
 */
@Injectable()
export class WaitingRoomService {
  /**
   * Últimos llamados, más reciente primero.
   *
   * @param user - JWT autenticado.
   * @returns Hasta 5 avisos.
   */
  async snapshot(user: JwtPayload): Promise<SalaEsperaSnapshotResponseDto> {
    this.assertCanAccess(user);
    const rows = await prisma.llamadoTurno.findMany({
      orderBy: { llamadoEn: 'desc' },
      take: SALA_ESPERA_LIMIT,
    });
    const dto = new SalaEsperaSnapshotResponseDto();
    dto.items = rows.map((row) =>
      LlamadoSalaEsperaResponseDto.fromEntity(row),
    );
    return dto;
  }

  /**
   * Solo recepción y administración operan el monitor.
   *
   * @param user - JWT.
   */
  assertCanAccess(user: JwtPayload): void {
    if (
      user.rol !== RolUsuario.ADMIN &&
      user.rol !== RolUsuario.RECEPCIONISTA
    ) {
      throw new ForbiddenException(SALA_ESPERA_NO_AUTORIZADO);
    }
  }
}
