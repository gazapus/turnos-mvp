import { ApiPropertyOptional } from '@nestjs/swagger';
import { RolUsuario } from '@turnos/database';
import { IsEnum, IsOptional } from 'class-validator';

/** Rol permitido en el query de listado de médicos para filtros de agenda. */
const MEDICO_FILTER_ROL = [RolUsuario.MEDICO] as const;

/**
 * Query params para listar médicos (combo de filtro de agenda).
 */
export class ListUsuariosQueryDto {
  @ApiPropertyOptional({
    enum: MEDICO_FILTER_ROL,
    description: 'Rol del listado (solo MEDICO; omitible por compatibilidad)',
  })
  @IsOptional()
  @IsEnum(MEDICO_FILTER_ROL)
  rol?: (typeof MEDICO_FILTER_ROL)[number];
}
