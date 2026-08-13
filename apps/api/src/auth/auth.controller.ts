import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AuthUserDto, LoginDto, LoginResponseDto } from './dto';
import { AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard';

/**
 * Controlador REST de autenticación (login, logout, me).
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Inicia sesión y setea cookie httpOnly con JWT.
   *
   * @param dto - Credenciales.
   * @param req - Request (IP).
   * @param res - Response (Set-Cookie).
   * @returns LoginResponseDto.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 403, description: 'Cuenta temporalmente bloqueada' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const ip = this.resolveClientIp(req);
    const { response, accessToken } = await this.authService.login(dto, ip);
    this.setSessionCookie(res, accessToken);
    return response;
  }

  /**
   * Cierra sesión limpiando la cookie httpOnly.
   *
   * @param res - Response.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 204, description: 'Sesión cerrada' })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.clearSessionCookie(res);
  }

  /**
   * Devuelve el usuario de la sesión actual.
   *
   * @param req - Request autenticada.
   * @returns AuthUserDto.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Obtener sesión actual' })
  @ApiResponse({ status: 200, type: AuthUserDto })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  me(@Req() req: AuthenticatedRequest): Promise<AuthUserDto> {
    const userId = req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('No autorizado');
    }
    return this.authService.me(userId);
  }

  /**
   * Resuelve la IP del cliente (proxy-aware).
   *
   * @param req - Request Express.
   * @returns IP como string.
   */
  private resolveClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
      return forwarded.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    }
    return req.ip ?? req.socket.remoteAddress ?? 'unknown';
  }

  /**
   * Setea la cookie de sesión JWT.
   *
   * @param res - Response Express.
   * @param token - JWT firmado.
   */
  private setSessionCookie(res: Response, token: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });
  }

  /**
   * Elimina la cookie de sesión.
   *
   * @param res - Response Express.
   */
  private clearSessionCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
    });
  }
}
