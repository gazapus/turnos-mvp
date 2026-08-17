import { ApiProperty } from '@nestjs/swagger';
import type { MedicoOption } from '@turnos/shared-types';
import type { Usuario } from '@turnos/database';

/**
 * DTO mínimo de médico para combos de filtro.
 */
export class MedicoResponseDto implements MedicoOption {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Carlos' })
  nombre!: string;

  @ApiProperty({ example: 'Médico' })
  apellido!: string;

  /**
   * Mapea una entidad Usuario de Prisma a MedicoResponseDto.
   *
   * @param usuario - Entidad Prisma.
   * @returns DTO público mínimo.
   */
  static fromEntity(usuario: Usuario): MedicoResponseDto {
    const dto = new MedicoResponseDto();
    dto.id = usuario.id;
    dto.nombre = usuario.nombre;
    dto.apellido = usuario.apellido;
    return dto;
  }
}
