import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { LoginRequest } from '@turnos/shared-types';

/**
 * DTO de entrada para POST /api/auth/login.
 */
export class LoginDto implements LoginRequest {
  @ApiProperty({
    description: 'Mail del usuario',
    example: 'admin@clinica.local',
  })
  @IsEmail({}, { message: 'Mail inválido' })
  mail!: string;

  @ApiProperty({
    description: 'Contraseña en texto plano',
    example: 'Admin123!@#$',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Contraseña requerida' })
  password!: string;
}
