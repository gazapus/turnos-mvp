import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@turnos/database';
import { PacienteResponseDto } from './dto';
import {
  escapeLikePattern,
  foldDiacritics,
  SQL_ACCENTED_CHARS,
  SQL_PLAIN_CHARS,
} from './fold-diacritics';
import {
  PACIENTE_SEARCH_LIMIT,
  PACIENTE_SEARCH_MIN_LENGTH,
} from './pacientes.constants';

type PacienteSearchRow = {
  id: string;
  nombre: string;
  apellido: string;
};

/**
 * Servicio de consulta de pacientes para filtros de agenda.
 */
@Injectable()
export class PacientesService {
  /**
   * Busca pacientes por substring en nombre o apellido, sin distinguir
   * mayúsculas ni tildes. Si `q` recortado tiene menos de 3 caracteres,
   * no consulta el padrón.
   *
   * @param q - Texto de búsqueda opcional.
   * @returns Hasta 30 coincidencias mapeadas a DTO mínimo.
   */
  async search(q?: string): Promise<PacienteResponseDto[]> {
    const term = q?.trim() ?? '';
    if (term.length < PACIENTE_SEARCH_MIN_LENGTH) {
      return [];
    }

    const pattern = `%${escapeLikePattern(foldDiacritics(term))}%`;

    const pacientes = await prisma.$queryRaw<PacienteSearchRow[]>`
      SELECT id, nombre, apellido
      FROM pacientes
      WHERE translate(lower(nombre), ${SQL_ACCENTED_CHARS}, ${SQL_PLAIN_CHARS}) LIKE ${pattern} ESCAPE '\\'
         OR translate(lower(apellido), ${SQL_ACCENTED_CHARS}, ${SQL_PLAIN_CHARS}) LIKE ${pattern} ESCAPE '\\'
      ORDER BY apellido ASC, nombre ASC
      LIMIT ${PACIENTE_SEARCH_LIMIT}
    `;

    return pacientes.map((paciente) => {
      const dto = new PacienteResponseDto();
      dto.id = paciente.id;
      dto.nombre = paciente.nombre;
      dto.apellido = paciente.apellido;
      return dto;
    });
  }

  /**
   * Obtiene un paciente por id para hidratar el combobox de filtro.
   *
   * @param id - UUID del paciente.
   * @returns DTO público mínimo.
   */
  async findById(id: string): Promise<PacienteResponseDto> {
    const paciente = await prisma.paciente.findUnique({
      where: { id },
    });

    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }

    return PacienteResponseDto.fromEntity(paciente);
  }
}
