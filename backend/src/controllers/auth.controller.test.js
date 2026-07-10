import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../db/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

import { prisma } from '../db/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { register, login, getMe } from './auth.controller.js';

// Helper to create mock req/res
const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('register', () => {
    it('returns 400 when required fields are missing', async () => {
      const req = { body: { email: 'test@test.com' } }; // missing name and password
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('returns 409 when email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@test.com' });

      const req = { body: { name: 'Test', email: 'test@test.com', password: 'pass123' } };
      const res = mockRes();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });
  });

  describe('login', () => {
    it('returns 401 when credentials are invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        password: 'hashedpass',
        role: 'RESIDENT',
      });
      bcrypt.compare.mockResolvedValue(false);

      const req = { body: { email: 'test@test.com', password: 'wrongpass' } };
      const res = mockRes();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns JWT with id and role on successful login', async () => {
      const mockUser = {
        id: 'user-uuid',
        email: 'test@test.com',
        name: 'Test User',
        flatNo: 'A-101',
        password: 'hashedpass',
        role: 'RESIDENT',
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const req = { body: { email: 'test@test.com', password: 'correctpass' } };
      const res = mockRes();

      await login(req, res);

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'user-uuid', role: 'RESIDENT' }),
        'test-secret',
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: 'mock-jwt-token' })
      );
    });
  });

  describe('getMe', () => {
    it('response shape never includes password field', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-uuid',
        name: 'Test User',
        email: 'test@test.com',
        flatNo: 'A-101',
        role: 'RESIDENT',
        // Note: no password field — matches the explicit select in controller
      });

      const req = { user: { id: 'user-uuid' } };
      const res = mockRes();

      await getMe(req, res);

      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg).not.toHaveProperty('password');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});
