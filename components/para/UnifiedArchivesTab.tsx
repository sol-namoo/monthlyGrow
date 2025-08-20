"use client";

import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingDisplay } from "@/components/ui/rating-display";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Filter,
  ArrowUpDown,
  Bookmark,
  Target,
  Loader2,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchUnifiedArchivesWithPaging,
  fetchUnifiedArchiveCountByUserId,
} from "@/lib/firebase/unified-archives";
import { UnifiedArchive } from "@/lib/types";
import { generateNoteTitle } from "@/lib/utils";

export default function UnifiedArchivesTab() {
  const { translate } = useLanguage();
  const [user] = useAuthState(auth);
  const [archiveFilter, setArchiveFilter] = useState<
    "all" | "monthly" | "project" | "retrospective" | "note"
  >("all");
  const [archiveSortBy, setArchiveSortBy] = useState<"latest" | "rating">(
    "latest"
  );

  // 통합 아카이브 조회
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["unified-archives", user?.uid, archiveFilter, archiveSortBy],
    queryFn: ({ pageParam }) =>
      fetchUnifiedArchivesWithPaging(
        user?.uid || "",
        10,
        pageParam,
        archiveFilter
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.lastDoc : undefined,
    enabled: !!user?.uid,
  });

  // 아카이브 수 조회
  const { data: archiveCount } = useQuery({
    queryKey: ["unified-archive-count", user?.uid, archiveFilter],
    queryFn: () =>
      fetchUnifiedArchiveCountByUserId(user?.uid || "", archiveFilter),
    enabled: !!user?.uid,
  });

  // 모든 아카이브 데이터 평면화
  const allArchives = data?.pages.flatMap((page) => page.archives) || [];

  // 정렬 적용
  const sortedArchives = [...allArchives].sort((a, b) => {
    if (archiveSortBy === "rating") {
      return (b.userRating || 0) - (a.userRating || 0);
    } else {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <Card className="p-8 text-center">
        <div className="mb-4">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {translate("para.archives.error.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("para.archives.error.description")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {translate("para.archives.description")}
          {archiveCount && <span className="ml-2">({archiveCount}개)</span>}
        </div>
        <div className="flex items-center justify-between">
          {/* 필터 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {archiveFilter === "all"
                  ? translate("para.archives.filter.all")
                  : archiveFilter === "monthly"
                  ? translate("para.archives.filter.monthly")
                  : archiveFilter === "project"
                  ? translate("para.archives.filter.project")
                  : archiveFilter === "retrospective"
                  ? "회고"
                  : "노트"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setArchiveFilter("all")}>
                {translate("para.archives.filter.all")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchiveFilter("monthly")}>
                {translate("para.archives.filter.monthly")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchiveFilter("project")}>
                {translate("para.archives.filter.project")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setArchiveFilter("retrospective")}
              >
                회고
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchiveFilter("note")}>
                노트
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 정렬 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {archiveSortBy === "latest"
                  ? translate("para.archives.sort.latest")
                  : translate("para.archives.sort.rating")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setArchiveSortBy("latest")}>
                {translate("para.archives.sort.latest")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setArchiveSortBy("rating")}>
                {translate("para.archives.sort.rating")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 아카이브 목록 */}
      {sortedArchives.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mb-4">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {translate("para.archives.noArchives.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {translate("para.archives.noArchives.description")}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedArchives.map((archive) => (
            <Card key={archive.id} className="p-4">
              <Link href={`/para/archives/${archive.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          archive.type.includes("monthly")
                            ? "border-blue-200 text-blue-700"
                            : archive.type.includes("project")
                            ? "border-green-200 text-green-700"
                            : "border-purple-200 text-purple-700"
                        }`}
                      >
                        {archive.type === "monthly_retrospective"
                          ? translate("para.archives.monthlyRetrospective")
                          : archive.type === "project_retrospective"
                          ? translate("para.archives.projectRetrospective")
                          : archive.type === "monthly_note"
                          ? "먼슬리 노트"
                          : "프로젝트 노트"}
                      </Badge>
                      <RatingDisplay
                        rating={archive.userRating || 0}
                        bookmarked={archive.bookmarked}
                        size="sm"
                        showBookmark={true}
                      />
                    </div>
                    <h3 className="font-bold mb-1">
                      {archive.title || translate("para.archives.noTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {archive.type.includes("retrospective")
                        ? archive.bestMoment || "회고 내용이 없습니다."
                        : archive.content}
                    </p>

                    {/* Key Results 실패 이유 미리보기 (새로 추가) */}
                    {archive.type.includes("retrospective") &&
                      archive.keyResultsReview?.failedKeyResults &&
                      archive.keyResultsReview.failedKeyResults.length > 0 && (
                        <div className="mb-2">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-xs font-medium text-red-700 dark:text-red-300">
                              미달성 Key Results:
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {archive.keyResultsReview.failedKeyResults.length}
                              개
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {archive.keyResultsReview.failedKeyResults
                              .slice(0, 2)
                              .map((failedKr: any, index: number) => (
                                <div
                                  key={index}
                                  className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded"
                                >
                                  <span className="font-medium">
                                    {failedKr.keyResultTitle}
                                  </span>
                                  <span className="text-red-500 dark:text-red-400 ml-1">
                                    (
                                    {failedKr.reason === "unrealisticGoal" &&
                                      "목표 과다"}
                                    {failedKr.reason === "timeManagement" &&
                                      "시간 관리"}
                                    {failedKr.reason === "priorityMismatch" &&
                                      "우선순위"}
                                    {failedKr.reason === "externalFactors" &&
                                      "외부 요인"}
                                    {failedKr.reason === "motivation" &&
                                      "동기 부족"}
                                    {failedKr.reason === "other" && "기타"})
                                  </span>
                                </div>
                              ))}
                            {archive.keyResultsReview.failedKeyResults.length >
                              2 && (
                              <div className="text-xs text-red-500 dark:text-red-400">
                                +
                                {archive.keyResultsReview.failedKeyResults
                                  .length - 2}
                                개 더...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{archive.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </Card>
          ))}

          {/* 더 보기 버튼 */}
          {hasNextPage && (
            <div className="text-center">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {translate("para.archives.loading")}
                  </>
                ) : (
                  translate("para.archives.loadMore")
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
