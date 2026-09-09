import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsUUID, ValidateIf } from 'class-validator';
import type { AsignarConsultorioRequest } from '@turnos/shared-types';

/**
 * Body de PATCH /api/consultorios/:id.
 */
export class AsignarConsultorioDto implements AsignarConsultorioRequest {
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'ID del médico a asignar, o null para desasignar',
  })
  @IsDefined()
  @ValidateIf((_, value: unknown) => value !== null)
  @IsUUID()
  medicoId!: string | null;
}
