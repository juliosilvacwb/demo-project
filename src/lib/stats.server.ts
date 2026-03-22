import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const getMovementHistoryStatsServerFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator(z.object({ movementId: z.string() }))
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { movementId: string } }) => {
    const prisma = await getServerSidePrismaClient();

    const stats = await prisma.$queryRaw<
      {
        date: Date;
        maxWeight: number;
        totalReps: number;
        totalVolume: number;
      }[]
    >`
      SELECT 
        w."completedAt" as "date",
        CAST(MAX(s.weight) AS INTEGER) as "maxWeight",
        CAST(SUM(s.reps) AS INTEGER) as "totalReps",
        CAST(SUM(s.weight * s.reps) AS INTEGER) as "totalVolume"
      FROM "Workout" w
      JOIN "Set" s ON s."workoutId" = w.id
      WHERE w."userId" = ${context.user.id}
        AND s."movementId" = ${data.movementId}
        AND w."completedAt" IS NOT NULL
      GROUP BY w.id, w."completedAt"
      ORDER BY w."completedAt" ASC
    `;

    return stats;
  });
