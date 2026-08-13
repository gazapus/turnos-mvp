import { ApiProperty } from '@nestjs/swagger';
import type { AuthRole, AuthUser, LoginResponse } from '@turnos/shared-types';
import { AUTH_ROLES } from '@turnos/shared-types';
import type { Usuario } from '@turnos/database';

/**
 * Datos públicos del usuario autenticado (Response DTO).
 */
export class AuthUserDto implements AuthUser {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'admin@clinica.local' })
  mail!: string;

  @ApiProperty({ example: 'Admin' })
  nombre!: string;

  @ApiProperty({ example: 'Sistema' })
  apellido!: string;

  @ApiProperty({ enum: AUTH_ROLES })
  rol!: AuthRole;

  /**
   * Mapea una entidad Usuario de Prisma a AuthUserDto.
   *
   * @param usuario - Entidad Prisma.
   * @returns DTO público sin secretos.
   */
  static fromEntity(usuario: Usuario): AuthUserDto {
    const dto = new AuthUserDto();
    dto.id = usuario.id;
    dto.mail = usuario.mail;
    dto.nombre = usuario.nombre;
    dto.apellido = usuario.apellido;
    dto.rol = usuario.rol;
    return dto;
  }
}

/**
 * Respuesta de login exitoso.
 */
export class LoginResponseDto implements LoginResponse {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  /**
   * Construye la respuesta de login a partir del usuario autenticado.
   *
   * @param usuario - Entidad Prisma del usuario.
   * @returns LoginResponseDto.
   */
  static fromEntity(usuario: Usuario): LoginResponseDto {
    const dto = new LoginResponseDto();
    dto.user = AuthUserDto.fromEntity(usuario);
    return dto;
  }
}
