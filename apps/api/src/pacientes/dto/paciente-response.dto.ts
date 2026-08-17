import { ApiProperty } from '@nestjs/swagger';
import type { PacienteOption } from '@turnos/shared-types';
import type { Paciente } from '@turnos/database';

/**
 * DTO mínimo de paciente para combos de filtro.
 */
export class PacienteResponseDto implements PacienteOption {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'María' })
  nombre!: string;

  @ApiProperty({ example: 'González' })
  apellido!: string;

  /**
   * Mapea una entidad Paciente de Prisma a PacienteResponseDto.
   *
   * @param paciente - Entidad Prisma.
   * @returns DTO público mínimo.
   */
  static fromEntity(paciente: Paciente): PacienteResponseDto {
    const dto = new PacienteResponseDto();
    dto.id = paciente.id;
    dto.nombre = paciente.nombre;
    dto.apellido = paciente.apellido;
    return dto;
  }
}
