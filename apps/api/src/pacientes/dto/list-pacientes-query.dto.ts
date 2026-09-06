import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Query params para buscar pacientes del combo de filtro.
 */
export class ListPacientesQueryDto {
  @ApiPropertyOptional({
    description:
      'Substring de nombre o apellido. Menos de 3 caracteres (o ausente) devuelve lista vacía',
    example: 'gon',
  })
  @IsOptional()
  @IsString()
  q?: string;
}
