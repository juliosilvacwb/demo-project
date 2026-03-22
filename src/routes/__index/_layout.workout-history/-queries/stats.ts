import { getMovementHistoryStatsServerFn } from "@/lib/stats.server";
import { queryOptions } from "@tanstack/react-query";

export const movementStatsQueryOptions = (movementId: string) =>
  queryOptions({
    queryKey: ["movement-stats", movementId],
    queryFn: () => getMovementHistoryStatsServerFn({ data: { movementId } }),
    enabled: !!movementId,
  });
