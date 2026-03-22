import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkoutProgressionChart } from "./WorkoutProgressionChart";

// Thourough mock for Recharts to avoid internal timers and layout issues in JSDOM
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children, data }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe("WorkoutProgressionChart", () => {
  const mockData = [
    {
      date: new Date("2024-03-20T10:00:00Z"),
      maxWeight: 100,
      totalReps: 10,
      totalVolume: 1000,
    },
    {
      date: new Date("2024-03-22T10:00:00Z"),
      maxWeight: 110,
      totalReps: 12,
      totalVolume: 1320,
    },
  ];

  it("renders empty state when data is empty", () => {
    render(<WorkoutProgressionChart data={[]} metric="maxWeight" />);
    expect(screen.getByText(/No data available for this movement/i)).toBeInTheDocument();
  });

  it("renders chart when data is provided", () => {
    render(<WorkoutProgressionChart data={mockData} metric="maxWeight" />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("renders empty state with less than two data points if we want to show progress", () => {
    render(<WorkoutProgressionChart data={[mockData[0]]} metric="maxWeight" />);
    expect(screen.getByText(/At least two sessions needed/i)).toBeInTheDocument();
  });
});
