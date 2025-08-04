"use client";

import { useState, useEffect } from "react";
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
} from "@/lib/firebase";
import { getLoopStatus, formatDate } from "@/lib/utils";

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const [showAllProjects, setShowAllProjects] = useState(false);

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

  const { data: resources = [] } = useQuery({
    queryKey: ["resources", user?.uid],
    queryFn: () => (user ? fetchAllResourcesByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 오늘 마감인 프로젝트들
  const { data: todayDeadlineProjects = [] } = useQuery({
    queryKey: ["todayDeadlineProjects", user?.uid],
    queryFn: () => (user ? getTodayDeadlineProjects(user.uid) : []),
    enabled: !!user,
  });

  // 오늘 마감 프로젝트의 태스크 개수 가져오기 (배치 최적화)
  const { data: todayProjectTaskCounts = {} } = useQuery({
    queryKey: ["todayProjectTaskCounts", user?.uid],
    queryFn: async () => {
      if (!user?.uid || todayDeadlineProjects.length === 0) return {};

      const projectIds = todayDeadlineProjects.map((project) => project.id);
      return await getTaskCountsForMultipleProjects(projectIds);
    },
    enabled: !!user && todayDeadlineProjects.length > 0,
  });

  // 연간 통계 데이터
  const { data: yearlyStats } = useQuery({
    queryKey: ["yearlyStats", user?.uid],
    queryFn: () =>
      user
        ? fetchYearlyActivityStats(user.uid, new Date().getFullYear())
        : null,
    enabled: !!user,
  });

  // 브라우저 콘솔에서 사용할 수 있도록 전역 함수로 등록 (개발용)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      user?.uid &&
      process.env.NODE_ENV === "development"
    ) {
      // 개발 환경에서만 디버깅 함수들을 전역에 등록
      (window as any).debugUser = user;
      (window as any).debugAreas = areas;
      (window as any).debugProjects = projects;
      (window as any).debugLoops = loops;
      (window as any).debugResources = resources;
    }
  }, [user?.uid, areas, projects, loops, resources]);

  const isLoading = loading || projectsLoading || loopsLoading;

  if (loading || isLoading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인이 필요합니다.</div>;

  // 현재 진행 중인 루프를 날짜 기반으로 선택
  const currentLoop =
    loops && loops.length > 0
      ? loops.find((loop) => getLoopStatus(loop) === "in_progress") || null
      : null;
  // 현재 루프에 연결된 프로젝트만 필터링
  const currentLoopProjects =
    currentLoop && projects
      ? projects.filter((p) => currentLoop.projectIds?.includes(p.id))
      : [];

  // progress, total, daysLeft, changeRate 등 계산
  const progress =
    currentLoop && currentLoop.targetCount > 0
      ? Math.round((currentLoop.doneCount / currentLoop.targetCount) * 100)
      : 0;
  const total = currentLoop?.targetCount || 0;
  const startDate = currentLoop?.startDate
    ? formatDate(currentLoop.startDate)
    : "-";
  const endDate = currentLoop?.endDate ? formatDate(currentLoop.endDate) : "-";
  const today = new Date();
  const daysLeft = currentLoop?.endDate
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
            안녕하세요,{" "}
            {user?.displayName || user?.email?.split("@")[0] || "루퍼"}님!
          </h1>
          <p className="text-muted-foreground">오늘도 성장하는 하루 되세요.</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>전월 대비 {changeRate}% 향상</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">요약 보기</TabsTrigger>
          <TabsTrigger value="dashboard">활동 대시보드</TabsTrigger>
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
              <h2 className="text-xl font-bold">현재 루프</h2>
            </div>

            <Card className="relative overflow-hidden border-2 border-primary/20 p-4">
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary/10 px-2 py-1 text-xs">
                D-{daysLeft}
              </div>
              <h3 className="mb-2 text-lg font-bold">
                {currentLoop?.title || "루프 없음"}
              </h3>
              <div className="mb-4 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>🎁 보상: {currentLoop?.reward || "없음"}</span>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span>진행률: {progress}%</span>
                <span>
                  {currentLoop?.doneCount || 0}/{total}
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
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>전월 대비 {changeRate}% 향상</span>
              </div>
            </Card>
          </section>

          {/* 오늘 마감 가이드 */}
          {todayDeadlineProjects.length > 0 && (
            <section className="mb-6">
              <Card className="border-orange-200 bg-orange-50/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <h3 className="font-medium text-orange-800">오늘 마감</h3>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  {todayDeadlineProjects.length}개 프로젝트가 오늘 마감입니다.
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
                            return `${taskCount.completedTasks}/${taskCount.totalTasks} 완료`;
                          }
                          return "진행 중";
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
              <h2 className="text-xl font-bold">현재 루프 프로젝트</h2>
              <Link href="/loop/new">
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {currentLoopProjects.length === 0 ? (
                <Card className="p-4 text-center">
                  <div className="mb-2 text-4xl">🎯</div>
                  <h3 className="mb-1 font-medium">프로젝트가 없습니다</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    현재 루프에 연결된 프로젝트가 없습니다.
                  </p>
                  <Link href="/para/projects/new">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      프로젝트 추가
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
                          Area: {getAreaName(project.areaId)}
                        </span>
                        {project.addedMidway ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 text-xs"
                          >
                            🔥 루프 중 추가됨
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-xs"
                          >
                            현재 루프 연결됨
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
                      더보기 ({currentLoopProjects.length - 3}개)
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="rounded-lg border bg-muted/20 p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">📊 연간 활동 통계</h2>
            <p className="text-sm text-muted-foreground">
              올해 설정한 목표와 달성한 성과를 확인하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="집중 시간"
              value={
                yearlyStats
                  ? `${Math.round(yearlyStats.totalFocusTime / 60)}시간`
                  : "0시간"
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
              title="완료율"
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
              title="누적 루프"
              value={yearlyStats?.completedLoops || 0}
              description="완료한 루프 수"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="받은 보상"
              value={yearlyStats?.totalRewards || 0}
              description="달성한 보상 수"
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">Area 활동 비중</h3>
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
            <h3 className="mb-4 font-bold">루프 비교</h3>
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
            <p>
              📊 활동 대시보드는 매월 1일 오전 4시에 자동으로 업데이트됩니다.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
