"use client";

import { useState, useEffect, useMemo } from "react";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressCard } from "@/components/widgets/progress-card";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { LoopComparisonChart } from "@/components/widgets/loop-comparison-chart";
import { UncategorizedStatsCard } from "@/components/widgets/uncategorized-stats-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  fetchAllLoopsByUserId,
  fetchAllResourcesByUserId,
  getOrCreateUncategorizedArea,
  getTodayDeadlineProjects,
  checkAndAutoCompleteProjects,
  getTaskCountsByProjectId,
  getTaskCountsForMultipleProjects,
  fetchYearlyActivityStats,
  fetchProjectsByLoopId,
} from "@/lib/firebase";
import { getLoopStatus, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { translate, currentLanguage } = useLanguage();

  // 번역 텍스트 메모이제이션
  const texts = useMemo(
    () => ({
      // 인사말
      greeting: translate("home.greeting"),
      greetingSuffix: translate("home.greetingSuffix"),
      noName: translate("home.noName"),
      encouragement: translate("home.encouragement"),
      improvement: translate("home.improvement"),
      improvementSuffix: translate("home.improvementSuffix"),

      // 탭
      summaryTab: translate("home.tabs.summary"),
      dashboardTab: translate("home.tabs.dashboard"),

      // 현재 루프
      currentLoop: translate("home.currentLoop"),
      noLoop: translate("home.noLoop"),
      reward: translate("home.reward"),
      noReward: translate("home.noReward"),
      progress: translate("home.progress"),
      progressSuffix: translate("home.progressSuffix"),
      daysLeft: translate("home.daysLeft"),

      // 오늘 마감
      todayDeadline: translate("home.todayDeadline"),
      todayDeadlineDescription: translate("home.todayDeadlineDescription"),
      completed: translate("home.completed"),
      inProgress: translate("home.inProgress"),

      // 프로젝트
      currentLoopProjects: translate("home.currentLoopProjects"),
      noProjects: translate("home.noProjects"),
      noProjectsDescription: translate("home.noProjectsDescription"),
      addProject: translate("home.addProject"),
      area: translate("home.area"),
      addedMidway: translate("home.addedMidway"),
      showMore: translate("home.showMore"),
      showMoreSuffix: translate("home.showMoreSuffix"),

      // 대시보드
      yearlyStats: translate("home.yearlyStats"),
      yearlyStatsDescription: translate("home.yearlyStatsDescription"),
      focusTime: translate("home.focusTime"),
      hours: translate("home.hours"),
      completionRate: translate("home.completionRate"),
      completedLoops: translate("home.completedLoops"),
      completedLoopsDescription: translate("home.completedLoopsDescription"),
      totalRewards: translate("home.totalRewards"),
      totalRewardsDescription: translate("home.totalRewardsDescription"),
      areaActivity: translate("home.areaActivity"),
      loopComparison: translate("home.loopComparison"),
      dashboardUpdate: translate("home.dashboardUpdate"),

      // 로그인
      loginRequired: translate("home.loginRequired"),
      loginRequiredDescription: translate("home.loginRequiredDescription"),
    }),
    [translate]
  );

  // 로그인 상태 확인 및 리다이렉션
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: texts.loginRequired,
        description: texts.loginRequiredDescription,
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, loading, toast, router, texts]);

  // Firestore에서 직접 데이터 가져오기
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: async () => {
      if (!user) return [];
      const userAreas = await fetchAllAreasByUserId(user.uid);

      // "미분류" 영역이 없으면 생성
      const hasUncategorized = userAreas.some((area) => area.name === "미분류");
      if (!hasUncategorized) {
        try {
          await getOrCreateUncategorizedArea(user.uid);
          // 영역 목록을 다시 가져옴
          return await fetchAllAreasByUserId(user.uid);
        } catch (error) {
          console.error("미분류 영역 생성 실패:", error);
        }
      }

      return userAreas;
    },
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => (user ? fetchAllProjectsByUserId(user.uid) : []),
    enabled: !!user,
  });

  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => (user ? fetchAllLoopsByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 현재 진행 중인 루프를 날짜 기반으로 선택
  const currentLoop =
    loops.find((loop) => {
      const status = getLoopStatus(loop);
      return status === "in_progress";
    }) || null;

  // 현재 루프에 연결된 프로젝트들
  const currentLoopProjects = projects.filter(
    (project) =>
      project.loopId === currentLoop?.id ||
      project.connectedLoops?.includes(currentLoop?.id || "")
  );

  // 오늘 마감인 프로젝트들
  const { data: todayDeadlineProjects = [] } = useQuery({
    queryKey: ["todayDeadlineProjects", user?.uid],
    queryFn: () => (user ? getTodayDeadlineProjects(user.uid) : []),
    enabled: !!user,
  });

  // 오늘 마감 프로젝트들의 태스크 통계
  const { data: todayProjectTaskCounts = {} } = useQuery({
    queryKey: [
      "todayProjectTaskCounts",
      todayDeadlineProjects.map((p) => p.id),
    ],
    queryFn: () =>
      getTaskCountsForMultipleProjects(todayDeadlineProjects.map((p) => p.id)),
    enabled: todayDeadlineProjects.length > 0,
  });

  // 연간 통계
  const { data: yearlyStats } = useQuery({
    queryKey: ["yearlyStats", user?.uid],
    queryFn: () =>
      user
        ? fetchYearlyActivityStats(user.uid, new Date().getFullYear())
        : null,
    enabled: !!user,
  });

  // 리소스 데이터
  const { data: resources = [] } = useQuery({
    queryKey: ["resources", user?.uid],
    queryFn: () => (user ? fetchAllResourcesByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 자동 완료 체크
  useEffect(() => {
    if (user && projects.length > 0) {
      checkAndAutoCompleteProjects(user.uid);
    }
  }, [user, projects]);

  // 현재 루프 정보 계산
  const startDate = currentLoop
    ? formatDate(new Date(currentLoop.startDate), currentLanguage)
    : "";
  const endDate = currentLoop
    ? formatDate(new Date(currentLoop.endDate), currentLanguage)
    : "";

  const total = currentLoopProjects.reduce(
    (sum, project) => sum + project.target,
    0
  );
  const actualDoneCount = currentLoopProjects.reduce(
    (sum, project) => sum + project.completedTasks,
    0
  );
  const progress = total > 0 ? Math.round((actualDoneCount / total) * 100) : 0;

  // 남은 일수 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = currentLoop
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentLoop.endDate).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const changeRate = 0; // 추후 통계 fetch로 대체

  // 프로젝트 표시 개수 제한 (정책: 3개 이하면 모두 표시, 4개 이상이면 3개만 표시 + 더보기 버튼)
  const displayedProjects = showAllProjects
    ? currentLoopProjects
    : currentLoopProjects.slice(0, 3);
  const hasMoreProjects = currentLoopProjects.length > 3;

  // areaId → area명 매핑 함수
  const getAreaName = (areaId?: string) =>
    areaId ? areas.find((a) => a.id === areaId)?.name || "-" : "-";

  // 미분류 항목 통계 계산
  const uncategorizedArea = areas.find((area) => area.name === "미분류");
  const uncategorizedProjects = projects.filter(
    (project) => project.areaId === uncategorizedArea?.id
  ).length;
  const uncategorizedResources = resources.filter(
    (resource) => resource.areaId === uncategorizedArea?.id
  ).length;

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <CharacterAvatar level={5} />
        <div>
          <h1 className="text-2xl font-bold">
            {texts.greeting}{" "}
            {user?.displayName || user?.email?.split("@")[0] || texts.noName}
            {texts.greetingSuffix}
          </h1>
          <p className="text-muted-foreground">{texts.encouragement}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>
              {texts.improvement} {changeRate}
              {texts.improvementSuffix}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">{texts.summaryTab}</TabsTrigger>
          <TabsTrigger value="dashboard">{texts.dashboardTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-6">
          {/* 미분류 항목 통계 카드 */}
          <UncategorizedStatsCard
            uncategorizedProjects={uncategorizedProjects}
            uncategorizedResources={uncategorizedResources}
            totalAreas={areas.length}
          />

          <section>
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">{texts.currentLoop}</h2>
            </div>

            <Card className="relative overflow-hidden border-2 border-primary/20 p-4">
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary/10 px-2 py-1 text-xs">
                {texts.daysLeft}
                {daysLeft}
              </div>
              <h3 className="mb-2 text-lg font-bold">
                {currentLoop?.title || texts.noLoop}
              </h3>
              <div className="mb-4 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>
                  {texts.reward}: {currentLoop?.reward || texts.noReward}
                </span>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span>
                  {texts.progress}: {progress}
                  {texts.progressSuffix}
                </span>
                <span>
                  {actualDoneCount}/{total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {startDate} ~ {endDate}
                </span>
              </div>
            </Card>
          </section>

          {/* 오늘 마감 가이드 */}
          {todayDeadlineProjects.length > 0 && (
            <section className="mb-6">
              <Card className="border-orange-200 bg-orange-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <h3 className="font-medium text-orange-800">
                    {texts.todayDeadline}
                  </h3>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  {todayDeadlineProjects.length}
                  {texts.todayDeadlineDescription}
                </p>
                <div className="space-y-2">
                  {todayDeadlineProjects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {project.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs border-orange-300 text-orange-700"
                      >
                        {(() => {
                          const taskCount = todayProjectTaskCounts[project.id];
                          if (taskCount) {
                            return `${taskCount.completedTasks}/${taskCount.totalTasks} ${texts.completed}`;
                          }
                          return texts.inProgress;
                        })()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          )}

          {/* 현재 루프 프로젝트들 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">{texts.currentLoopProjects}</h2>
            </div>

            <div className="space-y-3">
              {currentLoopProjects.length === 0 ? (
                <Card className="p-4 text-center">
                  <div className="mb-2 text-4xl">🎯</div>
                  <h3 className="mb-1 font-medium">{texts.noProjects}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {texts.noProjectsDescription}
                  </p>
                  <Link href="/para/projects/new">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {texts.addProject}
                    </Button>
                  </Link>
                </Card>
              ) : (
                <>
                  {displayedProjects.map((project) => (
                    <ProgressCard
                      key={project.id}
                      title={project.title}
                      progress={project.completedTasks}
                      total={project.target}
                    >
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {texts.area}: {getAreaName(project.areaId)}
                        </span>
                        {project.addedMidway && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 text-xs"
                          >
                            {texts.addedMidway}
                          </Badge>
                        )}
                      </div>
                    </ProgressCard>
                  ))}

                  {!showAllProjects && hasMoreProjects && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => setShowAllProjects(true)}
                    >
                      {texts.showMore} ({currentLoopProjects.length - 3}
                      {texts.showMoreSuffix})
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="rounded-lg border bg-muted/20 p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">{texts.yearlyStats}</h2>
            <p className="text-sm text-muted-foreground">
              {texts.yearlyStatsDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title={texts.focusTime}
              value={
                yearlyStats
                  ? `${Math.round(yearlyStats.totalFocusTime / 60)}${
                      texts.hours
                    }`
                  : `0${texts.hours}`
              }
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    {yearlyStats
                      ? Math.round(yearlyStats.averageCompletionRate)
                      : 0}
                    % ↑
                  </span>
                </div>
              }
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
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
                  <span>
                    {yearlyStats
                      ? Math.round(yearlyStats.averageCompletionRate)
                      : 0}
                    % ↑
                  </span>
                </div>
              }
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title={texts.completedLoops}
              value={yearlyStats?.completedLoops || 0}
              description={texts.completedLoopsDescription}
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title={texts.totalRewards}
              value={yearlyStats?.totalRewards || 0}
              description={texts.totalRewardsDescription}
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
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

          <Card className="p-4">
            <h3 className="mb-4 font-bold">{texts.loopComparison}</h3>
            <div className="h-64">
              <LoopComparisonChart
                data={
                  yearlyStats?.monthlyProgress
                    ? Object.entries(yearlyStats.monthlyProgress).map(
                        ([month, stats]: [string, any]) => ({
                          name: `${parseInt(month)}월`,
                          completion: stats.completionRate,
                          focusHours: Math.round(stats.focusTime / 60),
                        })
                      )
                    : []
                }
              />
            </div>
          </Card>

          <div className="text-center text-xs text-muted-foreground mt-4">
            <p>{texts.dashboardUpdate}</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
