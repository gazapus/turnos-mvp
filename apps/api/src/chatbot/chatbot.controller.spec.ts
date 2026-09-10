import {
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import type { Server } from 'node:http';
import request from 'supertest';
import { JwtAuthGuard } from '../auth';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { CHATBOT_REFUSAL_MESSAGE } from './chatbot.constants';
import type { JwtPayload } from '../auth';

jest.mock('@turnos/database', () => ({
  prisma: {},
}));

const medico: JwtPayload = {
  sub: 'm1',
  mail: 'm@x.c',
  rol: 'MEDICO',
};

const recepcionista: JwtPayload = {
  sub: 'r1',
  mail: 'r@x.c',
  rol: 'RECEPCIONISTA',
};

/**
 * App Nest mínima del chatbot con guard y servicio mockeados.
 *
 * @param user - Usuario a adjuntar, o null para 401.
 * @param service - Mock del servicio.
 * @returns App HTTP.
 */
async function createApp(
  user: JwtPayload | null,
  service: { enviar: jest.Mock },
): Promise<INestApplication> {
  const module: TestingModule = await Test.createTestingModule({
    controllers: [ChatbotController],
    providers: [
      { provide: ChatbotService, useValue: service },
      { provide: JwtService, useValue: { verifyAsync: jest.fn() } },
      JwtAuthGuard,
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (context: {
        switchToHttp: () => {
          getRequest: () => { user?: JwtPayload };
        };
      }) => {
        if (!user) {
          throw new UnauthorizedException('No autorizado');
        }
        const req = context.switchToHttp().getRequest();
        req.user = user;
        return true;
      },
    })
    .compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.init();
  return app;
}

/**
 * Cliente HTTP de prueba.
 *
 * @param app - App Nest.
 * @returns SuperTest.
 */
function http(app: INestApplication) {
  return request(app.getHttpServer() as Server);
}

describe('ChatbotController', () => {
  const service = { enviar: jest.fn() };

  afterEach(() => {
    service.enviar.mockReset();
  });

  it('responde 401 sin sesión', async () => {
    const app = await createApp(null, service);
    await http(app)
      .post('/chatbot/mensajes')
      .send({ mensaje: 'hola' })
      .expect(401);
    expect(service.enviar).not.toHaveBeenCalled();
    await app.close();
  });

  it('responde 400 si el mensaje está vacío', async () => {
    const app = await createApp(medico, service);
    await http(app)
      .post('/chatbot/mensajes')
      .send({ mensaje: '   ' })
      .expect(400);
    expect(service.enviar).not.toHaveBeenCalled();
    await app.close();
  });

  it('acepta un médico in-domain', async () => {
    service.enviar.mockResolvedValue({
      respuesta: 'Confirmá el mismo día.',
      dentroDeDominio: true,
    });
    const app = await createApp(medico, service);
    const res = await http(app)
      .post('/chatbot/mensajes')
      .send({ mensaje: 'cómo confirmo un turno' })
      .expect(200);
    expect(res.body).toEqual({
      respuesta: 'Confirmá el mismo día.',
      dentroDeDominio: true,
    });
    expect(service.enviar).toHaveBeenCalledWith(
      'cómo confirmo un turno',
      medico,
    );
    await app.close();
  });

  it('acepta un recepcionista off-domain', async () => {
    service.enviar.mockResolvedValue({
      respuesta: CHATBOT_REFUSAL_MESSAGE,
      dentroDeDominio: false,
    });
    const app = await createApp(recepcionista, service);
    const res = await http(app)
      .post('/chatbot/mensajes')
      .send({ mensaje: '¿qué hora es en Tokio?' })
      .expect(200);
    expect(res.body).toEqual({
      respuesta: CHATBOT_REFUSAL_MESSAGE,
      dentroDeDominio: false,
    });
    await app.close();
  });
});
