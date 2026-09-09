import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ConsultorioDto,
  ConsultorioMedicoDto,
} from '@turnos/shared-types';

/**
 * Médico serializado en un consultorio.
 */
export class ConsultorioMedicoResponseDto implements ConsultorioMedicoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Carlos' })
  nombre!: string;

  @ApiProperty({ example: 'Médico' })
  apellido!: string;
}

type ConsultorioConMedico = {
  id: string;
  numero: number;
  medico: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
};

/**
 * DTO de consultorio del catálogo numerado.
 */
export class ConsultorioResponseDto implements ConsultorioDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 7 })
  numero!: number;

  @ApiPropertyOptional({ type: ConsultorioMedicoResponseDto, nullable: true })
  medico!: ConsultorioMedicoResponseDto | null;

  /**
   * Mapea un consultorio Prisma con médico opcional.
   *
   * @param consultorio - Entidad con relación `medico`.
   * @returns DTO público.
   */
  static fromEntity(consultorio: ConsultorioConMedico): ConsultorioResponseDto {
    const dto = new ConsultorioResponseDto();
    dto.id = consultorio.id;
    dto.numero = consultorio.numero;
    dto.medico = consultorio.medico
      ? {
          id: consultorio.medico.id,
          nombre: consultorio.medico.nombre,
          apellido: consultorio.medico.apellido,
        }
      : null;
    return dto;
  }
}
