import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { ChatbotGraphService } from './chatbot-graph.service';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { GeminiChatbotLlm } from './gemini-chatbot-llm';

/**
 * Módulo del asistente de documentación (LangGraph + corpus markdown).
 */
@Module({
  imports: [AuthModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotGraphService, GeminiChatbotLlm],
})
export class ChatbotModule {}
