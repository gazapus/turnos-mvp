import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { WaitingRoomController } from './waiting-room.controller';
import { WaitingRoomEvents } from './waiting-room.events';
import { WaitingRoomService } from './waiting-room.service';

/**
 * Snapshot y SSE de avisos de sala de espera.
 */
@Module({
  imports: [AuthModule],
  controllers: [WaitingRoomController],
  providers: [WaitingRoomService, WaitingRoomEvents],
  exports: [WaitingRoomEvents],
})
export class WaitingRoomModule {}
