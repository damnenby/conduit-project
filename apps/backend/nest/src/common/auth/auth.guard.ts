import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from './token.service';

type AuthedRequest = Request & { userId?: number };

/**
 * Rejects requests without a valid `Authorization: Token <jwt>` header (401).
 * On success it attaches the user id to the request. This is the NestJS
 * equivalent of the old Express `requireAuth` middleware.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const authHeader = request.header('authorization');
    const token = authHeader?.startsWith('Token ')
      ? authHeader.slice('Token '.length)
      : '';

    if (!token) {
      throw new HttpException(
        { errors: { body: ['Authorization token is required'] } },
        HttpStatus.UNAUTHORIZED,
      );
    }

    let userId: number | null;
    try {
      userId = this.tokenService.readToken(token);
    } catch {
      userId = null;
    }

    if (!userId) {
      throw new HttpException(
        { errors: { body: ['Authorization token is invalid'] } },
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.userId = userId;
    return true;
  }
}
