import { Injectable } from '@nestjs/common';
import { prisma } from '@turnos/database';
import { EspecialidadResponseDto } from './dto';

/**
 * Servicio de consulta de especialidades.
 */
@Injectable()
export class EspecialidadesService {
  /**
   * Lista todas las especialidades del catálogo.
   *
   * @returns Especialidades mapeadas a DTO mínimo.
   */
  async findAll(): Promise<EspecialidadResponseDto[]> {
    const especialidades = await prisma.especialidad.findMany({
      orderBy: { nombre: 'asc' },
    });

    return especialidades.map((esp) => EspecialidadResponseDto.fromEntity(esp));
  }
}
