import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RolUsuario } from '@turnos/database';
import { JwtAuthGuard } from '../auth';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockFindMany = jest.fn();

jest.mock('@turnos/database', () => ({
  prisma: {
    usuario: {
      get findMany() {
        return mockFindMany;
      },
    },
  },
  RolUsuario: {
    MEDICO: 'MEDICO',
  },
}));

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    mockFindMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();
    service = module.get(UsersService);
  });

  it('devuelve solo médicos activos mapeados a DTO mínimo', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 'm1',
        nombre: 'Carlos',
        apellido: 'Médico',
        especialidades: [{ especialidadId: 'e1' }],
      },
    ]);

    const result = await service.findAll();

    expect(result).toEqual([
      {
        id: 'm1',
        nombre: 'Carlos',
        apellido: 'Médico',
        especialidadIds: ['e1'],
      },
    ]);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activo: true, rol: RolUsuario.MEDICO },
      }),
    );
    expect(result[0]).not.toHaveProperty('passwordHash');
    expect(result[0]).not.toHaveProperty('mail');
  });

  it('siempre filtra por rol MEDICO aunque el caller no pase rol', async () => {
    mockFindMany.mockResolvedValue([]);

    await service.findAll();

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { activo: true, rol: RolUsuario.MEDICO },
      }),
    );
  });
});

describe('UsersController', () => {
  let controller: UsersController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: service },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(UsersController);
  });

  it('delega listado sin query rol', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.list({});
    expect(service.findAll).toHaveBeenCalledWith();
  });

  it('delega listado con rol MEDICO en query', async () => {
    service.findAll.mockResolvedValue([]);
    await controller.list({ rol: 'MEDICO' });
    expect(service.findAll).toHaveBeenCalledWith();
  });
});
