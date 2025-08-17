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

interface MonthlyComparisonChartProps {
  data: {
    name: string;
    completion: number;
    focusHours: number;
  }[];
}

export function MonthlyComparisonChart({ data }: MonthlyComparisonChartProps) {
  const { translate } = useLanguage();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          formatter={(value, name) => [
            name === translate("charts.completionRate")
              ? `${value}%`
              : `${value}개`,
            name,
          ]}
        />
        <Legend />
        <Bar
          dataKey="completion"
          name={translate("charts.completionRate")}
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="focusHours"
          name={translate("charts.focusTime")}
          fill="#82ca9d"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
