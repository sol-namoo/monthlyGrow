"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterAvatar } from "@/components/character-avatar";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { MonthlyComparisonChart } from "@/components/widgets/chapter-comparison-chart";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Award,
  Calendar,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchAllMonthliesByUserId,
  fetchYearlyActivityStats,
  fetchAllAreasByUserId,
  fetchProjectsByMonthlyId,
  getTaskCountsForMultipleProjects,
} from "@/lib/firebase/index";
import { Skeleton } from "@/components/ui/skeleton";
import { getMonthlyStatus, formatDate } from "@/lib/utils";

export default function DashboardPage() {
  const [user, userLoading] = useAuthState(auth);

  // Firestore에서 데이터 가져오기
  const { data: monthlies = [], isLoading: monthliesLoading } = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: () => fetchAllMonthliesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 각 먼슬리의 프로젝트와 태스크 데이터 가져오기
  const { data: monthlyProjects = {}, isLoading: projectsLoading } = useQuery({
    queryKey: ["monthlyProjects", user?.uid],
    queryFn: async () => {
      const projectsMap: { [monthlyId: string]: any[] } = {};
      for (const monthly of monthlies) {
        const projects = await fetchProjectsByMonthlyId(monthly.id);
        projectsMap[monthly.id] = projects;
      }
      return projectsMap;
    },
    enabled: !!user?.uid && monthlies.length > 0,
  });

  // 각 먼슬리의 태스크 개수 데이터 가져오기
  const { data: monthlyTaskCounts = {}, isLoading: taskCountsLoading } =
    useQuery({
      queryKey: ["monthlyTaskCounts", user?.uid],
      queryFn: async () => {
        const taskCountsMap: {
          [monthlyId: string]: { totalTasks: number; completedTasks: number };
        } = {};
        for (const monthly of monthlies) {
          const projects = monthlyProjects[monthly.id] || [];
          if (projects.length > 0) {
            const projectIds = projects.map((p) => p.id);
            const taskCounts = await getTaskCountsForMultipleProjects(
              projectIds
            );
            const totalTasks = Object.values(taskCounts).reduce(
              (sum, counts) => sum + counts.total,
              0
            );
            const completedTasks = Object.values(taskCounts).reduce(
              (sum, counts) => sum + counts.completed,
              0
            );
            taskCountsMap[monthly.id] = { totalTasks, completedTasks };
          } else {
            taskCountsMap[monthly.id] = { totalTasks: 0, completedTasks: 0 };
          }
        }
        return taskCountsMap;
      },
      enabled:
        !!user?.uid &&
        monthlies.length > 0 &&
        Object.keys(monthlyProjects).length > 0,
    });

  // 로딩 상태
  if (
    userLoading ||
    monthliesLoading ||
    areasLoading ||
    projectsLoading ||
    taskCountsLoading
  ) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // 현재 먼슬리와 과거 먼슬리 분리 (날짜 기반)
  const currentMonthly = monthlies.find(
    (monthly) => getMonthlyStatus(monthly) === "in_progress"
  );
  const pastMonthlies = monthlies.filter(
    (monthly) => getMonthlyStatus(monthly) === "ended"
  );

  // 실제 데이터 기반 통계 계산
  const getMonthlyCompletionRate = (monthly: any) => {
    // Key Results 기반으로 완료율 계산 (더 정확한 지표)
    const totalKeyResults = monthly.keyResults?.length || 0;
    const completedKeyResults =
      monthly.keyResults?.filter((kr: any) => kr.isCompleted).length || 0;

    if (totalKeyResults > 0) {
      return Math.round((completedKeyResults / totalKeyResults) * 100);
    }

    // Key Results가 없으면 태스크 기반으로 계산
    const taskCounts = monthlyTaskCounts[monthly.id];
    if (taskCounts && taskCounts.totalTasks > 0) {
      return Math.round(
        (taskCounts.completedTasks / taskCounts.totalTasks) * 100
      );
    }
    return 0;
  };

  const getMonthlyTaskCounts = (monthly: any) => {
    const taskCounts = monthlyTaskCounts[monthly.id];
    return {
      completed: taskCounts?.completedTasks || 0,
      total: taskCounts?.totalTasks || 0,
    };
  };

  // 실제 집중 시간 계산 (태스크 duration 기반)
  const calculateTotalFocusTime = (monthlies: any[]) => {
    return monthlies.reduce((total, monthly) => {
      const taskCounts = monthlyTaskCounts[monthly.id];
      if (taskCounts) {
        // 완료된 태스크들의 duration 합계를 계산해야 함
        // 현재는 임시로 완료된 태스크 수 * 평균 2시간으로 계산
        return total + taskCounts.completedTasks * 2;
      }
      return total;
    }, 0);
  };

  // 연간 통계 (올해 완료된 먼슬리만)
  const currentYear = new Date().getFullYear();
  const thisYearMonthlies = pastMonthlies.filter(
    (monthly) => monthly.endDate.getFullYear() === currentYear
  );

  const thisYearRewards = thisYearMonthlies.filter(
    (monthly) => monthly.reward
  ).length;
  const thisYearFocusTime = calculateTotalFocusTime(thisYearMonthlies);

  // 올해 완료율 계산 (올해 완료된 먼슬리들의 평균 완료율)
  const thisYearCompletionRates = thisYearMonthlies.map((monthly) =>
    getMonthlyCompletionRate(monthly)
  );
  const averageCompletionRate =
    thisYearCompletionRates.length > 0
      ? Math.round(
          thisYearCompletionRates.reduce((sum, rate) => sum + rate, 0) /
            thisYearCompletionRates.length
        )
      : 0;

  const completionRate = currentMonthly
    ? getMonthlyCompletionRate(currentMonthly)
    : 0;
  const previousMonthlyCompletion =
    pastMonthlies.length > 0 ? getMonthlyCompletionRate(pastMonthlies[0]) : 0;

  const totalFocusTime = calculateTotalFocusTime(pastMonthlies); // 완료된 먼슬리만 계산
  const currentFocusTime = currentMonthly
    ? (() => {
        const taskCounts = monthlyTaskCounts[currentMonthly.id];
        return (taskCounts?.completedTasks || 0) * 2; // 임시 계산
      })()
    : 0;

  const previousFocusTime =
    pastMonthlies.length > 0
      ? (() => {
          const taskCounts = monthlyTaskCounts[pastMonthlies[0].id];
          return (taskCounts?.completedTasks || 0) * 2; // 임시 계산
        })()
      : 0;

  const stats = {
    completionRate,
    previousMonthlyCompletion,
    changeRate:
      pastMonthlies.length > 0
        ? Math.round(
            ((completionRate - previousMonthlyCompletion) /
              previousMonthlyCompletion) *
              100
          )
        : 0,
    totalMonthlies: pastMonthlies.length, // 완료된 먼슬리만
    completedThisYear: thisYearMonthlies.length, // 올해 완료된 먼슬리
    rewardsReceived: thisYearRewards, // 올해 받은 보상
    totalFocusTime: thisYearFocusTime, // 올해 집중 시간
    currentFocusTime, // 현재 먼슬리 집중 시간
    previousFocusTime,
    focusTimeChange:
      pastMonthlies.length > 0
        ? Math.round(
            ((currentFocusTime - previousFocusTime) / previousFocusTime) * 100
          )
        : 0,
  };

  const areaActivityData = areas.map((area) => ({
    name: area.name,
    value: Math.floor(Math.random() * 50) + 10, // 임시 데이터
  }));

  const monthlyComparisonData = pastMonthlies.slice(-3).map((monthly) => {
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
      name: `${monthly.startDate.getMonth() + 1}월`,
      completion: completionRate,
      focusHours: focusHours,
    };
  });

  return (
    <div className="container max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>

      <div className="mb-6 flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <CharacterAvatar level={5} />
        <div>
          <h2 className="text-lg font-bold">안녕하세요, 루퍼님!</h2>
          <p className="text-sm text-muted-foreground">
            이번 먼슬리 달성률이{" "}
            <span className="font-medium text-primary">65%</span>에 도달했어요.
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>전월 대비 {stats.changeRate}% 향상</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">요약 보기</TabsTrigger>
          <TabsTrigger value="activity">활동 대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">
                {currentMonthly?.objective || "현재 먼슬리 없음"}
              </h3>
              <Badge variant="outline">
                D-
                {currentMonthly
                  ? Math.max(
                      0,
                      Math.ceil(
                        (currentMonthly.endDate.getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex justify-between text-sm">
                <span>달성률: {stats.completionRate}%</span>
                <span>
                  {(() => {
                    if (!currentMonthly) return "0/0";
                    const counts = getMonthlyTaskCounts(currentMonthly);
                    return `${counts.completed}/${counts.total}`;
                  })()}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {currentMonthly
                  ? `${formatDate(currentMonthly.startDate)} ~ ${formatDate(
                      currentMonthly.endDate
                    )}`
                  : "기간 없음"}
              </span>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/monthly">
                  자세히 보기
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="올해 완료"
              value={stats.completedThisYear}
              description="올해 완료한 먼슬리"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="올해 보상"
              value={stats.rewardsReceived}
              description="올해 받은 보상"
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-3 font-bold">다음 월간 준비</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">6월 월간 시작까지</p>
                <p className="text-xs text-muted-foreground">
                  예정 프로젝트 2개
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
                D-
                {currentMonthly
                  ? Math.max(
                      0,
                      Math.ceil(
                        (currentMonthly.endDate.getTime() -
                          new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href="/monthly/new">준비하기</Link>
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="올해 집중시간"
              value={`${stats.totalFocusTime}시간`}
              description="올해 완료한 태스크 기준"
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="완료율"
              value={`${stats.completionRate}%`}
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.changeRate}% ↑</span>
                </div>
              }
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">Area 활동 비중</h3>
            <div className="h-64">
              <AreaActivityChart data={areaActivityData} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">월간 비교</h3>
            <div className="h-64">
              {monthlyComparisonData.length > 0 ? (
                <MonthlyComparisonChart data={monthlyComparisonData} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <p className="mb-2">완료된 월간 데이터가 없습니다</p>
                  <p className="text-xs">
                    월간을 완료하면 비교 차트가 표시됩니다
                  </p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
