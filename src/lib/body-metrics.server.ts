import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { authMiddleware } from "@/lib/auth.server";
import { z } from "zod";

export const BodyWeightSchema = z.object({
  weight: z
    .number()
    .gt(0, "Weight must be greater than 0")
    .lte(1500, "Weight must be less than or equal to 1500 lbs"),
  measuredAt: z.date().default(() => new Date()),
});

export const addBodyWeightFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(BodyWeightSchema)
  .handler(async ({ context, data }: { context: { user: { id: string } }; data: { weight: number; measuredAt: Date } }) => {
    const prisma = await getServerSidePrismaClient();
    const record = await prisma.bodyWeight.create({
      data: { userId: context.user.id, weight: data.weight, measuredAt: data.measuredAt },
    });
    return { success: true, record };
  });

export const getBodyWeightsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();

    const records = await prisma.bodyWeight.findMany({
      where: {
        userId: context.user.id,
      },
      orderBy: {
        measuredAt: "desc",
      },
    });

    return records;
  });

export const getLatestBodyWeightFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }: { context: { user: { id: string } } }) => {
    const prisma = await getServerSidePrismaClient();

    const latest = await prisma.bodyWeight.findFirst({
      where: {
        userId: context.user.id,
      },
      orderBy: {
        measuredAt: "desc",
      },
    });

    return latest;
  });
