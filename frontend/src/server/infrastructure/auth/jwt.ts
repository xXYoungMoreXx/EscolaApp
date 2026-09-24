import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../../shared/errors';
import { logger } from '../../shared/logger';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'default-secret') {
    if (process.env.NODE_ENV === 'production' && process.env.VERCEL) {
      throw new Error('JWT_SECRET não configurado — defina a variável de ambiente JWT_SECRET');
    }
    return 'dev-only-secret';
  }
  return secret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(payload: TokenPayload): TokenPair {
  const accessToken = jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN } as any);
  const refreshToken = jwt.sign({ userId: payload.userId }, getSecret(), { expiresIn: '7d' } as any);
  return { accessToken, refreshToken };
}

export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, getSecret()) as TokenPayload;
    return decoded;
  } catch (error) {
    logger.warn({ error }, 'Invalid token');
    throw new UnauthorizedError('Token inválido ou expirado');
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const decoded = jwt.verify(token, getSecret()) as { userId: string };
    return decoded;
  } catch (error) {
    throw new UnauthorizedError('Refresh token inválido');
  }
}
