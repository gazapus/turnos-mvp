import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

const mockQueryRaw = jest.fn();
const mockFindUnique = jest.fn();

jest.mock('@turnos/database', () => ({
  prisma: {
    get $queryRaw() {
      return mockQueryRaw;
    },
    paciente: {
      get findUnique() {
        return mockFindUnique;
      },
    },
  },
}));

describe('PacientesService', () => {
  let service: PacientesService;

  beforeEach(async () => {
    mockQueryRaw.mockReset();
    mockFindUnique.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PacientesService],
    }).compile();
    service = module.get(PacientesService);
  });

  it('devuelve lista vacía si q falta o tiene menos de 3 caracteres', async () => {
    await expect(service.search()).resolves.toEqual([]);
    await expect(service.search('  ab  ')).resolves.toEqual([]);
    expect(mockQueryRaw).not.toHaveBeenCalled();
  });

  it('busca por substring en nombre o apellido con tope 30', async () => {
    mockQueryRaw.mockResolvedValue([
      { id: 'p1', nombre: 'María', apellido: 'González' },
    ]);

    const result = await service.search('mar');

    expect(result).toEqual([
      { id: 'p1', nombre: 'María', apellido: 'González' },
    ]);
    expect(mockQueryRaw).toHaveBeenCalled();
    const interpolated = mockQueryRaw.mock.calls[0] as unknown[];
    expect(interpolated).toEqual(expect.arrayContaining(['%mar%']));
  });

  it('pliega tildes en el patrón de búsqueda', async () => {
    mockQueryRaw.mockResolvedValue([]);

    await service.search('González');

    const interpolated = mockQueryRaw.mock.calls[0] as unknown[];
    expect(interpolated).toEqual(expect.arrayContaining(['%gonzalez%']));
  });

  it('devuelve paciente por id', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'p1',
      nombre: 'María',
      apellido: 'González',
    });

    await expect(service.findById('p1')).resolves.toEqual({
      id: 'p1',
      nombre: 'María',
      apellido: 'González',
    });
  });

  it('lanza NotFoundException si el paciente no existe', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('PacientesController', () => {
  let controller: PacientesController;
  let service: { search: jest.Mock; findById: jest.Mock };

  beforeEach(async () => {
    service = {
      search: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue({
        id: 'p1',
        nombre: 'María',
        apellido: 'González',
      }),
    };
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

  it('delega la búsqueda al servicio', async () => {
    await controller.list({ q: 'gon' });
    expect(service.search).toHaveBeenCalledWith('gon');
  });

  it('delega getById al servicio', async () => {
    await controller.findById('p1');
    expect(service.findById).toHaveBeenCalledWith('p1');
  });
});
