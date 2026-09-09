import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { RolUsuario } from '@turnos/database';
import { JwtAuthGuard } from '../auth';
import { ConsultoriosController } from './consultorios.controller';
import { ConsultoriosService } from './consultorios.service';
import {
  CONSULTORIO_NO_ENCONTRADO,
  MEDICO_ASIGNACION_INVALIDO,
} from './consultorios.constants';

const mockConsultorioFindMany = jest.fn();
const mockConsultorioFindUnique = jest.fn();
const mockConsultorioUpdate = jest.fn();
const mockConsultorioUpdateMany = jest.fn();
const mockUsuarioFindUnique = jest.fn();

jest.mock('@turnos/database', () => {
  const prisma = {
    $transaction: jest.fn((cb: (tx: unknown) => unknown) =>
      Promise.resolve(cb(prisma)),
    ),
    consultorio: {
      get findMany() {
        return mockConsultorioFindMany;
      },
      get findUnique() {
        return mockConsultorioFindUnique;
      },
      get update() {
        return mockConsultorioUpdate;
      },
      get updateMany() {
        return mockConsultorioUpdateMany;
      },
    },
    usuario: {
      get findUnique() {
        return mockUsuarioFindUnique;
      },
    },
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- mock de Prisma
    prisma,
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        code = '';
      },
    },
    RolUsuario: {
      ADMIN: 'ADMIN',
      RECEPCIONISTA: 'RECEPCIONISTA',
      MEDICO: 'MEDICO',
    },
  };
});

const recepcionista = {
  sub: 'r1',
  mail: 'r@x.c',
  rol: RolUsuario.RECEPCIONISTA,
};

const medicoUser = {
  sub: 'm1',
  mail: 'm@x.c',
  rol: RolUsuario.MEDICO,
};

/**
 * Fila de catálogo para mocks.
 *
 * @param numero - Número de consultorio.
 * @param medico - Médico asignado o null.
 * @returns Entidad con include.
 */
function row(
  numero: number,
  medico: { id: string; nombre: string; apellido: string } | null = null,
) {
  return {
    id: `c${numero}`,
    numero,
    medicoId: medico?.id ?? null,
    medico,
  };
}

