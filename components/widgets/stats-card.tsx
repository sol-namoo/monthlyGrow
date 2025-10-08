import type React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string | ReactNode;
  icon?: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
  isLoading = false,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16 mb-2" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {description && (
          <div className="text-xs text-muted-foreground">
            {isLoading ? <Skeleton className="h-3 w-24" /> : description}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
