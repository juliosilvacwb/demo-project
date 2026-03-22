import { getCurrentWorkoutServerFn } from "@/lib/workouts.server";
import { getMovementsServerFn } from "@/lib/movements.server";
import { getLatestBodyWeightFn } from "@/lib/body-metrics.server";
import { queryOptions } from "@tanstack/react-query";

export const currentWorkoutQueryOptions = () =>
  queryOptions({
    queryKey: ["current-workout"],
    queryFn: () => getCurrentWorkoutServerFn(),
  });

export const movementsQueryOptions = () =>
  queryOptions({
    queryKey: ["movements"],
    queryFn: () => getMovementsServerFn(),
  });

export const latestBodyWeightQueryOptions = () =>
  queryOptions({
    queryKey: ["latest-body-weight"],
    queryFn: () => getLatestBodyWeightFn(),
  });

