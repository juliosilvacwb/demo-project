import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as db from './db.server';
import { createMovementServerFn, deleteMovementServerFn, getMovementsServerFn } from './movements.server';


vi.mock('@/lib/config.server', () => ({
  env: {
    DATABASE_URL: 'postgresql://mock',
    COOKIE_SECRET: 'mock_secret_for_testing_purposes_only',
  },
}));

vi.mock('./db.server', () => ({
  getServerSidePrismaClient: vi.fn(),
}));

vi.mock("@tanstack/react-start", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-start")>();
  return {
    ...actual,
    createServerFn: vi.fn().mockImplementation((options) => ({
      inputValidator: vi.fn().mockReturnThis(),
      handler: vi.fn((cb) => {
        const fn: any = (...args: any[]) => cb(...args);
        fn.handler = cb;
        return fn;
      }),
      middleware: vi.fn().mockReturnThis(),
    })),
    createMiddleware: vi.fn().mockReturnValue({
      server: vi.fn().mockReturnThis(),
    }),
  };
});

describe('movements.server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createMovementServerFn', () => {
    it('should successfully create a movement with default isBodyWeight (false)', async () => {
      const mockMovement = { id: 'mov-1', name: 'Pushups', isBodyWeight: false };
      const mockPrisma = {
        movement: {
          create: vi.fn().mockResolvedValue(mockMovement),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        data: { name: 'Pushups', isBodyWeight: false },
      };

      const result = await (createMovementServerFn as any).handler(input);

      expect(result.success).toBe(true);
      expect(result.movement).toEqual(mockMovement);
      expect(mockPrisma.movement.create).toHaveBeenCalledWith({
        data: { name: 'Pushups', isBodyWeight: false },
      });
    });

    it('should successfully create a body-weight movement', async () => {
      const mockMovement = { id: 'mov-2', name: 'Air Squats', isBodyWeight: true };
      const mockPrisma = {
        movement: {
          create: vi.fn().mockResolvedValue(mockMovement),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = {
        data: { name: 'Air Squats', isBodyWeight: true },
      };

      const result = await (createMovementServerFn as any).handler(input);

      expect(result.success).toBe(true);
      expect(result.movement).toEqual(mockMovement);
      expect(mockPrisma.movement.create).toHaveBeenCalledWith({
        data: { name: 'Air Squats', isBodyWeight: true },
      });
    });
  });

  describe('getMovementsServerFn', () => {
    it('should return movements that are not archived ordered by name', async () => {
      const mockMovements = [
        { id: '1', name: 'Bench Press', isBodyWeight: false, isArchived: false },
        { id: '2', name: 'Squats', isBodyWeight: false, isArchived: false },
      ];
      const mockPrisma = {
        movement: {
          findMany: vi.fn().mockResolvedValue(mockMovements),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const result = await (getMovementsServerFn as any).handler();

      expect(result).toEqual(mockMovements);
      expect(mockPrisma.movement.findMany).toHaveBeenCalledWith({
        where: { isArchived: false },
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('deleteMovementServerFn', () => {
    it('should hard delete a movement if it has no associated sets', async () => {
      const mockPrisma = {
        set: {
          count: vi.fn().mockResolvedValue(0),
        },
        movement: {
          delete: vi.fn().mockResolvedValue({ id: 'mov-1' }),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = { data: 'mov-1' };
      const result = await (deleteMovementServerFn as any).handler(input);

      expect(result.success).toBe(true);
      expect(mockPrisma.set.count).toHaveBeenCalledWith({ where: { movementId: 'mov-1' } });
      expect(mockPrisma.movement.delete).toHaveBeenCalledWith({ where: { id: 'mov-1' } });
    });

    it('should soft delete (archive) a movement if it has associated sets', async () => {
      const mockPrisma = {
        set: {
          count: vi.fn().mockResolvedValue(5),
        },
        movement: {
          update: vi.fn().mockResolvedValue({ id: 'mov-1', isArchived: true }),
        },
      };
      (db.getServerSidePrismaClient as any).mockResolvedValue(mockPrisma);

      const input = { data: 'mov-1' };
      const result = await (deleteMovementServerFn as any).handler(input);

      expect(result.success).toBe(true);
      expect(mockPrisma.set.count).toHaveBeenCalledWith({ where: { movementId: 'mov-1' } });
      expect(mockPrisma.movement.update).toHaveBeenCalledWith({
        where: { id: 'mov-1' },
        data: { isArchived: true },
      });
    });
  });
});
