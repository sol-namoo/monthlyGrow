"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronRight,
  Star,
  Bookmark,
  Filter,
  ArrowUpDown,
  Loader2,
  CalendarDays,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { fetchArchivesByUserIdWithPaging } from "@/lib/firebase/analytics";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ArchivesTabProps {
  userId: string;
}

export default function ArchivesTab({ userId }: ArchivesTabProps) {
  const { translate, currentLanguage } = useLanguage();
  const [archiveSortBy, setArchiveSortBy] = useState("latest");
  const [archiveFilter, setArchiveFilter] = useState("all");

  // 아카이브 데이터 무한 스크롤 쿼리
  const {
    data: archivesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: archivesLoading,
    refetch: refetchArchives,
  } = useInfiniteQuery({
    queryKey: ["archives", userId, archiveSortBy],
    queryFn: ({ pageParam }) =>
      fetchArchivesByUserIdWithPaging(userId, 10, pageParam, archiveSortBy),
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    initialPageParam: undefined,
  });

  // 정렬 변경 시 데이터 다시 가져오기
  useEffect(() => {
    refetchArchives();
  }, [archiveSortBy, userId, refetchArchives]);

  const allArchives =
    archivesData?.pages.flatMap((page) => page.archives) || [];

  // 필터링된 아카이브
  const filteredArchives = allArchives.filter((archive) => {
    if (archiveFilter === "all") return true;
    if (archiveFilter === "monthly") return archive.type === "monthly";
    if (archiveFilter === "project") return archive.type === "project";
    if (archiveFilter === "note") return archive.type === "note";
    return true;
  });

  console.log("Filtered archives:", filteredArchives);

  // 로딩 스켈레톤
  if (archivesLoading) {
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
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {translate("para.archives.description")}
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
                  : translate("para.archives.filter.note")}
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
              <DropdownMenuItem onClick={() => setArchiveFilter("note")}>
                {translate("para.archives.filter.note")}
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
      {filteredArchives.length === 0 ? (
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
          {filteredArchives.map((archive) => (
            <Card key={archive.id} className="p-4">
              <Link href={`/para/archives/${archive.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          archive.type === "monthly"
                            ? "border-blue-200 text-blue-700"
                            : archive.type === "project"
                            ? "border-green-200 text-green-700"
                            : "border-purple-200 text-purple-700"
                        }`}
                      >
                        {archive.type === "monthly"
                          ? translate("para.archives.monthlyRetrospective")
                          : archive.type === "project"
                          ? translate("para.archives.projectRetrospective")
                          : "노트"}
                      </Badge>
                      {archive.bookmarked && (
                        <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    <h3 className="font-bold mb-1">
                      {archive.title || translate("para.archives.noTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {archive.summary || translate("para.archives.noSummary")}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>
                          {formatDateShort(archive.createdAt, currentLanguage)}
                        </span>
                      </div>
                      {archive.userRating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span>{archive.userRating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                </div>
              </Link>
            </Card>
          ))}

          {/* 더보기 버튼 */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full"
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
