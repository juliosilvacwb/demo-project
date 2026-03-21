import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addBodyWeightFn, BodyWeightSchema, getBodyWeightsFn } from './body-metrics.server';
import * as db from './db.server';

vi.mock('./db.server', () => ({
  getServerSidePrismaClient: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn().mockImplementation(() => ({
    middleware: vi.fn().mockReturnThis(),
    inputValidator: vi.fn().mockReturnThis(),
    handler: vi.fn((cb) => {
      const fn: any = (...args: any[]) => cb(...args);
      fn.handler = cb;
      return fn;
    }),
  })),
}));

vi.mock('./auth.server', () => ({
  authMiddleware: {
    server: vi.fn().mockReturnThis(),
  },
}));

describe('body-metrics.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BodyWeightSchema', () => {
    it('should validate weights between 0 and 1500', () => {
      expect(BodyWeightSchema.safeParse({ weight: 70.5 }).success).toBe(true);
      expect(BodyWeightSchema.safeParse({ weight: 1500 }).success).toBe(true);
      expect(BodyWeightSchema.safeParse({ weight: 0.1 }).success).toBe(true);

      expect(BodyWeightSchema.safeParse({ weight: 0 }).success).toBe(false);
      expect(BodyWeightSchema.safeParse({ weight: -10 }).success).toBe(false);
      expect(BodyWeightSchema.safeParse({ weight: 1501 }).success).toBe(false);
      expect(BodyWeightSchema.safeParse({ weight: 'not-a-number' }).success).toBe(false);
    });

    it('should default measuredAt to the current date', () => {
      const result = BodyWeightSchema.parse({ weight: 180 });
      expect(result.measuredAt).toBeInstanceOf(Date);
      expect(Math.abs(result.measuredAt.getTime() - Date.now())).toBeLessThan(1000);
    });
  });

  describe('addBodyWeightFn', () => {
    it('should successfully add a body weight entry', async () => {
      const mockPrisma = {
        bodyWeight: {
          create: vi.fn().mockResolvedValue({
            id: 'weight-1',
            userId: 'user-1',
            weight: 180.5,
            measuredAt: new Date('2024-03-21T10:00:00Z'),
          }),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        context: { user: { id: 'user-1' } },
        data: {
          weight: 180.5,
          measuredAt: new Date('2024-03-21T10:00:00Z'),
        },
      };

      const result = await (addBodyWeightFn as any).handler(input);

      expect(result.success).toBe(true);
      expect(mockPrisma.bodyWeight.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          weight: 180.5,
          measuredAt: input.data.measuredAt,
        },
      });
    });
  });

  describe('getBodyWeightsFn', () => {
    it('should return body weight entries in descending order', async () => {
      const mockEntries = [
        { id: '2', weight: 181, measuredAt: new Date('2024-03-22') },
        { id: '1', weight: 180, measuredAt: new Date('2024-03-21') },
      ];
      const mockPrisma = {
        bodyWeight: {
          findMany: vi.fn().mockResolvedValue(mockEntries),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        context: { user: { id: 'user-1' } },
      };

      const result = await (getBodyWeightsFn as any).handler(input);

      expect(result).toEqual(mockEntries);
      expect(mockPrisma.bodyWeight.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { measuredAt: 'desc' },
      });
    });
  });
});
