import { ApiProperty } from '@nestjs/swagger';
import type { EspecialidadOption } from '@turnos/shared-types';
import type { Especialidad } from '@turnos/database';

/**
 * DTO mínimo de especialidad para combos de filtro.
 */
export class EspecialidadResponseDto implements EspecialidadOption {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cardiología' })
  nombre!: string;

  /**
   * Mapea una entidad Especialidad de Prisma a EspecialidadResponseDto.
   *
   * @param especialidad - Entidad Prisma.
   * @returns DTO público mínimo.
   */
  static fromEntity(especialidad: Especialidad): EspecialidadResponseDto {
    const dto = new EspecialidadResponseDto();
    dto.id = especialidad.id;
    dto.nombre = especialidad.nombre;
    return dto;
  }
}
