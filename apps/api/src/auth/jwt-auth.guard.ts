import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE_NAME, AUTH_ERROR_CODES } from '@turnos/shared-types';
import type { Request } from 'express';
import type { JwtPayload } from './auth.service';

/**
 * Request Express con usuario JWT adjunto.
 */
export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

/**
 * Guard JWT que lee el token desde la cookie httpOnly de sesión.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Valida la cookie de sesión y adjunta el payload a la request.
   *
   * @param context - Contexto de ejecución Nest.
   * @returns true si el JWT es válido.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException({
        message: 'No autorizado',
        error: AUTH_ERROR_CODES.UNAUTHORIZED,
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException({
        message: 'No autorizado',
        error: AUTH_ERROR_CODES.UNAUTHORIZED,
      });
    }
  }

  /**
   * Extrae el JWT de la cookie httpOnly.
   *
   * @param request - Request Express.
   * @returns Token o undefined.
   */
  private extractToken(request: AuthenticatedRequest): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const fromCookie = cookies?.[AUTH_COOKIE_NAME];
    if (typeof fromCookie === 'string' && fromCookie.length > 0) {
      return fromCookie;
    }
    return undefined;
  }
}
