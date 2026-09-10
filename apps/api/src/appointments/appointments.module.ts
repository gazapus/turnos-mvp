import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { WaitingRoomModule } from '../waiting-room';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

/**
 * Módulo de turnos (listado paginado para agenda).
 */
@Module({
  imports: [AuthModule, WaitingRoomModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
