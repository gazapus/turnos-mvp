import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import type { ChatbotMensajeRequest } from '@turnos/shared-types';
import {
  CHATBOT_MENSAJE_MAX_LENGTH,
  CHATBOT_MENSAJE_VACIO,
} from '../chatbot.constants';

/**
 * Body de POST /api/chatbot/mensajes.
 */
export class EnviarMensajeDto implements ChatbotMensajeRequest {
  @ApiProperty({
    example: '¿Cómo confirmo un turno?',
    maxLength: CHATBOT_MENSAJE_MAX_LENGTH,
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty({ message: CHATBOT_MENSAJE_VACIO })
  @MaxLength(CHATBOT_MENSAJE_MAX_LENGTH)
  mensaje!: string;
}
