import { ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { RolUsuario } from '@turnos/database';
import { JwtAuthGuard } from '../auth';
import { WaitingRoomController } from './waiting-room.controller';
import { WaitingRoomEvents } from './waiting-room.events';
import { WaitingRoomService } from './waiting-room.service';
import { filter, firstValueFrom, take } from 'rxjs';

const mockLlamadoFindMany = jest.fn();

jest.mock('@turnos/database', () => {
  const prisma = {
    llamadoTurno: {
      get findMany() {
        return mockLlamadoFindMany;
      },
    },
  };
  return {
    prisma,
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
 * Fila de llamado para mocks.
 *
 * @param index - Índice.
 * @returns Entidad.
 */
function row(index: number) {
  return {
    id: `l${index}`,
    turnoId: `t${index}`,
    llamadoEn: new Date(`2026-09-09T13:0${index}:00.000Z`),
    pacienteNombre: 'Pepe',
    pacienteApellido: 'Grillo',
    consultorioNumero: 1,
  };
}

describe('WaitingRoomService', () => {
  let service: WaitingRoomService;
  let events: WaitingRoomEvents;

  beforeEach(async () => {
    mockLlamadoFindMany.mockReset();
    mockLlamadoFindMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [WaitingRoomService, WaitingRoomEvents],
    }).compile();
    service = module.get(WaitingRoomService);
    events = module.get(WaitingRoomEvents);
  });

  it('snapshot vacío', async () => {
    const result = await service.snapshot(recepcionista);
    expect(result.items).toEqual([]);
    expect(mockLlamadoFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { llamadoEn: 'desc' },
        take: 5,
      }),
    );
  });

  it('snapshot recorta a 5', async () => {
    mockLlamadoFindMany.mockResolvedValue([
      row(5),
      row(4),
      row(3),
      row(2),
      row(1),
    ]);
    const result = await service.snapshot(recepcionista);
    expect(result.items).toHaveLength(5);
    expect(result.items[0]?.id).toBe('l5');
    expect(result.items[0]?.consultorioNumero).toBe(1);
  });

  it('médico recibe 403', async () => {
    await expect(service.snapshot(medicoUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockLlamadoFindMany).not.toHaveBeenCalled();
  });

  it('el publisher entrega el payload a un subscriber', async () => {
    const pending = firstValueFrom(
      events.stream().pipe(
        filter((event) => event.type !== 'ping'),
        take(1),
      ),
    );
    const item = {
      id: 'l1',
      consultorioNumero: 7,
      pacienteNombre: 'Ana',
      pacienteApellido: 'Gómez',
      llamadoEn: '2026-09-09T13:00:00.000Z',
    };
    events.emit(item);
    const event = await pending;
    expect(event.data).toEqual(item);
  });
});

describe('WaitingRoomController', () => {
  let controller: WaitingRoomController;
  let service: { snapshot: jest.Mock; assertCanAccess: jest.Mock };

  beforeEach(async () => {
    service = {
      snapshot: jest.fn().mockResolvedValue({ items: [] }),
      assertCanAccess: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WaitingRoomController],
      providers: [
        { provide: WaitingRoomService, useValue: service },
        WaitingRoomEvents,
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();
    controller = module.get(WaitingRoomController);
  });

  it('exige usuario autenticado', () => {
    expect(() => controller.snapshot({} as never)).toThrow(
      'No autorizado',
    );
  });
});
