import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getLoggerToken } from 'nestjs-pino';
import { AUTH_CONSTANTS } from './auth.constants';
import { AuthService } from './auth.service';

jest.mock('@turnos/database', () => ({
  prisma: {
    usuario: {
      findUnique: jest.fn(),
    },
    loginIntento: {
      create: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    loginBloqueo: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('argon2', () => ({
  verify: jest.fn(),
}));

import { prisma } from '@turnos/database';
import * as argon2 from 'argon2';

const mockedPrisma = prisma as unknown as {
  usuario: { findUnique: jest.Mock };
  loginIntento: {
    create: jest.Mock;
    findFirst: jest.Mock;
    count: jest.Mock;
  };
  loginBloqueo: { findFirst: jest.Mock; create: jest.Mock };
};

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { signAsync: jest.Mock };

  const usuarioActivo = {
    id: 'user-1',
    mail: 'admin@clinica.local',
    nombre: 'Admin',
    apellido: 'Sistema',
    rol: 'ADMIN',
    activo: true,
    passwordHash: 'hash',
    documentoIdentidad: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtService = { signAsync: jest.fn().mockResolvedValue('jwt-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwtService },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    mockedPrisma.loginBloqueo.findFirst.mockResolvedValue(null);
  });

  it('login exitoso emite JWT y respuesta de usuario', async () => {
    mockedPrisma.usuario.findUnique.mockResolvedValue(usuarioActivo);
    (argon2.verify as jest.Mock).mockResolvedValue(true);
    mockedPrisma.loginIntento.create.mockResolvedValue({});

    const result = await service.login(
      { mail: 'admin@clinica.local', password: 'secret' },
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('jwt-token');
    expect(result.response.user.mail).toBe('admin@clinica.local');
    expect(mockedPrisma.loginIntento.create).toHaveBeenCalledWith({
      data: { mail: 'admin@clinica.local', ip: '127.0.0.1', exito: true },
    });
  });

  it('credenciales inválidas lanzan UnauthorizedException genérico', async () => {
    mockedPrisma.usuario.findUnique.mockResolvedValue(usuarioActivo);
    (argon2.verify as jest.Mock).mockResolvedValue(false);
    mockedPrisma.loginIntento.create.mockResolvedValue({});
    mockedPrisma.loginIntento.findFirst.mockResolvedValue(null);
    mockedPrisma.loginIntento.count.mockResolvedValue(1);

    await expect(
      service.login(
        { mail: 'admin@clinica.local', password: 'wrong' },
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('bloqueo activo lanza ForbiddenException', async () => {
    mockedPrisma.loginBloqueo.findFirst.mockResolvedValue({
      id: 'lock-1',
      mail: 'admin@clinica.local',
      ip: '127.0.0.1',
      bloqueadoHasta: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });

    await expect(
      service.login(
        { mail: 'admin@clinica.local', password: 'secret' },
        '127.0.0.1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('tercer fallo crea LoginBloqueo', async () => {
    mockedPrisma.usuario.findUnique.mockResolvedValue(null);
    mockedPrisma.loginIntento.create.mockResolvedValue({});
    mockedPrisma.loginIntento.findFirst.mockResolvedValue(null);
    mockedPrisma.loginIntento.count.mockResolvedValue(
      AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS,
    );
    mockedPrisma.loginBloqueo.create.mockResolvedValue({});

    await expect(
      service.login({ mail: 'ghost@clinica.local', password: 'x' }, '10.0.0.1'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(mockedPrisma.loginBloqueo.create).toHaveBeenCalled();
  });

  it('me sin usuario activo lanza UnauthorizedException', async () => {
    mockedPrisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.me('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
