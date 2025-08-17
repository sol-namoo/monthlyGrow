import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar, Target, Award, ChevronRight } from "lucide-react";
import { Monthly } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface MonthlyCardProps {
  monthly: Monthly;
  daysLeft: number;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  currentLanguage: string;
  texts: {
    daysLeft: string;
    reward: string;
    noReward: string;
    progress: string;
    progressSuffix: string;
  };
  href?: string;
  showLink?: boolean;
}

export function MonthlyCard({
  monthly,
  daysLeft,
  progress,
  completedTasks,
  totalTasks,
  currentLanguage,
  texts,
  href,
  showLink = true,
}: MonthlyCardProps) {
  const CardContent = () => (
    <div className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              variant="outline"
              className="text-xs font-medium w-12 flex-shrink-0 bg-background/80 dark:bg-background/60"
            >
              {monthly.startDate instanceof Date
                ? monthly.startDate.getMonth() + 1
                : (monthly.startDate as any).toDate().getMonth() + 1}
              월
            </Badge>
            <h3 className="text-lg font-semibold">{monthly.objective}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDate(monthly.startDate, currentLanguage as "ko" | "en")} -{" "}
              {formatDate(monthly.endDate, currentLanguage as "ko" | "en")}
            </span>
          </div>
        </div>
        {showLink && href && (
          <Button variant="ghost" size="sm" asChild>
            <Link href={href}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Key Results Progress */}
      {monthly.keyResults && monthly.keyResults.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Key Results</span>
            <Badge variant="outline" className="text-xs flex-shrink-0">
              {monthly.keyResults.filter((kr) => kr.isCompleted).length}/
              {monthly.keyResults.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Completed Tasks */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">
          완료된 태스크: {completedTasks}개
        </span>
        {totalTasks > 0 && (
          <span className="text-xs text-muted-foreground">
            (총 {totalTasks}개)
          </span>
        )}
      </div>

      {/* Days Left */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant={daysLeft <= 7 ? "destructive" : "secondary"}
            className="flex-shrink-0"
          >
            {texts.daysLeft.replace("{days}", daysLeft.toString())}
          </Badge>
        </div>

        {/* Reward */}
        {monthly.reward && (
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {monthly.reward}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (href && showLink) {
    return (
      <Link href={href}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <CardContent />
        </Card>
      </Link>
    );
  }

  return (
    <Card className="bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
      <CardContent />
    </Card>
  );
}
