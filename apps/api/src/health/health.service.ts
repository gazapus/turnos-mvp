import { Injectable } from '@nestjs/common';
import { prisma } from '@turnos/database';
import { DatabaseHealthStatus, HealthResponseDto } from './dto';

/**
 * Servicio de health check con verificación real de PostgreSQL.
 */
@Injectable()
export class HealthService {
  /**
   * Ejecuta el chequeo de salud del API y la base de datos.
   *
   * @returns DTO con el estado del servicio y la conexión a DB.
   */
  async check(): Promise<HealthResponseDto> {
    let database = DatabaseHealthStatus.ERROR;

    try {
      await prisma.$queryRaw`SELECT 1`;
      database = DatabaseHealthStatus.CONNECTED;
    } catch {
      database = DatabaseHealthStatus.ERROR;
    }

    return HealthResponseDto.fromCheck({
      status: database === DatabaseHealthStatus.CONNECTED ? 'ok' : 'degraded',
      service: 'turnos-api',
      database,
      timestamp: new Date().toISOString(),
    });
  }
}
