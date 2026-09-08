import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PrimeraVezQuery, PrimeraVezResponse } from '@turnos/shared-types';
import { IsOptional, IsUUID } from 'class-validator';

/**
 * Query de GET /api/turnos/primera-vez.
 */
export class PrimeraVezQueryDto implements PrimeraVezQuery {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  pacienteId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  medicoId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  excluirTurnoId?: string;
}

/**
 * Respuesta de GET /api/turnos/primera-vez.
 */
export class PrimeraVezResponseDto implements PrimeraVezResponse {
  @ApiProperty()
  primeraVez!: boolean;
}
