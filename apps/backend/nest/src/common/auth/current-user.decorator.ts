import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Reads the user id that the auth guard attached to the request.
 * Undefined on optionally-authenticated routes without a valid token.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number | undefined => {
    const request = context
      .switchToHttp()
      .getRequest<Request & { userId?: number }>();
    return request.userId;
  },
);
