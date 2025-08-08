"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "@/hooks/useLanguage";

interface LoopComparisonChartProps {
  data: {
    name: string;
    completion: number;
    focusHours: number;
  }[];
}

export function LoopComparisonChart({ data }: LoopComparisonChartProps) {
  const { translate } = useLanguage();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
        <Tooltip />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="completion"
          name={translate("charts.completionRate")}
          fill="#8884d8"
        />
        <Bar
          yAxisId="right"
          dataKey="focusHours"
          name={translate("charts.focusTime")}
          fill="#82ca9d"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
