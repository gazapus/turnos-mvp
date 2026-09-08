import { Injectable } from '@nestjs/common';
import { prisma, RolUsuario } from '@turnos/database';
import { MedicoResponseDto } from './dto';

/**
 * Servicio de consulta de médicos para filtros de agenda.
 */
@Injectable()
export class UsersService {
  /**
   * Lista médicos activos del sistema (rol MEDICO).
   *
   * @returns Médicos mapeados a DTO mínimo.
   */
  async findAll(): Promise<MedicoResponseDto[]> {
    const usuarios = await prisma.usuario.findMany({
      where: {
        activo: true,
        rol: RolUsuario.MEDICO,
      },
      include: {
        especialidades: { select: { especialidadId: true } },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return usuarios.map((usuario) => MedicoResponseDto.fromEntity(usuario));
  }
}
