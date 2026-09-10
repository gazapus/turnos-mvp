import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import type { ChatbotMensajeResponse } from '@turnos/shared-types';
import type { JwtPayload } from '../auth';
import { ChatbotGraphService } from './chatbot-graph.service';
import { CHATBOT_LLM_ERROR } from './chatbot.constants';

/**
 * Orquesta el envío de mensajes al grafo de documentación.
 */
@Injectable()
export class ChatbotService {
  constructor(
    private readonly graph: ChatbotGraphService,
    @InjectPinoLogger(ChatbotService.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Invoca el asistente para un usuario autenticado.
   *
   * @param mensaje - Texto ya validado.
   * @param user - JWT.
   * @returns Respuesta pública.
   */
  async enviar(
    mensaje: string,
    user: JwtPayload | undefined,
  ): Promise<ChatbotMensajeResponse> {
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }

    try {
      return await this.graph.invoke(mensaje, user.sub);
    } catch (error: unknown) {
      this.logger.error(
        { err: error, userId: user.sub },
        'Fallo al invocar el chatbot',
      );
      throw new BadGatewayException(CHATBOT_LLM_ERROR);
    }
  }
}
