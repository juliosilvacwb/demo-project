import { getBodyWeightsFn } from "@/lib/body-metrics.server";
import { queryOptions } from "@tanstack/react-query";

export const bodyMetricsQueryOptions = () =>
  queryOptions({
    queryKey: ["body-metrics"],
    queryFn: () => getBodyWeightsFn(),
  });
