import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

export const createToken = (userId: number) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
