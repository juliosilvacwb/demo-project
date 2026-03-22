import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMovementServerFn, getMovementsServerFn, MovementSchema } from './movements.server';
import { z } from 'zod';
import * as db from './db.server';

vi.mock('./db.server', () => ({
  getServerSidePrismaClient: vi.fn(),
}));

vi.mock('@tanstack/react-start', () => ({
  createServerFn: vi.fn().mockImplementation(() => ({
    inputValidator: vi.fn().mockReturnThis(),
    handler: vi.fn((cb) => {
      const fn: any = (...args: any[]) => cb(...args);
      fn.handler = cb;
      return fn;
    }),
  })),
}));

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
    it('should return all movements ordered by name', async () => {
      const mockMovements = [
        { id: '1', name: 'Bench Press', isBodyWeight: false },
        { id: '2', name: 'Squats', isBodyWeight: false },
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
        orderBy: { name: 'asc' },
      });
    });
  });
});
