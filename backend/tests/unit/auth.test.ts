import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, comparePasswords, generateTokens, verifyToken } from '../../src/infrastructure/auth/jwt';

describe('Auth Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password', async () => {
      const hash = await hashPassword('password123');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('password123');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should verify password correctly', async () => {
      const hash = await hashPassword('password123');
      const isValid = await comparePasswords('password123', hash);
      expect(isValid).toBe(true);
    });

    it('should reject wrong password', async () => {
      const hash = await hashPassword('password123');
      const isValid = await comparePasswords('wrongpassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const payload = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      role: 'ADMIN',
    };

    it('should generate token pair', () => {
      const tokens = generateTokens(payload);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });

    it('should verify valid token', () => {
      const tokens = generateTokens(payload);
      const decoded = verifyToken(tokens.accessToken);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow();
    });
  });
});
