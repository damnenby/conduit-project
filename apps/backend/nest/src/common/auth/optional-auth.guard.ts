import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { TokenService } from './token.service';

type AuthedRequest = Request & { userId?: number };

/** Reads optional token authentication and allows anonymous requests. */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const authHeader = request.header('authorization');
    const token = authHeader?.startsWith('Token ')
      ? authHeader.slice('Token '.length)
      : '';

    if (!token) {
      return true;
    }

    try {
      const userId = this.tokenService.readToken(token);
      if (userId) {
        request.userId = userId;
      }
    } catch {
      // Public routes still work when there is no valid login.
    }

    return true;
  }
}
