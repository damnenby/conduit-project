import { HttpException } from '@nestjs/common';

/**
 * Builds an HttpException using the Conduit error shape so every error response
 * looks like `{ "errors": { "body": ["message", ...] } }`.
 *
 * Use as `throw apiError([...], status)` so TypeScript narrows control flow the
 * same way the old Express handlers did with `return res.status(...)`.
 */
export const apiError = (messages: string[], status: number): HttpException => {
  return new HttpException({ errors: { body: messages } }, status);
};
