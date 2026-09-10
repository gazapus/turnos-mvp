import { ApiProperty } from '@nestjs/swagger';
import type {
  LlamadoSalaEsperaDto,
  SalaEsperaSnapshot,
} from '@turnos/shared-types';

type LlamadoEntity = {
  id: string;
  consultorioNumero: number;
  pacienteNombre: string;
  pacienteApellido: string;
  llamadoEn: Date;
};

/**
 * Ítem de aviso de sala de espera.
 */
export class LlamadoSalaEsperaResponseDto implements LlamadoSalaEsperaDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 7 })
  consultorioNumero!: number;

  @ApiProperty({ example: 'María' })
  pacienteNombre!: string;

  @ApiProperty({ example: 'González' })
  pacienteApellido!: string;

  @ApiProperty({ example: '2026-09-09T13:00:00.000Z' })
  llamadoEn!: string;

  /**
   * Mapea un `LlamadoTurno` persistido al DTO público.
   *
   * @param llamado - Fila de snapshot.
   * @returns DTO de sala de espera.
   */
  static fromEntity(llamado: LlamadoEntity): LlamadoSalaEsperaResponseDto {
    const dto = new LlamadoSalaEsperaResponseDto();
    dto.id = llamado.id;
    dto.consultorioNumero = llamado.consultorioNumero;
    dto.pacienteNombre = llamado.pacienteNombre;
    dto.pacienteApellido = llamado.pacienteApellido;
    dto.llamadoEn = llamado.llamadoEn.toISOString();
    return dto;
  }
}

/**
 * Snapshot de los últimos llamados.
 */
export class SalaEsperaSnapshotResponseDto implements SalaEsperaSnapshot {
  @ApiProperty({ type: [LlamadoSalaEsperaResponseDto] })
  items!: LlamadoSalaEsperaResponseDto[];
}
