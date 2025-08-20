"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Archive, Loader2 } from "lucide-react";
import Link from "next/link";
import { Monthly } from "@/lib/types";
import {
  formatDate,
  getMonthlyStatus,
  calculateMonthlyProgressInfo,
} from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { fetchPastMonthliesByUserIdWithPaging } from "@/lib/firebase/index";

interface PastMonthliesTabProps {
  projectCounts: Record<string, number>;
  projectCountsLoading: boolean;
  sortBy: "latest" | "oldest" | "completionRate";
}

export default function PastMonthliesTab({
  projectCounts,
  projectCountsLoading,
  sortBy,
}: PastMonthliesTabProps) {
  const [user] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();

  // 무한 쿼리로 과거 먼슬리 가져오기
  const {
    data: monthliesData,
    fetchNextPage: fetchNextMonthlies,
    hasNextPage: hasNextMonthlies,
    isFetchingNextPage: isFetchingNextMonthlies,
    isLoading: monthliesLoading,
  } = useInfiniteQuery({
    queryKey: ["past-monthlies", user?.uid, sortBy],
    queryFn: ({ pageParam }) =>
      fetchPastMonthliesByUserIdWithPaging(
        user?.uid || "",
        10,
        pageParam?.lastDoc,
        sortBy
      ),
    enabled: !!user?.uid,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? { lastDoc: lastPage.lastDoc } : undefined,
    initialPageParam: { lastDoc: undefined },
  });

  // 모든 페이지의 먼슬리를 하나의 배열로 합치기
  const allMonthlies = monthliesData?.pages.flatMap((page) => page.monthlies) || [];
  const getProjectCount = (monthly: Monthly) => {
    return projectCounts[monthly.id] || 0;
  };

  const getCompletionRate = (monthly: Monthly) => {
    const progressInfo = calculateMonthlyProgressInfo(monthly);
    return Math.round(progressInfo.progress * 100);
  };

  const getTaskCounts = (monthly: Monthly) => {
    const progressInfo = calculateMonthlyProgressInfo(monthly);
    return {
      completed: progressInfo.doneCounts,
      total: progressInfo.targetCounts,
    };
  };

  // 월 표시를 위한 함수
  const getMonthDisplay = (monthly: Monthly) => {
    const endDate =
      monthly.endDate instanceof Date
        ? monthly.endDate
        : new Date(monthly.endDate);
    const year = endDate.getFullYear();
    const month = endDate.getMonth() + 1;

    if (currentLanguage === "ko") {
      return `${year}년 ${month}월`;
    } else {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${monthNames[month - 1]} ${year}`;
    }
  };

  // 로딩 상태
  if (monthliesLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 지난 먼슬리 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("monthly.pastMonthlies.totalCount").replace(
            "{count}",
            allMonthlies.length.toString()
          )}
        </div>
      </div>

      {/* 지난 먼슬리 리스트 */}
      {allMonthlies.length > 0 ? (
        <div className="space-y-4">
          {allMonthlies.map((monthly) => (
            <Card key={monthly.id} className="p-4">
              <Link href={`/monthly/${monthly.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {getMonthDisplay(monthly)}
                      </Badge>
                    </div>
                    <h3 className="font-bold">{monthly.objective}</h3>
                    {monthly.objectiveDescription && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {monthly.objectiveDescription}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">
                        {translate("monthly.pastMonthlies.keyResults")}:{" "}
                        {monthly.keyResults?.filter((kr) => kr.isCompleted)
                          .length || 0}
                        /{monthly.keyResults?.length || 0}
                      </p>
                      <span className="text-xs font-medium text-green-600">
                        {translate("monthly.pastMonthlies.completionRate")}:{" "}
                        {getCompletionRate(monthly)}%
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={`whitespace-nowrap ml-4 ${
                      getCompletionRate(monthly) === 100
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                    }`}
                  >
                    {getCompletionRate(monthly) === 100
                      ? translate("monthly.pastMonthlies.status.allCompleted")
                      : translate(
                          "monthly.pastMonthlies.status.partiallyCompleted"
                        )}
                  </Badge>
                </div>
              </Link>
            </Card>
          ))}

          {/* 더보기 버튼 */}
          {hasNextMonthlies && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextMonthlies()}
                disabled={isFetchingNextMonthlies}
              >
                {isFetchingNextMonthlies ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translate("common.loading")}
                  </>
                ) : (
                  translate("common.loadMore")
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-muted/30 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-muted/20 p-4">
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold">
            {translate("monthly.pastMonthlies.noMonthlies.title")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {translate("monthly.pastMonthlies.noMonthlies.description")}
          </p>
        </Card>
      )}
    </div>
  );
}
