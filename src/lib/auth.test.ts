import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccountServerFn } from './auth.server';
import * as db from './db.server';

vi.mock('./db.server', () => ({
  getServerSidePrismaClient: vi.fn(),
}));

vi.mock('argon2', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$argon2id$hashed-password'),
    verify: vi.fn(),
  },
  hash: vi.fn().mockResolvedValue('$argon2id$hashed-password'),
  verify: vi.fn(),
}));

vi.mock('@tanstack/react-start/server', () => ({
  setCookie: vi.fn(),
  getCookie: vi.fn(),
  deleteCookie: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn().mockReturnValue({
    inputValidator: vi.fn().mockReturnThis(),
    handler: vi.fn((cb) => {
      const fn: any = (...args: any[]) => cb(...args);
      fn.handler = cb;
      return fn;
    }),
  }),
  createMiddleware: vi.fn().mockReturnValue({
    server: vi.fn().mockReturnThis(),
  }),
}));


vi.mock('./config.server', () => ({
  configService: {
    getAppConfig: () => ({
      sessionSecret: 'test-secret',
    }),
  },
}));

describe('auth.server - createAccountServerFn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hash password with argon2 before saving to database', async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation((args) => ({
          id: 'new-user-id',
          ...args.data,
        })),
      },
    };
    (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

    const input = {
      data: {
        email: 'test@example.com',
        name: 'Test user',
        password: 'Password123!',
      },
    };

    // Need to cast as any because we're calling it directly in the test
    const result = await (createAccountServerFn as any).handler(input);

    expect(result.success).toBe(true);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'test@example.com',
        name: 'Test user',
        password: '$argon2id$hashed-password',
      },
    });
  });

  it('should return error if email already exists', async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'existing-id' }),
      },
    };
    (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

    const input = {
      data: {
        email: 'existing@example.com',
        name: 'Test user',
        password: 'Password123!',
      },
    };

    const result = await (createAccountServerFn as any).handler(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('An account with this email already exists');
  });
});

describe('auth.server - signInServerFn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign in successfully with correct password', async () => {
    const { signInServerFn } = await import('./auth.server');
    const argon2 = await import('argon2');

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-id',
          email: 'test@example.com',
          password: '$argon2id$hashed-password',
        }),
      },
    };
    (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);
    (argon2.verify as any).mockResolvedValue(true);

    const input = {
      data: {
        email: 'test@example.com',
        password: 'Password123!',
      },
    };

    const result = await (signInServerFn as any).handler(input);

    expect(result.success).toBe(true);
    expect(argon2.verify).toHaveBeenCalledWith('$argon2id$hashed-password', 'Password123!');
  });

  it('should fail with incorrect password', async () => {
    const { signInServerFn } = await import('./auth.server');
    const argon2 = await import('argon2');

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'user-id',
          email: 'test@example.com',
          password: '$argon2id$hashed-password',
        }),
      },
    };
    (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);
    (argon2.verify as any).mockResolvedValue(false);

    const input = {
      data: {
        email: 'test@example.com',
        password: 'wrong-password',
      },
    };

    const result = await (signInServerFn as any).handler(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });

  it('should fail if user not found', async () => {
    const { signInServerFn } = await import('./auth.server');

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

    const input = {
      data: {
        email: 'nonexistent@example.com',
        password: 'any-password',
      },
    };

    const result = await (signInServerFn as any).handler(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid email or password');
  });
});
