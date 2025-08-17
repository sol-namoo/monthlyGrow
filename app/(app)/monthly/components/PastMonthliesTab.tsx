"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Archive } from "lucide-react";
import Link from "next/link";
import { Monthly } from "@/lib/types";
import {
  formatDate,
  getMonthlyStatus,
  calculateMonthlyProgressInfo,
} from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface PastMonthliesTabProps {
  monthlies: Monthly[];
  projectCounts: Record<string, number>;
  projectCountsLoading: boolean;
}

export default function PastMonthliesTab({
  monthlies,
  projectCounts,
  projectCountsLoading,
}: PastMonthliesTabProps) {
  const { translate, currentLanguage } = useLanguage();

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

  return (
    <div className="space-y-6">
      {/* 지난 먼슬리 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("monthly.pastMonthlies.totalCount").replace(
            "{count}",
            monthlies.length.toString()
          )}
        </div>
      </div>

      {/* 지난 먼슬리 리스트 */}
      {monthlies.length > 0 ? (
        <div className="space-y-4">
          {monthlies.map((monthly) => (
            <Card key={monthly.id} className="p-4">
              <Link href={`/monthly/${monthly.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{monthly.objective}</h3>
                    {monthly.objective && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {monthly.objective}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
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
                    className={`whitespace-nowrap ${
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
