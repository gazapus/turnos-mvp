import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { ConsultoriosController } from './consultorios.controller';
import { ConsultoriosService } from './consultorios.service';

/**
 * Módulo de catálogo y asignación de consultorios.
 */
@Module({
  imports: [AuthModule],
  controllers: [ConsultoriosController],
  providers: [ConsultoriosService],
  exports: [ConsultoriosService],
})
export class ConsultoriosModule {}
