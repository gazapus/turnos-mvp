import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { AppointmentsModule } from './appointments';
import { AuthModule } from './auth';
import { ConsultoriosModule } from './consultorios';
import { AllExceptionsFilter } from './common';
import { EspecialidadesModule } from './especialidades';
import { HealthModule } from './health';
import { PacientesModule } from './pacientes';
import { UsersModule } from './users';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
      },
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    EspecialidadesModule,
    PacientesModule,
    AppointmentsModule,
    ConsultoriosModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
