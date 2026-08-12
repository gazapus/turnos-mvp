import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Formato de error HTTP expuesto al frontend.
 */
export type ApiErrorResponse = {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
};

/**
 * Filtro global que normaliza todas las excepciones al shape de error de la API.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = 'Error interno del servidor';
    let error = HttpStatus[statusCode] ?? 'Error';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      exceptionResponse !== null &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const rawMessage = exceptionResponse.message;
      message = Array.isArray(rawMessage)
        ? rawMessage.join(', ')
        : String(rawMessage);
      if ('error' in exceptionResponse && exceptionResponse.error) {
        error =
          typeof exceptionResponse.error === 'string'
            ? exceptionResponse.error
            : JSON.stringify(exceptionResponse.error);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const body: ApiErrorResponse = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
