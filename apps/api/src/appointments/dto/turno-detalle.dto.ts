import { ApiProperty } from '@nestjs/swagger';
import {
  ESTADO_TURNO,
  TIPO_TURNO,
  type EstadoTurno,
  type TipoTurno,
  type TurnoDetalleDto,
} from '@turnos/shared-types';
import type { Paciente, Turno } from '@turnos/database';
import { PacienteDetalleResponseDto } from '@/pacientes';
import { formatClinicDate, formatClinicTime } from '../appointments.constants';
import {
  EspecialidadNombreResponseDto,
  PersonaNombreResponseDto,
} from './turno-list.dto';

type TurnoDetalleEntity = Turno & {
  paciente: Paciente;
  medico: { nombre: string; apellido: string };
  especialidad: { nombre: string };
};

/**
 * DTO de detalle de turno para el popup.
 */
export class TurnoDetalleResponseDto implements TurnoDetalleDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: PacienteDetalleResponseDto })
  paciente!: PacienteDetalleResponseDto;

  @ApiProperty({ format: 'uuid' })
  medicoId!: string;

  @ApiProperty({ type: PersonaNombreResponseDto })
  medico!: PersonaNombreResponseDto;

  @ApiProperty({ format: 'uuid' })
  especialidadId!: string;

  @ApiProperty({ type: EspecialidadNombreResponseDto })
  especialidad!: EspecialidadNombreResponseDto;

  @ApiProperty({ example: '2026-08-16' })
  fecha!: string;

  @ApiProperty({ example: '10:00' })
  horaInicio!: string;

  @ApiProperty({ example: '10:30' })
  horaFin!: string;

  @ApiProperty({ enum: TIPO_TURNO })
  tipo!: TipoTurno;

  @ApiProperty({ enum: ESTADO_TURNO })
  estado!: EstadoTurno;

  @ApiProperty()
  notificarMail!: boolean;

  @ApiProperty({ nullable: true, type: String })
  motivoCancelacion!: string | null;

  /**
   * Mapea un turno Prisma con relaciones al DTO de detalle.
   *
   * @param turno - Entidad con paciente, médico y especialidad.
   * @returns DTO de detalle.
   */
  static fromEntity(turno: TurnoDetalleEntity): TurnoDetalleResponseDto {
    const dto = new TurnoDetalleResponseDto();
    dto.id = turno.id;
    dto.paciente = PacienteDetalleResponseDto.fromEntity(turno.paciente);
    dto.medicoId = turno.medicoId;
    dto.medico = {
      nombre: turno.medico.nombre,
      apellido: turno.medico.apellido,
    };
    dto.especialidadId = turno.especialidadId;
    dto.especialidad = { nombre: turno.especialidad.nombre };
    dto.fecha = formatClinicDate(turno.fechaInicio);
    dto.horaInicio = formatClinicTime(turno.fechaInicio);
    dto.horaFin = formatClinicTime(turno.fechaFin);
    dto.tipo = turno.tipo;
    dto.estado = turno.estado;
    dto.notificarMail = turno.notificarMail;
    dto.motivoCancelacion = turno.motivoCancelacion;
    return dto;
  }
}
