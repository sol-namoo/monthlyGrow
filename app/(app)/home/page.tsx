"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressCard } from "@/components/widgets/progress-card";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { ChapterComparisonChart } from "@/components/widgets/chapter-comparison-chart";
import { UncategorizedStatsCard } from "@/components/widgets/uncategorized-stats-card";
import { ChapterCard } from "@/components/widgets/chapter-card";
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
  BookOpen,
  Plus,
  Sparkles,
  Target,
  Zap,
  Lightbulb,
  Rocket,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Play,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  fetchAllChaptersByUserId,
  fetchAllResourcesByUserId,
  getOrCreateUncategorizedArea,
  getTodayDeadlineProjects,
  getTaskCountsByProjectId,
  getTaskCountsForMultipleProjects,
  fetchYearlyActivityStats,
  fetchProjectsByChapterId,
  fetchCurrentChapterProjects,
  getTodayTasks,
} from "@/lib/firebase";
import { getChapterStatus, formatDate } from "@/lib/utils";
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
      todayTab: translate("home.tabs.today"),
      dashboardTab: translate("home.tabs.dashboard"),

      // 현재 챕터
      currentChapter: translate("home.currentChapter"),
      noChapter: translate("home.noChapter"),
      noChapterDescription: translate("home.noChapterDescription"),
      createChapter: translate("home.createChapter"),
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
      currentChapterProjects: translate("home.currentChapterProjects"),
      noProjects: translate("home.noProjects"),
      noProjectsDescription: translate("home.noProjectsDescription"),
      addProject: translate("home.addProject"),
      area: translate("home.area"),
      addedMidway: translate("home.addedMidway"),
      showMore: translate("home.showMore"),
      showMoreSuffix: translate("home.showMoreSuffix"),

      // AI 계획 생성
      aiPlanGenerator: translate("home.aiPlanGenerator"),
      aiPlanGeneratorDescription: translate("home.aiPlanGeneratorDescription"),
      generateWithAI: translate("home.generateWithAI"),

      // 오늘의 할 일
      todayTasks: translate("home.todayTasks"),
      todayTasksEmpty: translate("home.todayTasksEmpty"),
      todayTasksEmptyDescription: translate("home.todayTasksEmptyDescription"),
      todayDeadlineProjects: translate("home.todayDeadlineProjects"),
      todayDeadlineProjectsEmpty: translate("home.todayDeadlineProjectsEmpty"),
      todayDeadlineProjectsEmptyDescription: translate(
        "home.todayDeadlineProjectsEmptyDescription"
      ),
      inProgressProjects: translate("home.inProgressProjects"),
      quickActions: translate("home.quickActions"),
      newProject: translate("home.newProject"),
      addResource: translate("home.addResource"),
      newChapter: translate("home.newChapter"),
      viewAllProjects: translate("home.viewAllProjects"),

      // 대시보드
      yearlyStats: translate("home.yearlyStats"),
      yearlyStatsDescription: translate("home.yearlyStatsDescription"),
      focusTime: translate("home.focusTime"),
      hours: translate("home.hours"),
      completionRate: translate("home.completionRate"),
      completedChapters: translate("home.completedChapters"),
      completedChaptersDescription: translate(
        "home.completedChaptersDescription"
      ),
      totalRewards: translate("home.totalRewards"),
      totalRewardsDescription: translate("home.totalRewardsDescription"),
      areaActivity: translate("home.areaActivity"),
      chapterComparison: translate("home.chapterComparison"),
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

  // 사용자 ID 디버깅 (개발 환경에서만)
  useEffect(() => {
    if (user && process.env.NODE_ENV === "development") {
      console.log("🏠 홈페이지 사용자 정보:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerId,
        isAnonymous: user.isAnonymous,
      });
    }
  }, [user]);

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

  // 현재 챕터를 먼저 가져와서 해당 챕터의 프로젝트만 가져오기
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ["chapters", user?.uid],
    queryFn: () => (user ? fetchAllChaptersByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 현재 진행 중인 챕터를 날짜 기반으로 선택
  const currentChapter =
    chapters.find((chapter) => {
      const status = getChapterStatus(chapter);
      return status === "in_progress";
    }) || null;

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["currentChapterProjects", user?.uid, currentChapter?.id],
    queryFn: () =>
      user && currentChapter
        ? fetchCurrentChapterProjects(user.uid, currentChapter.id)
        : [],
    enabled: !!user && !!currentChapter,
  });

  // 현재 챕터에 연결된 프로젝트들 (이미 필터링된 상태)
  const currentChapterProjects = projects;

  // 오늘의 task들
  const { data: todayTasks = [], isLoading: todayTasksLoading } = useQuery({
    queryKey: ["todayTasks", user?.uid, currentChapter?.id],
    queryFn: () =>
      user && currentChapter ? getTodayTasks(user.uid, currentChapter.id) : [],
    enabled: !!user && !!currentChapter,
  });

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
      todayDeadlineProjects.map((p) => p.id).sort(), // 정렬해서 키 안정성 보장
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

  // 현재 챕터 정보 계산
  const startDate = currentChapter
    ? formatDate(new Date(currentChapter.startDate), currentLanguage)
    : "";
  const endDate = currentChapter
    ? formatDate(new Date(currentChapter.endDate), currentLanguage)
    : "";

  // 챕터 진행률 계산 - connectedProjects를 사용하여 정확한 계산
  let total = 0;
  let actualDoneCount = 0;
  let progress = 0;

  if (currentChapter && currentChapter.connectedProjects) {
    total = currentChapter.connectedProjects.reduce(
      (sum, project) => sum + (project.chapterTargetCount || 0),
      0
    );
    actualDoneCount = currentChapter.connectedProjects.reduce(
      (sum, project) => sum + (project.chapterDoneCount || 0),
      0
    );
    progress = total > 0 ? Math.round((actualDoneCount / total) * 100) : 0;
  }

  // 남은 일수 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = currentChapter
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentChapter.endDate).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const changeRate = 0; // 추후 통계 fetch로 대체

  // 프로젝트 표시 개수 제한 (정책: 3개 이하면 모두 표시, 4개 이상이면 3개만 표시 + 더보기 버튼)
  const displayedProjects = showAllProjects
    ? currentChapterProjects
    : currentChapterProjects.slice(0, 3);
  const hasMoreProjects = currentChapterProjects.length > 3;

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
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <CharacterAvatar level={5} />
          <div className="flex-1">
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
      </div>

      {/* AI 계획 생성기 독립 블록 */}
      <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">
                {texts.aiPlanGenerator}
              </h3>
              <p className="text-sm text-purple-700">
                {texts.aiPlanGeneratorDescription}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <CheckCircle className="h-4 w-4" />
              <span>목표 분석 및 단계별 계획 수립</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <CheckCircle className="h-4 w-4" />
              <span>시간 제약 및 난이도 고려</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700">
              <CheckCircle className="h-4 w-4" />
              <span>프로젝트와 작업 자동 생성</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/ai-plan-generator")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {texts.generateWithAI}
          </Button>
        </div>
      </Card>

      {/* 미분류 항목 통계 */}
      <UncategorizedStatsCard
        uncategorizedProjects={uncategorizedProjects}
        uncategorizedResources={uncategorizedResources}
        totalAreas={areas.length}
      />

      {/* 탭 네비게이션 */}
      <Tabs defaultValue="today" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">{texts.todayTab}</TabsTrigger>
          <TabsTrigger value="dashboard">{texts.dashboardTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-6">
          {/* 현재 챕터 정보 */}
          {currentChapter ? (
            <ChapterCard
              chapter={currentChapter}
              daysLeft={daysLeft}
              progress={progress}
              completedTasks={actualDoneCount}
              totalTasks={total}
              currentLanguage={currentLanguage}
              texts={{
                daysLeft: texts.daysLeft,
                reward: texts.reward,
                noReward: texts.noReward,
                progress: texts.progress,
                progressSuffix: texts.progressSuffix,
              }}
              href={`/chapter/${currentChapter.id}`}
            />
          ) : (
            <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold">{texts.noChapter}</h3>
              <p className="mb-6 text-xs text-muted-foreground max-w-sm mx-auto">
                {texts.noChapterDescription}
              </p>
              <Button onClick={() => router.push("/chapter/new")}>
                <Plus className="mr-2 h-4 w-4" />
                {texts.createChapter}
              </Button>
            </Card>
          )}

          {/* 오늘의 task들 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">
                {texts.todayTasks} ({todayTasks.length}개)
              </h3>
            </div>

            <div className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="p-4 border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.duration}일 소요
                        </p>
                      </div>
                      <Badge
                        variant={task.done ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {task.done ? "완료" : "진행중"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        예상 소요시간: {task.duration}일
                      </span>
                      <span className="text-muted-foreground">
                        {task.done ? "✅ 완료됨" : "⏳ 진행중"}
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center border-dashed border-border">
                  <div className="mb-3 text-2xl">📝</div>
                  <h3 className="mb-2 font-medium">{texts.todayTasksEmpty}</h3>
                  <p className="text-sm text-muted-foreground">
                    {texts.todayTasksEmptyDescription}
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* 오늘 마감 프로젝트들 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-bold">
                {texts.todayDeadlineProjects} ({todayDeadlineProjects.length}개)
              </h3>
            </div>

            <div className="space-y-3">
              {todayDeadlineProjects.length > 0 ? (
                todayDeadlineProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 border border-border hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{project.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getAreaName(project.areaId)} 영역
                        </p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        마감
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        목표: {project.targetCount}개
                      </span>
                      <span className="text-muted-foreground">
                        완료: {project.completedTasks}개
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-6 text-center border-dashed border-border">
                  <div className="mb-3 text-2xl">🎯</div>
                  <h3 className="mb-2 font-medium">
                    {texts.todayDeadlineProjectsEmpty}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {texts.todayDeadlineProjectsEmptyDescription}
                  </p>
                </Card>
              )}
            </div>
          </section>

          {/* 빠른 액션 */}
          <section>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              {texts.quickActions}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/para/projects/new")}
                className="h-16 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="text-sm">{texts.newProject}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/para/resources/new")}
                className="h-16 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <BookOpen className="h-5 w-5" />
                <span className="text-sm">{texts.addResource}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/chapter/new")}
                className="h-16 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <Target className="h-5 w-5" />
                <span className="text-sm">{texts.newChapter}</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/ai-plan-generator")}
                className="h-16 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <Sparkles className="h-5 w-5" />
                <span className="text-sm">{texts.generateWithAI}</span>
              </Button>
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="rounded-lg border bg-muted/20 p-4 mb-4">
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
              icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title={texts.completedChapters}
              value={yearlyStats?.completedChapters || 0}
              description={texts.completedChaptersDescription}
              icon={<BookOpen className="h-4 w-4 text-muted-foreground" />}
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
            <h3 className="mb-4 font-bold">{texts.chapterComparison}</h3>
            <div className="h-64">
              <ChapterComparisonChart
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
