import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { EspecialidadesController } from './especialidades.controller';
import { EspecialidadesService } from './especialidades.service';

/**
 * Módulo de especialidades (listado mínimo para filtros de agenda).
 */
@Module({
  imports: [AuthModule],
  controllers: [EspecialidadesController],
  providers: [EspecialidadesService],
  exports: [EspecialidadesService],
})
export class EspecialidadesModule {}
