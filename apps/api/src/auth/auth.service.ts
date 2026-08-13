import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { prisma } from '@turnos/database';
import { AUTH_ERROR_CODES } from '@turnos/shared-types';
import * as argon2 from 'argon2';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AUTH_CONSTANTS } from './auth.constants';
import { AuthUserDto, LoginDto, LoginResponseDto } from './dto';

/**
 * Payload firmado en el JWT de sesión.
 */
export type JwtPayload = {
  sub: string;
  mail: string;
  rol: string;
};

/**
 * Servicio de autenticación: login Argon2, bloqueos mail+IP y sesión JWT.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Autentica mail/contraseña, aplica rate-limit y emite JWT.
   *
   * @param dto - Credenciales.
   * @param ip - IP del cliente.
   * @returns LoginResponseDto y token JWT.
   */
  async login(
    dto: LoginDto,
    ip: string,
  ): Promise<{ response: LoginResponseDto; accessToken: string }> {
    const mail = dto.mail.trim().toLowerCase();
    const clientIp = ip || 'unknown';

    await this.assertNotLocked(mail, clientIp);

    const usuario = await prisma.usuario.findUnique({ where: { mail } });
    const passwordOk =
      usuario !== null &&
      usuario.activo &&
      (await argon2.verify(usuario.passwordHash, dto.password));

    if (!usuario || !usuario.activo || !passwordOk) {
      await this.registerFailedAttempt(mail, clientIp);
      throw new UnauthorizedException({
        message: AUTH_CONSTANTS.GENERIC_CREDENTIALS_MESSAGE,
        error: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      });
    }

    await prisma.loginIntento.create({
      data: { mail, ip: clientIp, exito: true },
    });

    const payload: JwtPayload = {
      sub: usuario.id,
      mail: usuario.mail,
      rol: usuario.rol,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.info({ userId: usuario.id, rol: usuario.rol }, 'Login exitoso');

    return {
      response: LoginResponseDto.fromEntity(usuario),
      accessToken,
    };
  }

  /**
   * Resuelve el usuario autenticado a partir del payload JWT.
   *
   * @param userId - ID del usuario (sub del JWT).
   * @returns AuthUserDto.
   */
  async me(userId: string): Promise<AuthUserDto> {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException({
        message: 'No autorizado',
        error: AUTH_ERROR_CODES.UNAUTHORIZED,
      });
    }

    return AuthUserDto.fromEntity(usuario);
  }

  /**
   * Valida que no exista un bloqueo activo para mail + IP.
   *
   * @param mail - Mail normalizado.
   * @param ip - IP del cliente.
   */
  private async assertNotLocked(mail: string, ip: string): Promise<void> {
    const now = new Date();
    const activeLock = await prisma.loginBloqueo.findFirst({
      where: {
        mail,
        ip,
        bloqueadoHasta: { gt: now },
      },
      orderBy: { bloqueadoHasta: 'desc' },
    });

    if (activeLock) {
      throw new ForbiddenException({
        message: AUTH_CONSTANTS.LOCKED_MESSAGE,
        error: AUTH_ERROR_CODES.ACCOUNT_LOCKED,
      });
    }
  }

  /**
   * Registra un intento fallido y crea bloqueo al alcanzar el máximo.
   *
   * @param mail - Mail normalizado.
   * @param ip - IP del cliente.
   */
  private async registerFailedAttempt(mail: string, ip: string): Promise<void> {
    await prisma.loginIntento.create({
      data: { mail, ip, exito: false },
    });

    const windowStart = new Date(Date.now() - AUTH_CONSTANTS.LOCK_DURATION_MS);

    const lastSuccess = await prisma.loginIntento.findFirst({
      where: { mail, ip, exito: true, createdAt: { gte: windowStart } },
      orderBy: { createdAt: 'desc' },
    });

    const failedSince = lastSuccess?.createdAt ?? windowStart;

    const failedCount = await prisma.loginIntento.count({
      where: {
        mail,
        ip,
        exito: false,
        createdAt: { gt: failedSince },
      },
    });

    if (failedCount >= AUTH_CONSTANTS.MAX_FAILED_ATTEMPTS) {
      const bloqueadoHasta = new Date(
        Date.now() + AUTH_CONSTANTS.LOCK_DURATION_MS,
      );
      await prisma.loginBloqueo.create({
        data: { mail, ip, bloqueadoHasta },
      });
      this.logger.warn({ mail, ip, failedCount }, 'Login bloqueado');
    }
  }
}
