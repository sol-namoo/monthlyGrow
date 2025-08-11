import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Star, Calendar } from "lucide-react";
import { Chapter } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ChapterCardProps {
  chapter: Chapter;
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

export function ChapterCard({
  chapter,
  daysLeft,
  progress,
  completedTasks,
  totalTasks,
  currentLanguage,
  texts,
  href,
  showLink = true,
}: ChapterCardProps) {
  const cardContent = (
    <Card
      className={`relative overflow-hidden border-2 border-primary/20 p-4 mb-6 ${
        showLink ? "cursor-pointer hover:shadow-md transition-shadow" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{chapter.title}</h3>
          <Badge
            variant="outline"
            className="text-xs bg-primary/10 border-primary/20"
          >
            {texts.daysLeft}
            {daysLeft}
          </Badge>
        </div>
        {showLink && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Star className="h-4 w-4 text-yellow-500" />
        <span>
          {texts.reward}: {chapter.reward || texts.noReward}
        </span>
      </div>
      <div className="mb-1 flex justify-between text-sm">
        <span>
          {texts.progress}: {progress}
          {texts.progressSuffix}
        </span>
        <span>
          {completedTasks}/{totalTasks}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-value"
          style={{
            width: `${progress}%`,
          }}
        ></div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="h-3 w-3" />
        <span>
          {formatDate(chapter.startDate, currentLanguage)} ~{" "}
          {formatDate(chapter.endDate, currentLanguage)}
        </span>
      </div>
    </Card>
  );

  return showLink && href ? (
    <Link href={href}>{cardContent}</Link>
  ) : (
    cardContent
  );
}
