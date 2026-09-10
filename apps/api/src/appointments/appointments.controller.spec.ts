import {
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EstadoTurno, RolUsuario, TipoTurno } from '@turnos/database';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth';
import { WaitingRoomEvents } from '../waiting-room';
import {
  CANCELAR_TURNO_ESTADO_INVALIDO,
  CONFIRMAR_TURNO_SOLO_HOY,
  CONFIRMAR_TURNO_SOLO_PROGRAMADO,
  FINALIZAR_SIN_LLAMADO,
  LLAMAR_SIN_CONSULTORIO,
  LLAMAR_TURNO_SOLO_CONFIRMADO,
  LLAMAR_TURNO_SOLO_HOY,
  clinicDateTimeFromYmdHm,
  clinicDayRangeFromYmd,
  formatClinicDate,
  startOfClinicDay,
} from './appointments.constants';

const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockTurnoFindUnique = jest.fn();
const mockTurnoCreate = jest.fn();
const mockTurnoUpdate = jest.fn();
const mockTurnoUpdateMany = jest.fn();
const mockPacienteFindUnique = jest.fn();
const mockPacienteCreate = jest.fn();
const mockUsuarioFindUnique = jest.fn();
const mockLinkFindUnique = jest.fn();
const mockLlamadoCreate = jest.fn();
const mockConsultorioFindUnique = jest.fn();
const mockEmitLlamado = jest.fn();

/**
 * Primer argumento de la última invocación a prisma.turno.findMany.
 *
 * @returns Argumento tipado o undefined.
 */
function firstFindManyArg<T>(): T | undefined {
  const calls = mockFindMany.mock.calls as Array<[T]>;
  return calls[0]?.[0];
}

const FUTURE_FECHA = '2099-01-15';

/**
 * Body válido de alta/edición para tests.
 *
 * @param overrides - Campos a pisar.
 * @returns DTO de upsert.
 */
function upsertBody(
  overrides: Partial<Parameters<AppointmentsService['createTurno']>[0]> = {},
) {
  return {
    paciente: {
      documento: '20000001',
      nombre: 'María',
      apellido: 'González',
    },
    medicoId: 'med-1',
    especialidadId: 'esp-1',
    fecha: FUTURE_FECHA,
    horaInicio: '10:00',
    horaFin: '10:30',
    tipo: TipoTurno.CONTROL,
    notificarMail: false,
    ...overrides,
  };
}

/**
 * Entidad Prisma mínima de detalle de turno.
 *
 * @param overrides - Campos a pisar.
 * @returns Turno con relaciones.
 */
