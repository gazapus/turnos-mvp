import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

const mockFindMany = jest.fn();

jest.mock('@turnos/database', () => ({
  prisma: {
    paciente: {
      get findMany() {
        return mockFindMany;
      },
    },
  },
}));

describe('PacientesService', () => {
  let service: PacientesService;

  beforeEach(async () => {
    mockFindMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PacientesService],
    }).compile();
    service = module.get(PacientesService);
  });

  it('devuelve pacientes mapeados a DTO mínimo', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'p1', nombre: 'María', apellido: 'González' },
    ]);

    const result = await service.findAll();

    expect(result).toEqual([
      { id: 'p1', nombre: 'María', apellido: 'González' },
    ]);
  });
});

describe('PacientesController', () => {
  let controller: PacientesController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PacientesController],
      providers: [
        { provide: PacientesService, useValue: service },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(PacientesController);
  });

  it('delega listado al servicio', async () => {
    await controller.list({} as never);
    expect(service.findAll).toHaveBeenCalled();
  });
});
