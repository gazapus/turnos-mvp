import { ApiProperty } from '@nestjs/swagger';
import type { MedicoOption } from '@turnos/shared-types';
import type { Usuario } from '@turnos/database';

type UsuarioConEspecialidades = Usuario & {
  especialidades: Array<{ especialidadId: string }>;
};

/**
 * DTO de médico para combos de filtro y del formulario de turno.
 */
export class MedicoResponseDto implements MedicoOption {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Carlos' })
  nombre!: string;

  @ApiProperty({ example: 'Médico' })
  apellido!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  especialidadIds!: string[];

  /**
   * Mapea un médico Prisma con especialidades a MedicoResponseDto.
   *
   * @param usuario - Entidad Prisma con relación `especialidades`.
   * @returns DTO público con ids cruzados.
   */
  static fromEntity(usuario: UsuarioConEspecialidades): MedicoResponseDto {
    const dto = new MedicoResponseDto();
    dto.id = usuario.id;
    dto.nombre = usuario.nombre;
    dto.apellido = usuario.apellido;
    dto.especialidadIds = usuario.especialidades.map(
      (item) => item.especialidadId,
    );
    return dto;
  }
}
