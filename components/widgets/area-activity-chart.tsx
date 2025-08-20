"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useLanguage } from "@/hooks/useLanguage";

interface AreaActivityChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function AreaActivityChart({ data }: AreaActivityChartProps) {
  const { translate } = useLanguage();
  const COLORS = [
    "#8b5cf6",
    "#6366f1",
    "#ec4899",
    "#f97316",
    "#10b981",
    "#f59e0b",
  ];

  // 커스텀 라벨 렌더링 함수
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // 퍼센트가 5% 미만이면 라벨을 표시하지 않음
    if (percent < 0.05) {
      return null;
    }

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 커스텀 범례 렌더링 함수
  const renderCustomLegend = (props: any) => {
    const { payload } = props;

    return (
      <ul className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center gap-1 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label={renderCustomLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [
            `${value}개 프로젝트`,
            name,
          ]}
          labelFormatter={(name) => `${name}`}
        />
        <Legend content={renderCustomLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
