import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, Prisma, RolUsuario } from '@turnos/database';
import type { JwtPayload } from '../auth';
import {
  CONSULTORIO_CONFLICTO_ASIGNACION,
  CONSULTORIO_NO_ENCONTRADO,
  CONSULTORIOS_NO_AUTORIZADO,
  MEDICO_ASIGNACION_INVALIDO,
} from './consultorios.constants';
import { AsignarConsultorioDto, ConsultorioResponseDto } from './dto';

const CONSULTORIO_INCLUDE = {
  medico: { select: { id: true, nombre: true, apellido: true } },
} as const;

/**
 * Servicio de catálogo y asignación 1:1 de consultorios.
 */
@Injectable()
export class ConsultoriosService {
  /**
   * Lista todos los consultorios ordenados por número.
   *
   * @param user - JWT autenticado.
   * @returns Catálogo completo.
   */
  async list(user: JwtPayload): Promise<ConsultorioResponseDto[]> {
    this.assertCanAccess(user);
    return this.snapshot();
  }

  /**
   * Asigna o desasigna un médico a un consultorio, liberando el anterior.
   *
   * @param id - UUID del consultorio.
   * @param dto - Médico destino o null.
   * @param user - JWT autenticado.
   * @returns Snapshot completo del catálogo.
   */
  async assign(
    id: string,
    dto: AsignarConsultorioDto,
    user: JwtPayload,
  ): Promise<ConsultorioResponseDto[]> {
    this.assertCanAccess(user);

    const consultorio = await prisma.consultorio.findUnique({ where: { id } });
    if (!consultorio) {
      throw new NotFoundException(CONSULTORIO_NO_ENCONTRADO);
    }

    if (dto.medicoId === consultorio.medicoId) {
      return this.snapshot();
    }

    if (dto.medicoId) {
      await this.assertMedicoAsignable(dto.medicoId);
    }

    try {
      await prisma.$transaction(async (tx) => {
        if (dto.medicoId) {
          await tx.consultorio.updateMany({
            where: { medicoId: dto.medicoId, id: { not: id } },
            data: { medicoId: null },
          });
          await tx.consultorio.update({
            where: { id },
            data: { medicoId: dto.medicoId },
          });
          return;
        }

        await tx.consultorio.update({
          where: { id },
          data: { medicoId: null },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(CONSULTORIO_CONFLICTO_ASIGNACION);
      }
      throw error;
    }

    return this.snapshot();
  }

  /**
   * Snapshot ordenado del catálogo.
   *
   * @returns DTOs de consultorio.
   */
  private async snapshot(): Promise<ConsultorioResponseDto[]> {
    const consultorios = await prisma.consultorio.findMany({
      include: CONSULTORIO_INCLUDE,
      orderBy: { numero: 'asc' },
    });
    return consultorios.map((item) => ConsultorioResponseDto.fromEntity(item));
  }

  /**
   * Valida que el usuario sea un médico activo.
   *
   * @param medicoId - UUID del usuario.
   */
  private async assertMedicoAsignable(medicoId: string): Promise<void> {
    const medico = await prisma.usuario.findUnique({ where: { id: medicoId } });
    if (!medico || medico.rol !== RolUsuario.MEDICO || medico.activo !== true) {
      throw new BadRequestException(MEDICO_ASIGNACION_INVALIDO);
    }
  }

  /**
   * Restringe el módulo a admin y recepción.
   *
   * @param user - JWT.
   */
  private assertCanAccess(user: JwtPayload): void {
    if (user.rol === RolUsuario.MEDICO) {
      throw new ForbiddenException(CONSULTORIOS_NO_AUTORIZADO);
    }
  }
}
