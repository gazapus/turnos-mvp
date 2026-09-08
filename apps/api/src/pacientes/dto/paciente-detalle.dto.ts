import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PacienteDetalleDto } from '@turnos/shared-types';
import type { Paciente } from '@turnos/database';

/**
 * DTO de paciente con documento y contacto para el formulario de turno.
 */
export class PacienteDetalleResponseDto implements PacienteDetalleDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '20000001' })
  documento!: string;

  @ApiProperty({ example: 'María' })
  nombre!: string;

  @ApiProperty({ example: 'González' })
  apellido!: string;

  @ApiPropertyOptional({ example: '1123456789', nullable: true })
  telefono!: string | null;

  @ApiPropertyOptional({ example: 'maria@mail.com', nullable: true })
  mail!: string | null;

  /**
   * Mapea una entidad Paciente de Prisma al DTO de detalle.
   *
   * @param paciente - Entidad Prisma.
   * @returns DTO con documento y contacto.
   */
  static fromEntity(paciente: Paciente): PacienteDetalleResponseDto {
    const dto = new PacienteDetalleResponseDto();
    dto.id = paciente.id;
    dto.documento = paciente.documento;
    dto.nombre = paciente.nombre;
    dto.apellido = paciente.apellido;
    dto.telefono = paciente.telefono;
    dto.mail = paciente.mail;
    return dto;
  }
}
