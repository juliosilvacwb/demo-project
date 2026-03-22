import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Activity, Weight } from "lucide-react";

export type MetricType = "maxWeight" | "totalReps" | "totalVolume";

export interface ProgressionStats {
  date: Date;
  maxWeight: number;
  totalReps: number;
  totalVolume: number;
}

interface WorkoutProgressionChartProps {
  data: ProgressionStats[];
  metric: MetricType;
}

const metricLabels: Record<MetricType, string> = {
  maxWeight: "Maximum Weight (lbs)",
  totalReps: "Total Repetitions",
  totalVolume: "Total Volume (Weight * Reps)",
};

const metricIcons: Record<MetricType, React.ReactNode> = {
  maxWeight: <Weight className="w-4 h-4 mr-2 text-slate-500" />,
  totalReps: <Activity className="w-4 h-4 mr-2 text-slate-500" />,
  totalVolume: <TrendingUp className="w-4 h-4 mr-2 text-slate-500" />,
};

export function WorkoutProgressionChart({ data, metric }: WorkoutProgressionChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        ...entry,
        formattedDate: new Date(entry.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic py-10">
        <Activity className="w-10 h-10 mb-2 opacity-20" />
        No data available for this movement.
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm italic py-10">
        <Activity className="w-10 h-10 mb-2 opacity-20" />
        At least two sessions needed to track progression.
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[200px]">
      <div className="flex items-center mb-4 ml-2">
        {metricIcons[metric]}
        <span className="text-sm font-medium text-slate-700">{metricLabels[metric]}</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            minTickGap={20}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            width={40}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              padding: "12px",
            }}
            labelStyle={{ fontWeight: "600", color: "#1e293b", marginBottom: "4px" }}
            cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey={metric}
            name={metricLabels[metric].split(" (")[0]}
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#4f46e5", stroke: "#fff", strokeWidth: 2 }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
