import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoTurno } from '@turnos/database';
import { TIPO_TURNO, type UpsertTurnoRequest } from '@turnos/shared-types';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Datos de paciente nuevo embebidos en el alta o edición de turno.
 */
export class PacienteAltaInputDto {
  @ApiProperty({ example: '20000001' })
  @IsString()
  @MinLength(1)
  documento!: string;

  @ApiProperty({ example: 'María' })
  @IsString()
  @MinLength(3)
  @MaxLength(45)
  nombre!: string;

  @ApiProperty({ example: 'González' })
  @IsString()
  @MinLength(3)
  @MaxLength(45)
  apellido!: string;

  @ApiPropertyOptional({ example: '1123456789', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  telefono?: string | null;

  @ApiPropertyOptional({ example: 'maria@mail.com', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mail?: string | null;
}

/**
 * Body de POST /api/turnos y PATCH /api/turnos/:id.
 */
export class UpsertTurnoDto implements UpsertTurnoRequest {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pacienteId?: string;

  @ApiPropertyOptional({ type: PacienteAltaInputDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PacienteAltaInputDto)
  paciente?: PacienteAltaInputDto;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  medicoId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  especialidadId!: string;

  @ApiProperty({ example: '2026-08-16' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fecha debe tener formato YYYY-MM-DD',
  })
  fecha!: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'horaInicio debe tener formato HH:mm',
  })
  horaInicio!: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'horaFin debe tener formato HH:mm',
  })
  horaFin!: string;

  @ApiProperty({ enum: TIPO_TURNO })
  @IsEnum(TipoTurno)
  tipo!: TipoTurno;

  @ApiProperty()
  @IsBoolean()
  notificarMail!: boolean;
}
