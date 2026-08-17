import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DIRECCION_PAGINACION,
  ESTADO_TURNO,
  TIPO_TURNO,
  type DireccionPaginacion,
  type EstadoTurno,
  type EspecialidadNombreDto,
  type PersonaNombreDto,
  type TipoTurno,
  type TurnoListItemDto,
  type TurnosListResponse,
} from '@turnos/shared-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import type { Turno } from '@turnos/database';
import {
  formatClinicDate,
  formatClinicTime,
} from '../appointments.constants';

type TurnoWithRelations = Turno & {
  paciente: { nombre: string; apellido: string };
  medico: { nombre: string; apellido: string };
  especialidad: { nombre: string };
};

/**
 * Query params para GET /api/turnos.
 */
export class ListTurnosQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por médico' })
  @IsOptional()
  @IsUUID()
  medicoId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Filtrar por especialidad',
  })
  @IsOptional()
  @IsUUID()
  especialidadId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por paciente' })
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @ApiPropertyOptional({
    description: 'Incluir turnos cancelados en la respuesta',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluirCancelados?: boolean;

  @ApiPropertyOptional({ description: 'Cursor opaco de paginación' })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    enum: DIRECCION_PAGINACION,
    description: 'Dirección de la página solicitada',
  })
  @IsOptional()
  @IsEnum(DIRECCION_PAGINACION)
  direccion?: DireccionPaginacion;
}

/**
 * Persona mínima embebida en el listado de turnos.
 */
export class PersonaNombreResponseDto implements PersonaNombreDto {
  @ApiProperty({ example: 'María' })
  nombre!: string;

  @ApiProperty({ example: 'González' })
  apellido!: string;
}

/**
 * Especialidad mínima embebida en el listado de turnos.
 */
export class EspecialidadNombreResponseDto implements EspecialidadNombreDto {
  @ApiProperty({ example: 'Cardiología' })
  nombre!: string;
}

/**
 * Ítem de turno para la grilla de agenda.
 */
export class TurnoListItemResponseDto implements TurnoListItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '2026-08-16', description: 'Fecha local YYYY-MM-DD' })
  fecha!: string;

  @ApiProperty({ example: '09:30', description: 'Hora local HH:mm' })
  hora!: string;

  @ApiProperty({ type: PersonaNombreResponseDto })
  paciente!: PersonaNombreResponseDto;

  @ApiProperty({ type: PersonaNombreResponseDto })
  medico!: PersonaNombreResponseDto;

  @ApiProperty({ type: EspecialidadNombreResponseDto })
  especialidad!: EspecialidadNombreResponseDto;

  @ApiProperty({ enum: ESTADO_TURNO })
  estado!: EstadoTurno;

  @ApiProperty({ enum: TIPO_TURNO })
  tipo!: TipoTurno;

  /**
   * Mapea un turno Prisma con relaciones a TurnoListItemResponseDto.
   *
   * @param turno - Entidad Prisma con paciente, médico y especialidad.
   * @returns DTO de listado sin campos internos.
   */
  static fromEntity(turno: TurnoWithRelations): TurnoListItemResponseDto {
    const dto = new TurnoListItemResponseDto();
    dto.id = turno.id;
    dto.fecha = formatClinicDate(turno.fechaInicio);
    dto.hora = formatClinicTime(turno.fechaInicio);
    dto.paciente = {
      nombre: turno.paciente.nombre,
      apellido: turno.paciente.apellido,
    };
    dto.medico = {
      nombre: turno.medico.nombre,
      apellido: turno.medico.apellido,
    };
    dto.especialidad = { nombre: turno.especialidad.nombre };
    dto.estado = turno.estado;
    dto.tipo = turno.tipo;
    return dto;
  }
}

/**
 * Respuesta paginada del listado de turnos.
 */
export class TurnosListResponseDto implements TurnosListResponse {
  @ApiProperty({ type: [TurnoListItemResponseDto] })
  items!: TurnoListItemResponseDto[];

  @ApiProperty({
    nullable: true,
    description: 'Cursor para la página siguiente',
  })
  cursorSiguiente!: string | null;

  @ApiProperty({
    nullable: true,
    description: 'Cursor para la página anterior',
  })
  cursorAnterior!: string | null;
}
