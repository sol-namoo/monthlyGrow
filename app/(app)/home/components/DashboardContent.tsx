"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { MonthlyComparisonChart } from "@/components/widgets/chapter-comparison-chart";
import { FailurePatternWidget } from "@/components/widgets/failure-pattern-widget";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  fetchAllMonthliesByUserId,
  fetchYearlyActivityStats,
} from "@/lib/firebase/index";
import { getMonthlyStatus, formatDate } from "@/lib/utils";
import { TrendingUp, Clock, BookOpen, Award, BarChart3 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface DashboardContentProps {
  userId: string;
  texts: any;
  currentLanguage: string;
}

export default function DashboardContent({
  userId,
  texts,
  currentLanguage,
}: DashboardContentProps) {
  const { translate } = useLanguage();
  // 연간 통계 데이터 (대시보드 탭에서만 로드)
  const { data: yearlyStats, isLoading: yearlyStatsLoading } = useQuery({
    queryKey: ["yearlyStats", userId],
    queryFn: () =>
      userId
        ? fetchYearlyActivityStats(userId, new Date().getFullYear())
        : null,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  });

  // 먼슬리 데이터 (대시보드 탭에서만 로드)
  const { data: monthlies = [], isLoading: monthliesLoading } = useQuery({
    queryKey: ["monthlies", userId],
    queryFn: () => (userId ? fetchAllMonthliesByUserId(userId) : []),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  });

  // 월간 비교 데이터 준비
  const pastMonthlies = monthlies.filter(
    (monthly) => getMonthlyStatus(monthly) === "ended"
  );

  // 월간 비교 차트 데이터 - 완료율만 표시
  const monthlyComparisonData = pastMonthlies.slice(-3).map((monthly) => {
    const startDate =
      monthly.startDate instanceof Date
        ? monthly.startDate
        : (monthly.startDate as any).toDate();

    // Key Results 기반으로 완료율 계산
    const totalKeyResults = monthly.keyResults?.length || 0;
    const completedKeyResults =
      monthly.keyResults?.filter((kr) => kr.isCompleted).length || 0;
    const completionRate =
      totalKeyResults > 0
        ? Math.round((completedKeyResults / totalKeyResults) * 100)
        : 0;

    const data = {
      name: `${startDate.getMonth() + 1}월`,
      completion: completionRate,
    };

    return data;
  });

  return (
    <div className="space-y-6">
        <div className="rounded-lg border bg-muted/20 dark:bg-muted/10 p-4 mb-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {texts.yearlyStats}
          </h2>
          <p className="text-sm text-muted-foreground">
            {texts.yearlyStatsDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatsCard
            title={texts.completionRate}
            value={
              yearlyStats
                ? `${Math.round(yearlyStats.averageCompletionRate)}%`
                : "0%"
            }
            description={
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>{yearlyStats?.completionRateIncrease || 0}% ↑</span>
              </div>
            }
            icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            isLoading={yearlyStatsLoading}
          />
          <StatsCard
            title={texts.totalRewards}
            value={yearlyStats?.totalRewards || 0}
            description={texts.totalRewardsDescription}
            icon={<Award className="h-4 w-4 text-muted-foreground" />}
            isLoading={yearlyStatsLoading}
          />
        </div>

        <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <h3 className="mb-4 font-bold">{texts.areaActivity}</h3>
          <div className="h-64">
            <AreaActivityChart
              data={
                yearlyStats?.areaStats
                  ? Object.entries(yearlyStats.areaStats).map(
                      ([areaId, stats]: [string, any]) => ({
                        name: stats.name,
                        value: stats.projectCount, // 프로젝트 수를 차트 값으로 사용
                        completionRate: stats.completionRate,
                        projectCount: stats.projectCount,
                      })
                    )
                  : []
              }
              isLoading={yearlyStatsLoading}
            />
          </div>
        </Card>

        <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <h3 className="mb-4 font-bold">{texts.monthlyComparison}</h3>
          <div className="h-64">
            {monthliesLoading ? (
              <MonthlyComparisonChart data={[]} isLoading={true} />
            ) : monthlyComparisonData.length > 0 ? (
              <MonthlyComparisonChart data={monthlyComparisonData} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>완료된 월간 데이터가 없습니다</p>
              </div>
            )}
          </div>
        </Card>

        {/* 실패 패턴 분석 위젯 - 하단으로 이동 */}
        <FailurePatternWidget userId={userId} />

      <div className="text-center text-xs text-muted-foreground mt-4">
        <p>{texts.dashboardUpdate}</p>
      </div>
    </div>
  );
}
