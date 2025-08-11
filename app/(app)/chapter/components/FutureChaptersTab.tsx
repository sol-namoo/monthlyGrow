"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Award, Clock, Plus, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { Chapter } from "@/lib/types";
import { formatDate, getChapterStatus } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface FutureChaptersTabProps {
  chapters: Chapter[];
  projectCounts: Record<string, number>;
  projectCountsLoading: boolean;
  onCreateChapter: (monthOffset: number) => void;
}

export default function FutureChaptersTab({
  chapters,
  projectCounts,
  projectCountsLoading,
  onCreateChapter,
}: FutureChaptersTabProps) {
  const { translate, currentLanguage } = useLanguage();

  const getProjectCount = (chapter: Chapter) => {
    return projectCounts[chapter.id] || 0;
  };

  return (
    <div className="space-y-6">
      {/* 미래 챕터 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("chapter.futureChapters.totalCount").replace(
            "{count}",
            chapters.length.toString()
          )}
        </div>
        <Button onClick={() => onCreateChapter(1)}>
          <Plus className="mr-2 h-4 w-4" />
          {translate("chapter.futureChapters.button")}
        </Button>
      </div>

      {/* 미래 챕터 리스트 */}
      {chapters.length > 0 ? (
        <div className="space-y-4">
          {chapters.map((chapter, index) => (
            <div key={chapter.id} className={index > 0 ? "mt-4" : ""}>
              <Link href={`/chapter/${chapter.id}`}>
                <Card className="border-2 border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 p-4 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{chapter.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700"
                      >
                        {new Date(chapter.startDate).toLocaleDateString(
                          currentLanguage === "ko" ? "ko-KR" : "en-UK",
                          {
                            month: "long",
                          }
                        )}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                    <span>
                      {translate("chapter.futureChapters.reward")}:{" "}
                      {chapter.reward}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDate(chapter.startDate, currentLanguage)} ~{" "}
                      {formatDate(chapter.endDate, currentLanguage)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">
                      {translate("chapter.futureChapters.target")}
                    </h4>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>
                        {translate(
                          "chapter.futureChapters.targetCount"
                        ).replace("{count}", chapter.targetCount.toString())}
                      </span>
                      <span>
                        {projectCountsLoading ? (
                          <Skeleton className="h-4 w-8" />
                        ) : (
                          translate(
                            "chapter.futureChapters.connectedProjects"
                          ).replace(
                            "{count}",
                            getProjectCount(chapter).toString()
                          )
                        )}
                      </span>
                    </div>
                    {projectCountsLoading ? (
                      <Skeleton className="h-4 w-48" />
                    ) : getProjectCount(chapter) === 0 ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        {translate("chapter.futureChapters.noProjects")}
                      </p>
                    ) : null}
                  </div>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpenIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold">
            {translate("chapter.futureChapters.noChapters.title")}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
            {translate("chapter.futureChapters.noChapters.description")}
          </p>
          <Button onClick={() => onCreateChapter(1)}>
            <Plus className="mr-2 h-4 w-4" />
            {translate("chapter.futureChapters.noChapters.button")}
          </Button>
        </Card>
      )}
    </div>
  );
}
