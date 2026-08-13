import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_CONSTANTS } from './auth.constants';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Módulo de autenticación (login, logout, me, JwtAuthGuard).
 */
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-only-change-me',
      signOptions: { expiresIn: AUTH_CONSTANTS.JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
