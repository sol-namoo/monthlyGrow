"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface AreaActivityChartProps {
  data: {
    name: string
    value: number
  }[]
}

export function AreaActivityChart({ data }: AreaActivityChartProps) {
  const COLORS = ["#8b5cf6", "#6366f1", "#ec4899", "#f97316"]

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
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}%`, "비중"]} labelFormatter={(name) => `${name}`} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
