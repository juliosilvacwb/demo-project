import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMovementHistoryStatsServerFn } from './stats.server';
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

describe('stats.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMovementHistoryStatsServerFn', () => {
    it('should return aggregated stats for a movement', async () => {
      const mockResult = [
        {
          date: new Date('2024-03-20T10:00:00Z'),
          maxWeight: 110,
          totalReps: 18,
          totalVolume: 1880,
        },
        {
          date: new Date('2024-03-22T10:00:00Z'),
          maxWeight: 120,
          totalReps: 15,
          totalVolume: 1750,
        },
      ];

      const mockPrisma = {
        $queryRaw: vi.fn().mockResolvedValue(mockResult),
      };

      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        context: { user: { id: 'user-1' } },
        data: { movementId: 'mov-1' },
      };

      const result = await (getMovementHistoryStatsServerFn as any).handler(input);

      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].maxWeight).toBe(110);
      expect(result[1].maxWeight).toBe(120);
    });

    it('should return empty array if no workouts found', async () => {
      const mockPrisma = {
        $queryRaw: vi.fn().mockResolvedValue([]),
      };

      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        context: { user: { id: 'user-1' } },
        data: { movementId: 'mov-2' },
      };

      const result = await (getMovementHistoryStatsServerFn as any).handler(input);

      expect(result).toEqual([]);
    });
  });
});
