import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponseDto } from './dto';
import { HealthService } from './health.service';

/**
 * Controlador de health check para monitoreo del API.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * Devuelve el estado del servicio y la conexión a la base de datos.
   *
   * @returns DTO de health check.
   */
  @Get()
  @ApiOperation({ summary: 'Health check del API y la base de datos' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  getHealth(): Promise<HealthResponseDto> {
    return this.healthService.check();
  }
}
