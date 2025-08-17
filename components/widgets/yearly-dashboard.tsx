"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { MonthlyComparisonChart } from "@/components/widgets/chapter-comparison-chart";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import {
  fetchAllMonthliesByUserId,
  fetchYearlyActivityStats,
} from "@/lib/firebase/index";
import { getMonthlyStatus } from "@/lib/utils";
import { BarChart3, Clock, BookOpen, Award, TrendingUp } from "lucide-react";

export default function YearlyDashboard() {
  const [user] = useAuthState(auth);
  const { translate } = useLanguage();

  // 번역 텍스트
  const texts = {
    yearlyStats: translate("home.yearlyStats"),
    yearlyStatsDescription: translate("home.yearlyStatsDescription"),
    focusTime: translate("home.focusTime"),
    completionRate: translate("home.completionRate"),
    completedMonthlies: translate("home.completedMonthlies"),
    completedMonthliesDescription: translate(
      "home.completedMonthliesDescription"
    ),
    totalRewards: translate("home.totalRewards"),
    totalRewardsDescription: translate("home.totalRewardsDescription"),
    hours: translate("home.hours"),
    areaActivity: translate("home.areaActivity"),
    monthlyComparison: translate("home.monthlyComparison"),
    dashboardUpdate: translate("home.dashboardUpdate"),
  };

  // 연간 통계 데이터 - 연도별로 캐시
  const currentYear = new Date().getFullYear();
  const { data: yearlyStats, isLoading: yearlyStatsLoading } = useQuery({
    queryKey: ["yearlyStats", user?.uid, currentYear],
    queryFn: () =>
      user ? fetchYearlyActivityStats(user.uid, currentYear) : null,
    enabled: !!user,
    // 연간 데이터는 자주 변경되지 않으므로 캐시 시간을 길게 설정
    staleTime: 1000 * 60 * 60 * 24, // 24시간
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7일
  });

  // 먼슬리 데이터 (월간 비교 차트용) - 완료된 먼슬리만 필요하므로 캐시 최적화
  const { data: monthlies = [], isLoading: monthliesLoading } = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: () => (user ? fetchAllMonthliesByUserId(user.uid) : []),
    enabled: !!user,
    // 먼슬리 데이터는 자주 변경되지 않으므로 캐시 시간을 길게 설정
    staleTime: 1000 * 60 * 60 * 6, // 6시간
    gcTime: 1000 * 60 * 60 * 24 * 3, // 3일
  });

  // 월간 비교 데이터 준비
  const pastMonthlies = monthlies.filter(
    (monthly) => getMonthlyStatus(monthly) === "ended"
  );

  // 월간 비교 차트 데이터 - Key Results 기반으로 계산
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

    // 완료된 Key Results 수를 집중 시간으로 사용 (임시)
    const focusHours = completedKeyResults;

    return {
      name: `${startDate.getMonth() + 1}월`,
      completion: completionRate,
      focusHours: focusHours,
    };
  });

  if (yearlyStatsLoading || monthliesLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border bg-muted/20 dark:bg-muted/10 p-4 mb-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded animate-pulse"></div>
          <div className="h-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 bg-muted rounded animate-pulse"></div>
          <div className="h-24 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
        <div className="h-64 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

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
          title={texts.focusTime}
          value={
            yearlyStats
              ? `${Math.round(yearlyStats.totalFocusTime / 60)}${texts.hours}`
              : `0${texts.hours}`
          }
          description="올해 완료한 태스크 기준"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title={texts.completionRate}
          value={
            yearlyStats
              ? `${Math.round(yearlyStats.averageCompletionRate)}%`
              : "0%"
          }
          description="올해 완료된 먼슬리 평균"
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title={texts.completedMonthlies}
          value={yearlyStats?.completedMonthlies || 0}
          description={texts.completedMonthliesDescription}
          icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title={texts.totalRewards}
          value={yearlyStats?.totalRewards || 0}
          description={texts.totalRewardsDescription}
          icon={<Award className="h-4 w-4 text-muted-foreground" />}
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
                      value: stats.focusTime,
                      completionRate: stats.completionRate,
                      projectCount: stats.projectCount,
                    })
                  )
                : []
            }
          />
        </div>
      </Card>

      <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <h3 className="mb-4 font-bold">{texts.monthlyComparison}</h3>
        <div className="h-64">
          {monthlyComparisonData.length > 0 ? (
            <MonthlyComparisonChart data={monthlyComparisonData} />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>완료된 월간 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </Card>

      <div className="text-center text-xs text-muted-foreground mt-4">
        <p>{texts.dashboardUpdate}</p>
      </div>
    </div>
  );
}
