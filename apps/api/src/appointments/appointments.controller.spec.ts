import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoTurno, RolUsuario } from '@turnos/database';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth';
import { startOfClinicDay } from './appointments.constants';

const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock('@turnos/database', () => ({
  prisma: {
    turno: {
      get findMany() {
        return mockFindMany;
      },
      get count() {
        return mockCount;
      },
    },
  },
  EstadoTurno: {
    CANCELADO: 'CANCELADO',
    PROGRAMADO: 'PROGRAMADO',
  },
  RolUsuario: {
    MEDICO: 'MEDICO',
  },
}));

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppointmentsService],
    }).compile();
    service = module.get(AppointmentsService);
  });

  it('fuerza medicoId del JWT cuando el rol es MEDICO', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await service.listTurnos(
      { medicoId: 'otro-id', incluirCancelados: true },
      { sub: 'medico-propio', mail: 'm@x.c', rol: RolUsuario.MEDICO },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          medicoId: 'medico-propio',
        }) as Record<string, unknown>,
      }),
    );
  });

  it('primera página ancla a hoy 00:00 en zona horaria de clínica', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await service.listTurnos(
      { incluirCancelados: true },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    const callArg = mockFindMany.mock.calls[0]?.[0] as
      | { where?: { fechaInicio?: { gte?: Date } } }
      | undefined;
    const gte = callArg?.where?.fechaInicio?.gte;
    expect(gte).toBeInstanceOf(Date);
    expect(gte?.getTime()).toBe(startOfClinicDay(new Date()).getTime());
  });

  it('devuelve cursorAnterior cuando la primera página está vacía pero hay turnos previos', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(5);

    const result = await service.listTurnos(
      { incluirCancelados: true },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(result.items).toEqual([]);
    expect(result.cursorAnterior).not.toBeNull();
  });

  it('rechaza cursor inválido con BadRequestException', () => {
    const invalidCursor = Buffer.from(
      JSON.stringify({ f: 'no-es-fecha', id: 'x' }),
    ).toString('base64url');

    expect(() => service.decodeCursor(invalidCursor)).toThrow(
      BadRequestException,
    );
  });

  it('pagina siguiente usa cursor y direccion', async () => {
    const cursorDate = new Date('2026-08-16T10:00:00.000Z');
    const cursor = service.encodeCursor(
      cursorDate,
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await service.listTurnos(
      { cursor, direccion: 'siguiente', incluirCancelados: true },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ fechaInicio: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('pagina anterior invierte el orden y devuelve ascendente', async () => {
    const cursorDate = new Date('2026-08-16T10:00:00.000Z');
    const cursor = service.encodeCursor(
      cursorDate,
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    mockFindMany.mockResolvedValue([
      {
        id: 't2',
        fechaInicio: new Date('2026-08-16T09:00:00.000Z'),
        fechaFin: new Date('2026-08-16T09:30:00.000Z'),
        estado: EstadoTurno.PROGRAMADO,
        tipo: 'CONTROL',
        paciente: { nombre: 'A', apellido: 'B' },
        medico: { nombre: 'C', apellido: 'D' },
        especialidad: { nombre: 'Cardiología' },
      },
    ]);
    mockCount.mockResolvedValue(1);

    const result = await service.listTurnos(
      { cursor, direccion: 'anterior', incluirCancelados: true },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ fechaInicio: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(result.items[0]?.id).toBe('t2');
  });
});

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: { listTurnos: jest.Mock };

  beforeEach(async () => {
    service = { listTurnos: jest.fn().mockResolvedValue({ items: [] }) };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppointmentsController],
      providers: [
        { provide: AppointmentsService, useValue: service },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(AppointmentsController);
  });

  it('devuelve TurnoListItemResponseDto sin campos internos', async () => {
    service.listTurnos.mockResolvedValue({
      items: [
        {
          id: 't1',
          fecha: '2026-08-16',
          hora: '09:00',
          paciente: { nombre: 'María', apellido: 'González' },
          medico: { nombre: 'Carlos', apellido: 'Médico' },
          especialidad: { nombre: 'Cardiología' },
          estado: 'PROGRAMADO',
          tipo: 'PRIMER_TURNO',
        },
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    const result = await controller.list({ incluirCancelados: true }, {
      user: { sub: 'u1', mail: 'a@b.c', rol: 'RECEPCIONISTA' },
    } as never);

    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).not.toHaveProperty('passwordHash');
  });

  it('exige usuario autenticado', () => {
    expect(() =>
      controller.list({ incluirCancelados: true }, {} as never),
    ).toThrow(UnauthorizedException);
  });
});
