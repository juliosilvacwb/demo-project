import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addBodyWeightFn } from "@/lib/body-metrics.server";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bodyMetricsQueryOptions } from "./-queries/body-metrics";
import { Plus, Scale } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export const Route = createFileRoute("/__index/_layout/body-metrics/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(bodyMetricsQueryOptions());
  },
  component: BodyMetricsPage,
});

function BodyMetricsPage() {
  const queryClient = useQueryClient();
  const { data: metrics } = useSuspenseQuery(bodyMetricsQueryOptions());
  const [weight, setWeight] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const addWeightMutation = useMutation({
    mutationFn: (data: { weight: number; measuredAt: Date }) => addBodyWeightFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bodyMetricsQueryOptions().queryKey });
      setWeight("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    addWeightMutation.mutate({
      weight: parseFloat(weight),
      measuredAt: new Date(date),
    });
  };

  // Prepare chart data (chronological order)
  const chartData = [...metrics]
    .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime())
    .map((m) => ({
      date: new Date(m.measuredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: m.weight,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Body Metrics</h1>
      </div>

      {/* Horizontal Form on Top */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium text-slate-700">Weight (lbs)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g. 185.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-2 w-full">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={addWeightMutation.isPending} className="sm:w-auto w-full">
              <Plus className="w-4 h-4 mr-2" />
              {addWeightMutation.isPending ? "Saving..." : "Log Weight"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Main Content Row: Chart (70%) and History (30%) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Progress Chart */}
        <Card className="flex-[7]">
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
                Log at least two weight entries to see progress.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                  />
                  <YAxis
                    hide
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#0f172a"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#0f172a" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Vertical History Sidebar */}
        <Card className="flex-[3] flex flex-col">
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[400px]">
            {metrics.length === 0 ? (
              <p className="text-sm text-slate-500">No logs yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {metrics.map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Scale className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{m.weight} lbs</p>
                        <p className="text-xs text-slate-500 truncate">
                          {new Date(m.measuredAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