function detalleEntity(overrides: Record<string, unknown> = {}) {
  return {
    id: 't1',
    pacienteId: 'p1',
    medicoId: 'med-1',
    especialidadId: 'esp-1',
    creadoPorId: 'u1',
    fechaInicio: new Date('2099-01-15T13:00:00.000Z'),
    fechaFin: new Date('2099-01-15T13:30:00.000Z'),
    tipo: 'PRIMER_TURNO',
    estado: 'PROGRAMADO',
    notificarMail: false,
    motivoCancelacion: null,
    notificarWhatsapp: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    paciente: {
      id: 'p1',
      documento: '20000001',
      nombre: 'María',
      apellido: 'González',
      telefono: null,
      mail: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    medico: { nombre: 'Carlos', apellido: 'Médico' },
    especialidad: { nombre: 'Cardiología' },
    _count: { llamados: 0 },
    ...overrides,
  };
}

jest.mock('@turnos/database', () => {
  const prisma = {
    $transaction: jest.fn(async (cb: (tx: unknown) => unknown) => cb(prisma)),
    turno: {
      get findMany() {
        return mockFindMany;
      },
      get count() {
        return mockCount;
      },
      get findUnique() {
        return mockTurnoFindUnique;
      },
      get create() {
        return mockTurnoCreate;
      },
      get update() {
        return mockTurnoUpdate;
      },
      get updateMany() {
        return mockTurnoUpdateMany;
      },
    },
    paciente: {
      get findUnique() {
        return mockPacienteFindUnique;
      },
      get create() {
        return mockPacienteCreate;
      },
    },
    usuario: {
      get findUnique() {
        return mockUsuarioFindUnique;
      },
    },
    medicoEspecialidad: {
      get findUnique() {
        return mockLinkFindUnique;
      },
    },
    llamadoTurno: {
      get create() {
        return mockLlamadoCreate;
      },
    },
    consultorio: {
      get findUnique() {
        return mockConsultorioFindUnique;
      },
    },
  };
  return {
    prisma,
    EstadoTurno: {
      CANCELADO: 'CANCELADO',
      PROGRAMADO: 'PROGRAMADO',
      CONFIRMADO: 'CONFIRMADO',
      ATENDIDO: 'ATENDIDO',
      AUSENTE: 'AUSENTE',
    },
    RolUsuario: {
      MEDICO: 'MEDICO',
      RECEPCIONISTA: 'RECEPCIONISTA',
      ADMIN: 'ADMIN',
    },
    TipoTurno: {
      PRIMER_TURNO: 'PRIMER_TURNO',
      CONTROL: 'CONTROL',
      SOBRETURNO: 'SOBRETURNO',
      URGENTE: 'URGENTE',
    },
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        code = 'P2002';
      },
    },
  };
});

