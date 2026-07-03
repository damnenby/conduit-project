import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  createToken(userId: number): string {
    return this.jwtService.sign({ userId });
  }

  readToken(token: string): number | null {
    const payload = this.jwtService.verify(token);

    if (typeof payload === 'string' || typeof payload.userId !== 'number') {
      return null;
    }

    return payload.userId;
  }
}
