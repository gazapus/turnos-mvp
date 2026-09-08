import { ApiProperty } from '@nestjs/swagger';
import type { EspecialidadOption } from '@turnos/shared-types';
import type { Especialidad } from '@turnos/database';

type EspecialidadConMedicos = Especialidad & {
  medicos: Array<{ medicoId: string }>;
};

/**
 * DTO de especialidad para combos de filtro y del formulario de turno.
 */
export class EspecialidadResponseDto implements EspecialidadOption {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cardiología' })
  nombre!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  medicoIds!: string[];

  /**
   * Mapea una especialidad Prisma con médicos a EspecialidadResponseDto.
   *
   * @param especialidad - Entidad Prisma con relación `medicos`.
   * @returns DTO público con ids cruzados.
   */
  static fromEntity(
    especialidad: EspecialidadConMedicos,
  ): EspecialidadResponseDto {
    const dto = new EspecialidadResponseDto();
    dto.id = especialidad.id;
    dto.nombre = especialidad.nombre;
    dto.medicoIds = especialidad.medicos.map((item) => item.medicoId);
    return dto;
  }
}