describe('AppointmentsService', () => {
  let service: AppointmentsService;

  beforeEach(async () => {
    mockFindMany.mockReset();
    mockCount.mockReset();
    mockTurnoFindUnique.mockReset();
    mockTurnoCreate.mockReset();
    mockTurnoUpdate.mockReset();
    mockTurnoUpdateMany.mockReset();
    mockPacienteFindUnique.mockReset();
    mockPacienteCreate.mockReset();
    mockUsuarioFindUnique.mockReset();
    mockLinkFindUnique.mockReset();
    mockLlamadoCreate.mockReset();
    mockConsultorioFindUnique.mockReset();
    mockEmitLlamado.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: WaitingRoomEvents, useValue: { emit: mockEmitLlamado } },
      ],
    }).compile();
    service = module.get(AppointmentsService);
  });

  it('fuerza medicoId del JWT cuando el rol es MEDICO', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await service.listTurnos(
      { medicoId: 'otro-id', soloPendientes: false },
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
      { soloPendientes: false },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    const callArg = firstFindManyArg<{
      where?: { fechaInicio?: { gte?: Date } };
    }>();
    const gte = callArg?.where?.fechaInicio?.gte;
    expect(gte).toBeInstanceOf(Date);
    expect(gte?.getTime()).toBe(startOfClinicDay(new Date()).getTime());
  });

  it('devuelve cursorAnterior cuando la primera página está vacía pero hay turnos previos', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(5);

    const result = await service.listTurnos(
      { soloPendientes: false },
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
      { cursor, direccion: 'siguiente', soloPendientes: false },
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
      { cursor, direccion: 'anterior', soloPendientes: false },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ fechaInicio: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(result.items[0]?.id).toBe('t2');
  });

  it('consulta por fecha devuelve todos los turnos del día sin paginar', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 't1',
        fechaInicio: new Date('2026-08-16T12:00:00.000Z'),
        fechaFin: new Date('2026-08-16T12:30:00.000Z'),
        estado: EstadoTurno.PROGRAMADO,
        tipo: 'CONTROL',
        paciente: { nombre: 'A', apellido: 'B' },
        medico: { nombre: 'C', apellido: 'D' },
        especialidad: { nombre: 'Cardiología' },
      },
      {
        id: 't2',
        fechaInicio: new Date('2026-08-16T15:00:00.000Z'),
        fechaFin: new Date('2026-08-16T15:30:00.000Z'),
        estado: EstadoTurno.PROGRAMADO,
        tipo: 'CONTROL',
        paciente: { nombre: 'E', apellido: 'F' },
        medico: { nombre: 'G', apellido: 'H' },
        especialidad: { nombre: 'Cardiología' },
      },
    ]);

    const result = await service.listTurnos(
      { fecha: '2026-08-16', soloPendientes: false },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fechaInicio: expect.objectContaining({
            gte: expect.any(Date) as Date,
            lt: expect.any(Date) as Date,
          }) as Record<string, unknown>,
        }) as Record<string, unknown>,
      }),
    );
    const callArg = firstFindManyArg<{ take?: number }>();
    expect(callArg?.take).toBeUndefined();
    expect(result.items).toHaveLength(2);
    expect(result.cursorAnterior).toBeNull();
    expect(result.cursorSiguiente).toBeNull();
    expect(result.items[0]?.horaFin).toBeDefined();
  });

  it('ignora cursor cuando fecha está presente', async () => {
    mockFindMany.mockResolvedValue([]);
    const cursor = service.encodeCursor(
      new Date('2026-08-10T10:00:00.000Z'),
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    );

    await service.listTurnos(
      {
        fecha: '2026-08-16',
        cursor,
        direccion: 'siguiente',
        soloPendientes: false,
      },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledTimes(1);
    const callArg = firstFindManyArg<{
      where?: { fechaInicio?: { gte?: Date; lt?: Date } };
    }>();
    expect(callArg.where?.fechaInicio?.gte).toBeInstanceOf(Date);
    expect(callArg.where?.fechaInicio?.lt).toBeInstanceOf(Date);
  });

  it('consulta por fecha fuerza medicoId del JWT cuando el rol es MEDICO', async () => {
    mockFindMany.mockResolvedValue([]);

    await service.listTurnos(
      { fecha: '2026-08-16', medicoId: 'otro-id', soloPendientes: false },
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

  it('consulta por fecha sin turnos devuelve lista vacía', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await service.listTurnos(
      { fecha: '2026-08-16', soloPendientes: false },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(result.items).toEqual([]);
    expect(result.cursorAnterior).toBeNull();
    expect(result.cursorSiguiente).toBeNull();
  });

  it('rechaza fecha inválida', async () => {
    await expect(
      service.listTurnos(
        { fecha: '2026-13-40', soloPendientes: false },
        { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soloPendientes filtra PROGRAMADO y CONFIRMADO', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    await service.listTurnos(
      { soloPendientes: true },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estado: {
            in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
          },
        }) as Record<string, unknown>,
      }),
    );
  });

  it('alta con paciente nuevo persiste PRIMER_TURNO', async () => {
    mockPacienteFindUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'p-new', mail: null });
    mockPacienteCreate.mockResolvedValue({ id: 'p-new' });
    mockUsuarioFindUnique.mockResolvedValue({
      id: 'med-1',
      rol: RolUsuario.MEDICO,
      activo: true,
    });
    mockLinkFindUnique.mockResolvedValue({
      medicoId: 'med-1',
      especialidadId: 'esp-1',
    });
    mockCount.mockResolvedValue(0);
    mockTurnoCreate.mockResolvedValue(
      detalleEntity({ pacienteId: 'p-new', tipo: 'PRIMER_TURNO' }),
    );

    const result = await service.createTurno(upsertBody(), {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    });

    expect(mockPacienteCreate).toHaveBeenCalled();
    expect(mockTurnoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipo: TipoTurno.PRIMER_TURNO,
          estado: EstadoTurno.PROGRAMADO,
          creadoPorId: 'recep-1',
        }),
      }),
    );
    expect(result.id).toBe('t1');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('alta con paciente existente no lo vuelve a crear', async () => {
    mockPacienteFindUnique
      .mockResolvedValueOnce({
        id: 'p1',
        documento: '20000001',
        mail: 'a@b.c',
      })
      .mockResolvedValueOnce({ id: 'p1', mail: 'a@b.c' });
    mockUsuarioFindUnique.mockResolvedValue({
      id: 'med-1',
      rol: RolUsuario.MEDICO,
      activo: true,
    });
    mockLinkFindUnique.mockResolvedValue({
      medicoId: 'med-1',
      especialidadId: 'esp-1',
    });
    mockCount.mockResolvedValue(2);
    mockTurnoCreate.mockResolvedValue(detalleEntity({ tipo: 'CONTROL' }));

    await service.createTurno(upsertBody(), {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    });

    expect(mockPacienteCreate).not.toHaveBeenCalled();
    expect(mockTurnoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tipo: TipoTurno.CONTROL }),
      }),
    );
  });

  it('no crea el turno si falla el alta de paciente', async () => {
    mockPacienteFindUnique.mockResolvedValue(null);
    mockPacienteCreate.mockRejectedValue(new Error('db down'));

    await expect(
      service.createTurno(upsertBody(), {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toThrow('db down');
    expect(mockTurnoCreate).not.toHaveBeenCalled();
  });

  it('médico no puede crear turnos', async () => {
    await expect(
      service.createTurno(upsertBody(), {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('primera vez excluye el turno en edición', async () => {
    mockCount.mockResolvedValue(0);
    const result = await service.isPrimeraVez({
      pacienteId: 'p1',
      medicoId: 'med-1',
      excluirTurnoId: 't1',
    });
    expect(result.primeraVez).toBe(true);
    expect(mockCount).toHaveBeenCalledWith({
      where: { pacienteId: 'p1', medicoId: 'med-1', id: { not: 't1' } },
    });
  });

  it('GET detalle oculta turnos de otro médico', async () => {
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({ medicoId: 'otro-medico' }),
    );
    await expect(
      service.findById('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('PATCH rechaza un turno que no está PROGRAMADO', async () => {
    mockTurnoFindUnique.mockResolvedValue({
      ...detalleEntity(),
      estado: EstadoTurno.CONFIRMADO,
      fechaInicio: new Date('2099-01-15T13:00:00.000Z'),
    });

    await expect(
      service.updateTurno('t1', upsertBody(), {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockTurnoUpdate).not.toHaveBeenCalled();
  });

  it('PATCH rechaza un turno con fecha pasada', async () => {
    await expect(
      service.updateTurno('t1', upsertBody({ fecha: '2020-01-01' }), {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockTurnoUpdate).not.toHaveBeenCalled();
  });

  it('confirma un PROGRAMADO de hoy', async () => {
    const today = formatClinicDate(new Date());
    const range = clinicDayRangeFromYmd(today);
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoUpdateMany.mockResolvedValue({ count: 1 });
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
      }),
    );

    const result = await service.confirmarTurno('t1', {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    });

    expect(mockTurnoUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 't1',
        estado: EstadoTurno.PROGRAMADO,
        fechaInicio: { gte: range?.start, lt: range?.end },
      },
      data: { estado: EstadoTurno.CONFIRMADO },
    });
    expect(result.estado).toBe(EstadoTurno.CONFIRMADO);
  });

  it('médico no puede confirmar turnos', async () => {
    await expect(
      service.confirmarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockTurnoUpdateMany).not.toHaveBeenCalled();
  });

  it('confirmar rechaza un turno que no es de hoy', async () => {
    mockTurnoUpdateMany.mockResolvedValue({ count: 0 });
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({ estado: EstadoTurno.PROGRAMADO }),
    );

    await expect(
      service.confirmarTurno('t1', {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toThrow(CONFIRMAR_TURNO_SOLO_HOY);
  });

  it('confirmar rechaza un turno ya CONFIRMADO', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoUpdateMany.mockResolvedValue({ count: 0 });
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
      }),
    );

    await expect(
      service.confirmarTurno('t1', {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toThrow(CONFIRMAR_TURNO_SOLO_PROGRAMADO);
  });

  it('confirmar responde 404 si el turno no existe', async () => {
    mockTurnoUpdateMany.mockResolvedValue({ count: 0 });
    mockTurnoFindUnique.mockResolvedValue(null);

    await expect(
      service.confirmarTurno('missing', {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('una segunda confirmación no pisa el estado', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockTurnoFindUnique
      .mockResolvedValueOnce(
        detalleEntity({
          estado: EstadoTurno.CONFIRMADO,
          fechaInicio: start,
        }),
      )
      .mockResolvedValueOnce(
        detalleEntity({
          estado: EstadoTurno.CONFIRMADO,
          fechaInicio: start,
        }),
      );

    const user = {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    };
    await service.confirmarTurno('t1', user);
    await expect(service.confirmarTurno('t1', user)).rejects.toThrow(
      CONFIRMAR_TURNO_SOLO_PROGRAMADO,
    );
    expect(mockTurnoUpdate).not.toHaveBeenCalled();
    expect(mockTurnoUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({ estado: EstadoTurno.PROGRAMADO }),
        data: { estado: EstadoTurno.CONFIRMADO },
      }),
    );
  });

  it('cancela un PROGRAMADO de fecha pasada sin motivo', async () => {
    mockTurnoUpdateMany.mockResolvedValue({ count: 1 });
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        estado: EstadoTurno.CANCELADO,
        motivoCancelacion: null,
        fechaInicio: new Date('2020-01-15T13:00:00.000Z'),
      }),
    );

    const result = await service.cancelarTurno(
      't1',
      {},
      {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      },
    );

    expect(mockTurnoUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 't1',
        estado: {
          in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
        },
      },
      data: {
        estado: EstadoTurno.CANCELADO,
        motivoCancelacion: null,
      },
    });
    expect(result.estado).toBe(EstadoTurno.CANCELADO);
    expect(result.motivoCancelacion).toBeNull();
  });

  it('cancela un CONFIRMADO persistiendo el motivo', async () => {
    mockTurnoUpdateMany.mockResolvedValue({ count: 1 });
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        estado: EstadoTurno.CANCELADO,
        motivoCancelacion: 'Paciente reprogramó',
      }),
    );

    const result = await service.cancelarTurno(
      't1',
      { motivo: '  Paciente reprogramó  ' },
      {
        sub: 'admin-1',
        mail: 'a@x.c',
        rol: RolUsuario.ADMIN,
      },
    );

    expect(mockTurnoUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 't1',
        estado: {
          in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
        },
      },
      data: {
        estado: EstadoTurno.CANCELADO,
        motivoCancelacion: 'Paciente reprogramó',
      },
    });
    expect(result.motivoCancelacion).toBe('Paciente reprogramó');
  });

  it('médico no puede cancelar turnos', async () => {
    await expect(
      service.cancelarTurno(
        't1',
        {},
        {
          sub: 'medico-propio',
          mail: 'm@x.c',
          rol: RolUsuario.MEDICO,
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockTurnoUpdateMany).not.toHaveBeenCalled();
  });

  it('cancelar rechaza ATENDIDO, AUSENTE y CANCELADO', async () => {
    for (const estado of [
      EstadoTurno.ATENDIDO,
      EstadoTurno.AUSENTE,
      EstadoTurno.CANCELADO,
    ]) {
      mockTurnoUpdateMany.mockResolvedValue({ count: 0 });
      mockTurnoFindUnique.mockResolvedValue(detalleEntity({ estado }));

      await expect(
        service.cancelarTurno(
          't1',
          {},
          {
            sub: 'recep-1',
            mail: 'r@x.c',
            rol: RolUsuario.RECEPCIONISTA,
          },
        ),
      ).rejects.toThrow(CANCELAR_TURNO_ESTADO_INVALIDO);
    }
  });

  it('cancelar responde 404 si el turno no existe', async () => {
    mockTurnoUpdateMany.mockResolvedValue({ count: 0 });
    mockTurnoFindUnique.mockResolvedValue(null);

    await expect(
      service.cancelarTurno(
        'missing',
        {},
        {
          sub: 'recep-1',
          mail: 'r@x.c',
          rol: RolUsuario.RECEPCIONISTA,
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('una segunda cancelación no pisa el estado', async () => {
    mockTurnoUpdateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    mockTurnoFindUnique
      .mockResolvedValueOnce(
        detalleEntity({
          estado: EstadoTurno.CANCELADO,
          motivoCancelacion: null,
        }),
      )
      .mockResolvedValueOnce(
        detalleEntity({
          estado: EstadoTurno.CANCELADO,
          motivoCancelacion: null,
        }),
      );

    const user = {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    };
    await service.cancelarTurno('t1', {}, user);
    await expect(service.cancelarTurno('t1', {}, user)).rejects.toThrow(
      CANCELAR_TURNO_ESTADO_INVALIDO,
    );
    expect(mockTurnoUpdate).not.toHaveBeenCalled();
    expect(mockTurnoUpdateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          estado: {
            in: [EstadoTurno.PROGRAMADO, EstadoTurno.CONFIRMADO],
          },
        }),
      }),
    );
  });

  it('llama un CONFIRMADO de hoy y emite a sala de espera', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
        _count: { llamados: 0 },
      }),
    );
    mockConsultorioFindUnique.mockResolvedValue({ id: 'c7', numero: 7 });
    mockLlamadoCreate.mockResolvedValue({
      id: 'l1',
      turnoId: 't1',
      llamadoEn: new Date(),
      pacienteNombre: 'María',
      pacienteApellido: 'González',
      consultorioNumero: 7,
    });

    const result = await service.llamarTurno('t1', {
      sub: 'medico-propio',
      mail: 'm@x.c',
      rol: RolUsuario.MEDICO,
    });

    expect(result.llamado).toBe(true);
    expect(result.estado).toBe(EstadoTurno.CONFIRMADO);
    expect(mockEmitLlamado).toHaveBeenCalledTimes(1);
  });

  it('un segundo llamado inserta otro aviso', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
        _count: { llamados: 1 },
      }),
    );
    mockConsultorioFindUnique.mockResolvedValue({ id: 'c7', numero: 7 });
    mockLlamadoCreate.mockResolvedValue({
      id: 'l2',
      turnoId: 't1',
      llamadoEn: new Date(),
      pacienteNombre: 'María',
      pacienteApellido: 'González',
      consultorioNumero: 7,
    });

    const result = await service.llamarTurno('t1', {
      sub: 'medico-propio',
      mail: 'm@x.c',
      rol: RolUsuario.MEDICO,
    });

    expect(result.llamado).toBe(true);
    expect(mockLlamadoCreate).toHaveBeenCalledTimes(1);
    expect(mockEmitLlamado).toHaveBeenCalledTimes(1);
  });

  it('llamar sin consultorio es 400 y no emite', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
      }),
    );
    mockConsultorioFindUnique.mockResolvedValue(null);

    await expect(
      service.llamarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toThrow(LLAMAR_SIN_CONSULTORIO);
    expect(mockLlamadoCreate).not.toHaveBeenCalled();
    expect(mockEmitLlamado).not.toHaveBeenCalled();
  });

  it('llamar rechaza si no es hoy', async () => {
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.CONFIRMADO,
      }),
    );

    await expect(
      service.llamarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toThrow(LLAMAR_TURNO_SOLO_HOY);
    expect(mockEmitLlamado).not.toHaveBeenCalled();
  });

  it('llamar rechaza si no está confirmado', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.PROGRAMADO,
        fechaInicio: start,
      }),
    );

    await expect(
      service.llamarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toThrow(LLAMAR_TURNO_SOLO_CONFIRMADO);
  });

  it('recepcionista no puede llamar', async () => {
    await expect(
      service.llamarTurno('t1', {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockTurnoFindUnique).not.toHaveBeenCalled();
  });

  it('médico ajeno recibe 404 al llamar', async () => {
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({ medicoId: 'otro' }),
    );

    await expect(
      service.llamarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finaliza un CONFIRMADO de hoy ya llamado', async () => {
    const today = formatClinicDate(new Date());
    const range = clinicDayRangeFromYmd(today);
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique
      .mockResolvedValueOnce(
        detalleEntity({
          medicoId: 'medico-propio',
          estado: EstadoTurno.CONFIRMADO,
          fechaInicio: start,
          _count: { llamados: 1 },
        }),
      )
      .mockResolvedValueOnce(
        detalleEntity({
          medicoId: 'medico-propio',
          estado: EstadoTurno.ATENDIDO,
          fechaInicio: start,
          _count: { llamados: 1 },
        }),
      );
    mockTurnoUpdateMany.mockResolvedValue({ count: 1 });

    const result = await service.finalizarTurno('t1', {
      sub: 'medico-propio',
      mail: 'm@x.c',
      rol: RolUsuario.MEDICO,
    });

    expect(mockTurnoUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 't1',
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: { gte: range?.start, lt: range?.end },
      },
      data: { estado: EstadoTurno.ATENDIDO },
    });
    expect(result.estado).toBe(EstadoTurno.ATENDIDO);
  });

  it('finalizar sin llamados es 400', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.CONFIRMADO,
        fechaInicio: start,
        _count: { llamados: 0 },
      }),
    );

    await expect(
      service.finalizarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toThrow(FINALIZAR_SIN_LLAMADO);
    expect(mockTurnoUpdateMany).not.toHaveBeenCalled();
  });

  it('finalizar un ATENDIDO es 400', async () => {
    const today = formatClinicDate(new Date());
    const start = clinicDateTimeFromYmdHm(today, '10:00');
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({
        medicoId: 'medico-propio',
        estado: EstadoTurno.ATENDIDO,
        fechaInicio: start,
        _count: { llamados: 1 },
      }),
    );

    await expect(
      service.finalizarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockTurnoUpdateMany).not.toHaveBeenCalled();
  });

  it('recepcionista no puede finalizar', async () => {
    await expect(
      service.finalizarTurno('t1', {
        sub: 'recep-1',
        mail: 'r@x.c',
        rol: RolUsuario.RECEPCIONISTA,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('médico ajeno recibe 404 al finalizar', async () => {
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({ medicoId: 'otro', _count: { llamados: 1 } }),
    );

    await expect(
      service.finalizarTurno('t1', {
        sub: 'medico-propio',
        mail: 'm@x.c',
        rol: RolUsuario.MEDICO,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('listado incluye llamado verdadero cuando hay avisos', async () => {
    mockFindMany.mockResolvedValue([
      {
        id: 't1',
        fechaInicio: new Date('2026-08-16T12:00:00.000Z'),
        fechaFin: new Date('2026-08-16T12:30:00.000Z'),
        estado: EstadoTurno.CONFIRMADO,
        tipo: 'CONTROL',
        paciente: { nombre: 'A', apellido: 'B' },
        medico: { nombre: 'C', apellido: 'D' },
        especialidad: { nombre: 'Cardiología' },
        _count: { llamados: 2 },
      },
    ]);

    const result = await service.listTurnos(
      { fecha: '2026-08-16', soloPendientes: false },
      { sub: 'admin', mail: 'a@b.c', rol: 'ADMIN' },
    );

    expect(result.items[0]?.llamado).toBe(true);
  });

  it('detalle sin llamados trae llamado falso', async () => {
    mockTurnoFindUnique.mockResolvedValue(
      detalleEntity({ _count: { llamados: 0 } }),
    );

    const result = await service.findById('t1', {
      sub: 'recep-1',
      mail: 'r@x.c',
      rol: RolUsuario.RECEPCIONISTA,
    });

    expect(result.llamado).toBe(false);
  });
});

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  let service: {
    listTurnos: jest.Mock;
    createTurno: jest.Mock;
    confirmarTurno: jest.Mock;
    cancelarTurno: jest.Mock;
    llamarTurno: jest.Mock;
    finalizarTurno: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      listTurnos: jest.fn().mockResolvedValue({ items: [] }),
      createTurno: jest.fn(),
      confirmarTurno: jest.fn(),
      cancelarTurno: jest.fn(),
      llamarTurno: jest.fn(),
      finalizarTurno: jest.fn(),
    };
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
          horaFin: '09:30',
        },
      ],
      cursorSiguiente: null,
      cursorAnterior: null,
    });

    const result = await controller.list({ soloPendientes: false }, {
      user: { sub: 'u1', mail: 'a@b.c', rol: 'RECEPCIONISTA' },
    } as never);

    expect(result.items[0]).toHaveProperty('id');
    expect(result.items[0]).not.toHaveProperty('passwordHash');
  });

  it('exige usuario autenticado', () => {
    expect(() =>
      controller.list({ soloPendientes: false }, {} as never),
    ).toThrow(UnauthorizedException);
  });

  it('delega el alta al servicio', async () => {
    service.createTurno.mockResolvedValue({ id: 't1' });
    await controller.create(upsertBody(), {
      user: { sub: 'u1', mail: 'a@b.c', rol: 'RECEPCIONISTA' },
    } as never);
    expect(service.createTurno).toHaveBeenCalled();
  });

  it('delega confirmar al servicio', async () => {
    service.confirmarTurno.mockResolvedValue({
      id: 't1',
      estado: 'CONFIRMADO',
    });
    await controller.confirmar('t1', {
      user: { sub: 'u1', mail: 'a@b.c', rol: 'RECEPCIONISTA' },
    } as never);
    expect(service.confirmarTurno).toHaveBeenCalledWith('t1', {
      sub: 'u1',
      mail: 'a@b.c',
      rol: 'RECEPCIONISTA',
    });
  });

  it('delega cancelar al servicio', async () => {
    service.cancelarTurno.mockResolvedValue({
      id: 't1',
      estado: 'CANCELADO',
    });
    await controller.cancelar('t1', { motivo: 'Paciente reprogramó' }, {
      user: { sub: 'u1', mail: 'a@b.c', rol: 'RECEPCIONISTA' },
    } as never);
    expect(service.cancelarTurno).toHaveBeenCalledWith(
      't1',
      { motivo: 'Paciente reprogramó' },
      {
        sub: 'u1',
        mail: 'a@b.c',
        rol: 'RECEPCIONISTA',
      },
    );
  });

  it('delega llamar al servicio', async () => {
    service.llamarTurno.mockResolvedValue({
      id: 't1',
      estado: 'CONFIRMADO',
      llamado: true,
    });
    await controller.llamar('t1', {
      user: { sub: 'm1', mail: 'm@x.c', rol: 'MEDICO' },
    } as never);
    expect(service.llamarTurno).toHaveBeenCalledWith('t1', {
      sub: 'm1',
      mail: 'm@x.c',
      rol: 'MEDICO',
    });
  });

  it('delega finalizar al servicio', async () => {
    service.finalizarTurno.mockResolvedValue({
      id: 't1',
      estado: 'ATENDIDO',
    });
    await controller.finalizar('t1', {
      user: { sub: 'm1', mail: 'm@x.c', rol: 'MEDICO' },
    } as never);
    expect(service.finalizarTurno).toHaveBeenCalledWith('t1', {
      sub: 'm1',
      mail: 'm@x.c',
      rol: 'MEDICO',
    });
  });
});
