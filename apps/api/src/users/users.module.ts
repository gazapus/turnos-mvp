import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Módulo de usuarios (listado mínimo para filtros de agenda).
 */
@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
