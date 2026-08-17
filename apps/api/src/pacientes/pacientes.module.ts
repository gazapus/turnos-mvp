import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

/**
 * Módulo de pacientes (listado mínimo para filtros de agenda).
 */
@Module({
  imports: [AuthModule],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
