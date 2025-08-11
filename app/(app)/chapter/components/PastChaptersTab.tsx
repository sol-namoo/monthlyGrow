"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Clock, Archive, Star } from "lucide-react";
import Link from "next/link";
import { Chapter } from "@/lib/types";
import {
  formatDate,
  getChapterStatus,
  calculateChapterProgressInfo,
} from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface PastChaptersTabProps {
  chapters: Chapter[];
  projectCounts: Record<string, number>;
  projectCountsLoading: boolean;
}

export default function PastChaptersTab({
  chapters,
  projectCounts,
  projectCountsLoading,
}: PastChaptersTabProps) {
  const { translate, currentLanguage } = useLanguage();

  const getProjectCount = (chapter: Chapter) => {
    return projectCounts[chapter.id] || 0;
  };

  const getCompletionRate = (chapter: Chapter) => {
    const progressInfo = calculateChapterProgressInfo(chapter);
    return Math.round(progressInfo.progress * 100);
  };

  const getTaskCounts = (chapter: Chapter) => {
    const progressInfo = calculateChapterProgressInfo(chapter);
    return {
      completed: progressInfo.doneCounts,
      total: progressInfo.targetCounts,
    };
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 지난 챕터 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("chapter.pastChapters.totalCount").replace(
            "{count}",
            chapters.length.toString()
          )}
        </div>
      </div>

      {/* 지난 챕터 리스트 */}
      {chapters.length > 0 ? (
        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className={index > 0 ? "mt-4" : ""}>
              <Link href={`/chapter/${chapter.id}`}>
                <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{chapter.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {translate("chapter.pastChapters.achievement").replace(
                          "{rate}",
                          getCompletionRate(chapter).toString()
                        )}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDate(chapter.startDate, currentLanguage)} ~{" "}
                      {formatDate(chapter.endDate, currentLanguage)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>
                        {translate("chapter.pastChapters.completionRate")}:{" "}
                        {getCompletionRate(chapter)}%
                      </span>
                      <span>
                        {(() => {
                          const counts = getTaskCounts(chapter);
                          return `${counts.completed}/${counts.total}`;
                        })()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-value"
                        style={{ width: `${getCompletionRate(chapter)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {projectCountsLoading ? (
                        <Skeleton className="h-4 w-8" />
                      ) : (
                        translate(
                          "chapter.pastChapters.connectedProjects"
                        ).replace(
                          "{count}",
                          getProjectCount(chapter).toString()
                        )
                      )}
                    </span>
                    {renderStars(chapter.retrospective?.userRating)}
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted/30 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted/20 p-4">
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold">
            {translate("chapter.pastChapters.noChapters.title")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {translate("chapter.pastChapters.noChapters.description")}
          </p>
        </Card>
      )}
    </div>
  );
}
