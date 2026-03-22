import { createServerFn } from "@tanstack/react-start";
import { getServerSidePrismaClient } from "@/lib/db.server";
import { z } from "zod";

export const MovementSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isBodyWeight: z.boolean().default(false),
});

export const createMovementServerFn = createServerFn({ method: "POST" })
  .inputValidator(MovementSchema)
  .handler(async ({ data }: { data: z.infer<typeof MovementSchema> }) => {
    const prisma = await getServerSidePrismaClient();
    const movement = await prisma.movement.create({
      data: { name: data.name, isBodyWeight: data.isBodyWeight },
    });
    return { success: true, movement };
  });

export const getMovementsServerFn = createServerFn().handler(async () => {
  const prisma = await getServerSidePrismaClient();
  return prisma.movement.findMany({
    orderBy: { name: "asc" },
  });
});
