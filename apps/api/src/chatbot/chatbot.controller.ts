import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AUTH_COOKIE_NAME } from '@turnos/shared-types';
import { AuthenticatedRequest, JwtAuthGuard, type JwtPayload } from '../auth';
import { ChatbotService } from './chatbot.service';
import { ChatbotMensajeResponseDto, EnviarMensajeDto } from './dto';

/**
 * Controlador REST del asistente de documentación.
 */
@ApiTags('chatbot')
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  /**
   * Envía un mensaje al asistente de ayuda.
   *
   * @param dto - Pregunta.
   * @param req - Request autenticada.
   * @returns Respuesta del asistente.
   */
  @Post('mensajes')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiCookieAuth(AUTH_COOKIE_NAME)
  @ApiOperation({ summary: 'Enviar mensaje al chatbot de ayuda' })
  @ApiResponse({ status: 200, type: ChatbotMensajeResponseDto })
  @ApiResponse({ status: 400, description: 'Mensaje inválido' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  enviar(
    @Body() dto: EnviarMensajeDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ChatbotMensajeResponseDto> {
    return this.chatbotService
      .enviar(dto.mensaje, this.requireUser(req))
      .then((result) => ChatbotMensajeResponseDto.fromResult(result));
  }

  /**
   * Extrae el usuario del JWT o lanza 401.
   *
   * @param req - Request autenticada.
   * @returns Payload JWT.
   */
  private requireUser(req: AuthenticatedRequest): JwtPayload {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException('No autorizado');
    }
    return user;
  }
}
