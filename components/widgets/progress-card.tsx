import type React from "react"
import { cn } from "@/lib/utils"

interface ProgressCardProps {
  title: string
  progress: number
  total: number
  className?: string
  children?: React.ReactNode
}

export function ProgressCard({ title, progress, total, className, children }: ProgressCardProps) {
  const percentage = Math.min(100, Math.round((progress / total) * 100))

  return (
    <div className={cn("game-card", className)}>
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="mb-1 flex justify-between text-sm">
        <span>진행률: {percentage}%</span>
        <span>
          {progress}/{total}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-value" style={{ width: `${percentage}%` }}></div>
      </div>
      {children}
    </div>
  )
}
