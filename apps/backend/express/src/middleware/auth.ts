import type { Request, RequestHandler } from 'express';
import { readToken } from '../utils/jwt';

export type AuthRequest = Request & {
  userId?: number;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Token ')
    ? authHeader.slice('Token '.length)
    : '';

  if (!token) {
    return res.status(401).json({
      errors: {
        body: ['Authorization token is required'],
      },
    });
  }

  try {
    const userId = readToken(token);

    if (!userId) {
      return res.status(401).json({
        errors: {
          body: ['Authorization token is invalid'],
        },
      });
    }

    (req as AuthRequest).userId = userId;
    return next();
  } catch {
    return res.status(401).json({
      errors: {
        body: ['Authorization token is invalid'],
      },
    });
  }
};
