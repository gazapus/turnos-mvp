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

  @ApiPropertyOptional({
    description:
      'Documento exacto (se normaliza a dígitos). Si está presente, se ignora `q` y se devuelve 0 o 1 paciente con contacto',
    example: '20000001',
  })
  @IsOptional()
  @IsString()
  documento?: string;
}
