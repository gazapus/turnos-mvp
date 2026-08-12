import { ApiProperty } from '@nestjs/swagger';

/**
 * Estado de conexión de la base de datos reportado por el health check.
 */
export enum DatabaseHealthStatus {
  CONNECTED = 'connected',
  ERROR = 'error',
}

/**
 * DTO de respuesta del endpoint de health check.
 */
export class HealthResponseDto {
  @ApiProperty({ example: 'ok', description: 'Estado general del servicio' })
  status!: string;

  @ApiProperty({ example: 'turnos-api', description: 'Nombre del servicio' })
  service!: string;

  @ApiProperty({
    enum: DatabaseHealthStatus,
    example: DatabaseHealthStatus.CONNECTED,
    description: 'Estado de la conexión a PostgreSQL',
  })
  database!: DatabaseHealthStatus;

  @ApiProperty({
    example: '2026-08-11T22:00:00.000Z',
    description: 'Timestamp ISO del chequeo',
  })
  timestamp!: string;

  /**
   * Mapea el resultado interno del servicio al DTO de respuesta.
   *
   * @param data Resultado del health check.
   * @returns DTO tipado para la respuesta HTTP.
   */
  static fromCheck(data: {
    status: string;
    service: string;
    database: DatabaseHealthStatus;
    timestamp: string;
  }): HealthResponseDto {
    const dto = new HealthResponseDto();
    dto.status = data.status;
    dto.service = data.service;
    dto.database = data.database;
    dto.timestamp = data.timestamp;
    return dto;
  }
}
