import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth';
import { EspecialidadesController } from './especialidades.controller';
import { EspecialidadesService } from './especialidades.service';

const mockFindMany = jest.fn();

jest.mock('@turnos/database', () => ({
  prisma: {
    especialidad: {
      get findMany() {
        return mockFindMany;
      },
    },
  },
}));

describe('EspecialidadesService', () => {
  let service: EspecialidadesService;

  beforeEach(async () => {
    mockFindMany.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [EspecialidadesService],
    }).compile();
    service = module.get(EspecialidadesService);
  });

  it('devuelve especialidades mapeadas a DTO mínimo', async () => {
    mockFindMany.mockResolvedValue([{ id: 'e1', nombre: 'Cardiología' }]);

    const result = await service.findAll();

    expect(result).toEqual([{ id: 'e1', nombre: 'Cardiología' }]);
  });
});

describe('EspecialidadesController', () => {
  let controller: EspecialidadesController;
  let service: { findAll: jest.Mock };

  beforeEach(async () => {
    service = { findAll: jest.fn().mockResolvedValue([]) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EspecialidadesController],
      providers: [
        { provide: EspecialidadesService, useValue: service },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(EspecialidadesController);
  });

  it('delega listado al servicio', async () => {
    await controller.list({} as never);
    expect(service.findAll).toHaveBeenCalled();
  });
});
