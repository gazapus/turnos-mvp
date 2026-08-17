import { Injectable } from '@nestjs/common';
import { prisma } from '@turnos/database';
import { PacienteResponseDto } from './dto';

/**
 * Servicio de consulta de pacientes.
 */
@Injectable()
export class PacientesService {
  /**
   * Lista todos los pacientes registrados.
   *
   * @returns Pacientes mapeados a DTO mínimo.
   */
  async findAll(): Promise<PacienteResponseDto[]> {
    const pacientes = await prisma.paciente.findMany({
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return pacientes.map((paciente) =>
      PacienteResponseDto.fromEntity(paciente),
    );
  }
}
