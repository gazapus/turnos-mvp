import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import type { CancelarTurnoRequest } from '@turnos/shared-types';

/** Longitud máxima del motivo de cancelación. */
export const MOTIVO_CANCELACION_MAX = 500;

/**
 * Body de PATCH /api/turnos/:id/cancelar.
 */
export class CancelarTurnoDto implements CancelarTurnoRequest {
  @ApiPropertyOptional({ maxLength: MOTIVO_CANCELACION_MAX })
  @IsOptional()
  @IsString()
  @MaxLength(MOTIVO_CANCELACION_MAX)
  motivo?: string;
}
