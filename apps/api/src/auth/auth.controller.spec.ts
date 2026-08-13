import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthUserDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    login: jest.Mock;
    me: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      login: jest.fn(),
      me: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: JwtService,
          useValue: { verifyAsync: jest.fn(), signAsync: jest.fn() },
        },
        JwtAuthGuard,
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('login setea cookie httpOnly y devuelve LoginResponseDto', async () => {
    const user = {
      id: 'u1',
      mail: 'admin@clinica.local',
      nombre: 'Admin',
      apellido: 'Sistema',
      rol: 'ADMIN' as const,
    };
    authService.login.mockResolvedValue({
      response: { user },
      accessToken: 'token-abc',
    });

    const cookie = jest.fn();
    const res = { cookie } as unknown as import('express').Response;
    const req = {
      ip: '127.0.0.1',
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as import('express').Request;

    const result = await controller.login(
      { mail: user.mail, password: 'x' },
      req,
      res,
    );

    expect(result.user.mail).toBe(user.mail);
    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      'token-abc',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
  });

  it('logout limpia cookie', () => {
    const clearCookie = jest.fn();
    const res = { clearCookie } as unknown as import('express').Response;
    controller.logout(res);
    expect(clearCookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
  });

  it('me exige usuario en request', () => {
    expect(() => controller.me({} as never)).toThrow(UnauthorizedException);
  });

  it('me delega en AuthService cuando hay sub', async () => {
    const dto = Object.assign(new AuthUserDto(), {
      id: 'u1',
      mail: 'a@b.c',
      nombre: 'A',
      apellido: 'B',
      rol: 'ADMIN' as const,
    });
    authService.me.mockResolvedValue(dto);

    const result = await controller.me({
      user: { sub: 'u1', mail: 'a@b.c', rol: 'ADMIN' },
    } as never);

    expect(result).toBe(dto);
    expect(authService.me).toHaveBeenCalledWith('u1');
  });
});

describe('JwtAuthGuard', () => {
  it('rechaza request sin cookie', async () => {
    const guard = new JwtAuthGuard({
      verifyAsync: jest.fn(),
    } as unknown as JwtService);

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({ cookies: {} }),
        }),
      } as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
