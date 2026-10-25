import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../configs/constants';

export interface TokenPayload {
  sub: number;
}

export function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
    const sub = Number(payload.sub);
    return Number.isInteger(sub) ? { sub } : null;
  } catch {
    return null;
  }
}
