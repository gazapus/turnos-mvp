import { ApiProperty } from '@nestjs/swagger';
import type { ChatbotMensajeResponse } from '@turnos/shared-types';

/**
 * Respuesta de POST /api/chatbot/mensajes.
 */
export class ChatbotMensajeResponseDto implements ChatbotMensajeResponse {
  @ApiProperty({
    example: 'Confirmá el turno el mismo día desde la Lista o el detalle.',
  })
  respuesta!: string;

  @ApiProperty({
    description: 'false cuando se aplica el rechazo de dominio',
  })
  dentroDeDominio!: boolean;

  /**
   * Mapea el resultado del grafo al DTO público.
   *
   * @param result - Salida del servicio.
   * @returns DTO.
   */
  static fromResult(result: ChatbotMensajeResponse): ChatbotMensajeResponseDto {
    const dto = new ChatbotMensajeResponseDto();
    dto.respuesta = result.respuesta;
    dto.dentroDeDominio = result.dentroDeDominio;
    return dto;
  }
}
