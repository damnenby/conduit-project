import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

/** Converts Nest exceptions to the OpenAPI error response shape. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (payload && typeof payload === 'object' && 'errors' in payload) {
        return response.status(status).json(payload);
      }

      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as { message?: unknown }).message ?? 'Error');
      const body = Array.isArray(message) ? message.map(String) : [String(message)];
      return response.status(status).json({ errors: { body } });
    }

    console.error(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      errors: { body: ['Internal server error'] },
    });
  }
}