describe('ConsultoriosService', () => {
  let service: ConsultoriosService;

  beforeEach(async () => {
    mockConsultorioFindMany.mockReset();
    mockConsultorioFindUnique.mockReset();
    mockConsultorioUpdate.mockReset();
    mockConsultorioUpdateMany.mockReset();
    mockUsuarioFindUnique.mockReset();
    mockConsultorioFindMany.mockResolvedValue([row(1), row(2)]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsultoriosService],
    }).compile();
    service = module.get(ConsultoriosService);
  });

  it('lista ordenado por número e incluye médico inactivo', async () => {
    mockConsultorioFindMany.mockResolvedValue([
      row(1, { id: 'inactivo', nombre: 'Juan', apellido: 'Baja' }),
      row(2),
    ]);

    const result = await service.list(recepcionista);

    expect(mockConsultorioFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { numero: 'asc' } }),
    );
    expect(result[0]?.medico).toEqual({
      id: 'inactivo',
      nombre: 'Juan',
      apellido: 'Baja',
    });
    expect(result[1]?.medico).toBeNull();
  });

  it('médico recibe 403 al listar', async () => {
    await expect(service.list(medicoUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockConsultorioFindMany).not.toHaveBeenCalled();
  });

  it('asigna médico libre a consultorio vacío', async () => {
    mockConsultorioFindUnique.mockResolvedValue(row(1));
    mockUsuarioFindUnique.mockResolvedValue({
      id: 'm-perez',
      rol: RolUsuario.MEDICO,
      activo: true,
    });
    mockConsultorioFindMany.mockResolvedValue([
      row(1, { id: 'm-perez', nombre: 'Juan', apellido: 'Pérez' }),
    ]);

    const result = await service.assign(
      'c1',
      { medicoId: 'm-perez' },
      recepcionista,
    );

    expect(mockConsultorioUpdateMany).toHaveBeenCalledWith({
      where: { medicoId: 'm-perez', id: { not: 'c1' } },
      data: { medicoId: null },
    });
    expect(mockConsultorioUpdate).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { medicoId: 'm-perez' },
    });
    expect(result[0]?.medico?.id).toBe('m-perez');
  });

  it('al mover libera el consultorio previo', async () => {
    mockConsultorioFindUnique.mockResolvedValue(
      row(7, { id: 'otro', nombre: 'X', apellido: 'Y' }),
    );
    mockUsuarioFindUnique.mockResolvedValue({
      id: 'm-perez',
      rol: RolUsuario.MEDICO,
      activo: true,
    });

    await service.assign('c7', { medicoId: 'm-perez' }, recepcionista);

    expect(mockConsultorioUpdateMany).toHaveBeenCalledWith({
      where: { medicoId: 'm-perez', id: { not: 'c7' } },
      data: { medicoId: null },
    });
  });

  it('desasigna con medicoId null', async () => {
    mockConsultorioFindUnique.mockResolvedValue(
      row(7, { id: 'm-perez', nombre: 'Juan', apellido: 'Pérez' }),
    );
    mockConsultorioFindMany.mockResolvedValue([row(7)]);

    const result = await service.assign(
      'c7',
      { medicoId: null },
      recepcionista,
    );

    expect(mockUsuarioFindUnique).not.toHaveBeenCalled();
    expect(mockConsultorioUpdate).toHaveBeenCalledWith({
      where: { id: 'c7' },
      data: { medicoId: null },
    });
    expect(result[0]?.medico).toBeNull();
  });

  it('no-op si el médico ya está en ese consultorio', async () => {
    mockConsultorioFindUnique.mockResolvedValue(
      row(1, { id: 'm-perez', nombre: 'Juan', apellido: 'Pérez' }),
    );

    await service.assign('c1', { medicoId: 'm-perez' }, recepcionista);

    expect(mockConsultorioUpdate).not.toHaveBeenCalled();
    expect(mockUsuarioFindUnique).not.toHaveBeenCalled();
  });

  it('404 si el consultorio no existe', async () => {
    mockConsultorioFindUnique.mockResolvedValue(null);

    await expect(
      service.assign('missing', { medicoId: 'm-perez' }, recepcionista),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.assign('missing', { medicoId: 'm-perez' }, recepcionista),
    ).rejects.toThrow(CONSULTORIO_NO_ENCONTRADO);
  });

  it('400 si el médico está inactivo', async () => {
    mockConsultorioFindUnique.mockResolvedValue(row(1));
    mockUsuarioFindUnique.mockResolvedValue({
      id: 'm-perez',
      rol: RolUsuario.MEDICO,
      activo: false,
    });

    await expect(
      service.assign('c1', { medicoId: 'm-perez' }, recepcionista),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.assign('c1', { medicoId: 'm-perez' }, recepcionista),
    ).rejects.toThrow(MEDICO_ASIGNACION_INVALIDO);
    expect(mockConsultorioUpdate).not.toHaveBeenCalled();
  });

  it('médico recibe 403 al asignar', async () => {
    await expect(
      service.assign('c1', { medicoId: 'm-perez' }, medicoUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockConsultorioFindUnique).not.toHaveBeenCalled();
  });
});

describe('ConsultoriosController', () => {
  let controller: ConsultoriosController;
  let service: { list: jest.Mock; assign: jest.Mock };

  beforeEach(async () => {
    service = {
      list: jest.fn().mockResolvedValue([]),
      assign: jest.fn().mockResolvedValue([]),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsultoriosController],
      providers: [
        { provide: ConsultoriosService, useValue: service },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(ConsultoriosController);
  });

  it('delega listado al servicio', async () => {
    await controller.list({ user: recepcionista } as never);
    expect(service.list).toHaveBeenCalledWith(recepcionista);
  });

  it('delega asignación al servicio', async () => {
    await controller.assign('c1', { medicoId: 'm1' }, {
      user: recepcionista,
    } as never);
    expect(service.assign).toHaveBeenCalledWith(
      'c1',
      { medicoId: 'm1' },
      recepcionista,
    );
  });
});
