import React from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Chapter } from "@/lib/types";
import { calculateChapterProgressInfo } from "@/lib/utils";
import { BookOpen, Target, CheckCircle } from "lucide-react";

interface ChapterProgressWidgetProps {
  chapter: Chapter;
  className?: string;
}

export function ChapterProgressWidget({
  chapter,
  className,
}: ChapterProgressWidgetProps) {
  const progressInfo = calculateChapterProgressInfo(chapter);
  const progressPercentage = Math.round(progressInfo.progress * 100);

  return (
    <Card className={`p-4 ${className || ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">{chapter.title}</h3>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {progressPercentage}%
        </span>
      </div>

      <div className="mb-3">
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3" />
          <span>목표: {progressInfo.targetCounts}</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          <span>완료: {progressInfo.doneCounts}</span>
        </div>
      </div>
    </Card>
  );
}
