import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  retryAfterSeconds?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const body = exceptionResponse as ErrorResponseBody;
        if (status === HttpStatus.TOO_MANY_REQUESTS) {
          response.status(status).json({
            statusCode: status,
            message: 'Too many requests',
            ...(typeof body.retryAfterSeconds === 'number'
              ? { retryAfterSeconds: body.retryAfterSeconds }
              : {}),
          });
          return;
        }

        response.status(status).json({
          statusCode: status,
          message: body.message ?? exception.message,
          error: body.error,
        });
        return;
      }

      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        response.status(status).json({
          statusCode: status,
          message: 'Too many requests',
        });
        return;
      }

      response.status(status).json({
        statusCode: status,
        message: exceptionResponse,
      });
      return;
    }

    this.logger.error('Unhandled backend exception', exception);

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    });
  }
}
