import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Normalizes every error to the Conduit error shape `{ errors: { body: [...] } }`
 * and logs unexpected errors, matching the behavior of the old Express handler.
 */
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
