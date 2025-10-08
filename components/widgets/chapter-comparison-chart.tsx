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
import { Skeleton } from "@/components/ui/skeleton";

interface MonthlyComparisonChartProps {
  data: {
    name: string;
    completion: number;
  }[];
  isLoading?: boolean;
}

export function MonthlyComparisonChart({
  data,
  isLoading = false,
}: MonthlyComparisonChartProps) {
  const { translate } = useLanguage();

  // 로딩 상태일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <div className="h-full flex flex-col space-y-4">
        {/* 차트 영역 스켈레톤 */}
        <div className="flex-1 flex items-end justify-between px-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <Skeleton
                className="w-12 rounded-t-md"
                style={{ height: `${Math.random() * 100 + 50}px` }}
              />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>

        {/* 범례 스켈레톤 */}
        <div className="flex justify-center">
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

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
        <Tooltip formatter={(value, name) => [`${value}%`, name]} />
        <Legend />
        <Bar
          dataKey="completion"
          name={translate("charts.completionRate")}
          fill="#8884d8"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
