"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressCard } from "@/components/widgets/progress-card";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { UncategorizedStatsCard } from "@/components/widgets/uncategorized-stats-card";
import { MonthlyComparisonChart } from "@/components/widgets/chapter-comparison-chart";
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
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Play,
  Settings,
  BarChart3,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Task } from "@/lib/types";

// 모든 함수들을 새로운 구조에서 import
import {
  fetchAllProjectsByUserId,
  fetchUncategorizedResourcesByUserId,
  getOrCreateUncategorizedArea,
  getTaskCountsByProjectId,
  getTaskCountsForMultipleProjects,
  fetchProjectsByMonthlyId,
  fetchCurrentMonthlyProjects,
  getTodayTasks,
  toggleTaskCompletion,
  toggleTaskCompletionInSubcollection,
  fetchAllMonthliesByUserId,
  fetchYearlyActivityStats,
} from "@/lib/firebase/index";

import { getMonthlyStatus, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import Image from "next/image";

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState("today");
  const { toast } = useToast();
  const router = useRouter();
  const { translate, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();

  // 태스크 완료/미완료 토글 함수
  const handleTaskToggle = async (task: Task) => {
    try {
      // 태스크가 서브컬렉션에 있는지 확인 (projectId가 있으면 서브컬렉션)
      if (task.projectId) {
        await toggleTaskCompletionInSubcollection(task.projectId, task.id);
      } else {
        await toggleTaskCompletion(task.id);
      }

      // 쿼리 무효화하여 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: ["todayTasks", user?.uid] });

      toast({
        title: task.done ? "태스크 미완료 처리" : "태스크 완료 처리",
        description: task.done
          ? "태스크를 미완료로 변경했습니다."
          : "태스크를 완료로 변경했습니다.",
      });
    } catch (error) {
      console.error("태스크 토글 실패:", error);
      toast({
        title: "오류 발생",
        description: "태스크 상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

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

      // 현재 먼슬리
      currentMonthly: translate("home.currentMonthly"),
      noMonthly: translate("home.noMonthly"),
      noMonthlyDescription: translate("home.noMonthlyDescription"),
      createMonthly: translate("home.createMonthly"),
      reward: translate("home.reward"),
      noReward: translate("home.noReward"),
      progress: translate("home.progress"),
      progressSuffix: translate("home.progressSuffix"),
      daysLeft: translate("home.daysLeft"),

      completed: translate("home.completed"),
      inProgress: translate("home.inProgress"),

      // 프로젝트
      addProject: translate("home.addProject"),
      area: translate("home.area"),
      addedMidway: translate("home.addedMidway"),
      showMore: translate("home.showMore"),
      showMoreSuffix: translate("home.showMoreSuffix"),

      // AI 계획 생성
      aiPlanGenerator: translate("home.aiPlanGenerator"),
      aiPlanGeneratorDescription: translate("home.aiPlanGeneratorDescription"),
      generateWithAI: translate("home.generateWithAI"),
      aiPlanGeneratorFeatures: {
        goalAnalysis: translate("home.aiPlanGeneratorFeatures.goalAnalysis"),
        timeConstraints: translate(
          "home.aiPlanGeneratorFeatures.timeConstraints"
        ),
        autoGeneration: translate(
          "home.aiPlanGeneratorFeatures.autoGeneration"
        ),
      },

      // 오늘의 할 일
      todayTasks: translate("home.todayTasks"),
      todayTasksEmpty: translate("home.todayTasksEmpty"),
      todayTasksEmptyDescription: translate("home.todayTasksEmptyDescription"),

      // 빠른 액션
      quickActions: translate("home.quickActions"),
      newProject: translate("home.newProject"),
      addResource: translate("home.addResource"),
      newMonthly: translate("home.newMonthly"),

      // 대시보드
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

      // 로그인
      loginRequired: translate("home.loginRequired"),
      loginRequiredDescription: translate("home.loginRequiredDescription"),
    }),
    [translate]
  );

  // 로그인 상태 확인
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

  // 모든 프로젝트를 가져오기 (Today's Tasks에서 프로젝트 정보 표시용)
  const { data: allProjects = [], isLoading: allProjectsLoading } = useQuery({
    queryKey: ["allProjects", user?.uid],
    queryFn: () => (user ? fetchAllProjectsByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 오늘의 task들
  const { data: todayTasks = [], isLoading: todayTasksLoading } = useQuery({
    queryKey: ["todayTasks", user?.uid],
    queryFn: () => (user ? getTodayTasks(user.uid) : []),
    enabled: !!user,
  });

  // 먼슬리 데이터 (현재 먼슬리 정보와 대시보드용)
  const { data: monthlies = [], isLoading: monthliesLoading } = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: () => (user ? fetchAllMonthliesByUserId(user.uid) : []),
    enabled: !!user,
  });

  // Lazy Loading: Dashboard 탭이 활성화될 때만 실행
  const { data: yearlyStats } = useQuery({
    queryKey: ["yearlyStats", user?.uid],
    queryFn: () =>
      user
        ? fetchYearlyActivityStats(user.uid, new Date().getFullYear())
        : null,
    enabled: !!user && activeTab === "dashboard",
  });

  // 미분류 리소스만 가져오기 (최적화)
  const { data: uncategorizedResources = [] } = useQuery({
    queryKey: ["uncategorizedResources", user?.uid],
    queryFn: () => (user ? fetchUncategorizedResourcesByUserId(user.uid) : []),
    enabled: !!user,
  });

  // 현재 진행 중인 먼슬리를 날짜 기반으로 선택
  const currentMonthly =
    monthlies.find((monthly) => {
      const status = getMonthlyStatus(monthly);
      return status === "in_progress";
    }) || null;

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

    const data = {
      name: `${startDate.getMonth() + 1}월`,
      completion: completionRate,
      focusHours: focusHours,
    };

    return data;
  });

  // 현재 먼슬리 정보 계산
  const startDate = currentMonthly
    ? formatDate(new Date(currentMonthly.startDate), currentLanguage)
    : "";
  const endDate = currentMonthly
    ? formatDate(new Date(currentMonthly.endDate), currentLanguage)
    : "";

  // 월 뱃지용 월 추출
  const getMonthBadge = (date: Date) => {
    const month = new Date(date).getMonth() + 1;
    if (currentLanguage === "ko") {
      return `${month}월`;
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
      return monthNames[month - 1];
    }
  };

  // 먼슬리 진행률 계산 - connectedProjects를 사용하여 정확한 계산
  let total = 0;
  let actualDoneCount = 0;
  let progress = 0;

  if (currentMonthly && currentMonthly.keyResults) {
    total = currentMonthly.keyResults.length;
    actualDoneCount = currentMonthly.keyResults.filter(
      (kr) => kr.isCompleted
    ).length;
    progress = total > 0 ? Math.round((actualDoneCount / total) * 100) : 0;
  }

  // 남은 일수 계산
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = currentMonthly
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentMonthly.endDate).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // 디버깅: D-day 계산 정보 (개발 환경에서만)
  if (process.env.NODE_ENV === "development" && currentMonthly) {
    console.log("D-day 계산 정보:", {
      today: today.toISOString(),
      endDate: currentMonthly.endDate,
      endDateParsed: new Date(currentMonthly.endDate).toISOString(),
      daysLeft,
      currentMonthly: {
        id: currentMonthly.id,
        objective: currentMonthly.objective,
        startDate: currentMonthly.startDate,
        endDate: currentMonthly.endDate,
      },
    });
  }
  const changeRate = 0; // 추후 통계 fetch로 대체

  // 미분류 항목 통계 계산
  const uncategorizedProjects = allProjects.filter(
    (project) => !project.areaId
  ).length;

  return (
    <div className="container max-w-md px-4 py-6">
      {/* 헤더 섹션 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 relative overflow-hidden rounded-full border-4 border-primary/20 bg-secondary">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Profile Picture"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <CharacterAvatar level={5} />
              )}
            </div>
          </div>
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
      <Card className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-700/50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {texts.aiPlanGenerator}
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                {texts.aiPlanGeneratorDescription}
              </p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
              <CheckCircle className="h-4 w-4" />
              <span>{texts.aiPlanGeneratorFeatures.goalAnalysis}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
              <CheckCircle className="h-4 w-4" />
              <span>{texts.aiPlanGeneratorFeatures.timeConstraints}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
              <CheckCircle className="h-4 w-4" />
              <span>{texts.aiPlanGeneratorFeatures.autoGeneration}</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/ai-plan-generator")}
            className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {texts.generateWithAI}
          </Button>
        </div>
      </Card>

      {/* 미분류 항목 통계 */}
      <UncategorizedStatsCard
        uncategorizedProjects={uncategorizedProjects}
        uncategorizedResources={uncategorizedResources.length}
        totalAreas={0}
      />

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">{texts.todayTab}</TabsTrigger>
          <TabsTrigger value="dashboard">{texts.dashboardTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="mt-4 space-y-6">
          {/* 현재 먼슬리 정보 */}
          {currentMonthly ? (
            <Card className="p-4 border border-border hover:shadow-sm transition-shadow bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className="text-xs bg-primary/10 text-primary border-primary/20"
                    >
                      {getMonthBadge(currentMonthly.startDate)}
                    </Badge>
                    <h3 className="text-lg font-semibold">
                      {currentMonthly.objective}
                    </h3>
                  </div>
                  {currentMonthly.objective && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {currentMonthly.objective}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDate(currentMonthly.startDate, currentLanguage)} -{" "}
                      {formatDate(currentMonthly.endDate, currentLanguage)}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/monthly/${currentMonthly.id}`}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Key Results Progress */}
              {currentMonthly.keyResults &&
                currentMonthly.keyResults.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Key Results</span>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        {
                          currentMonthly.keyResults.filter(
                            (kr) => kr.isCompleted
                          ).length
                        }
                        /{currentMonthly.keyResults.length}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${progress}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

              {/* 보상 정보 */}
              {currentMonthly.reward && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Award className="h-4 w-4" />
                  <span>{currentMonthly.reward}</span>
                </div>
              )}

              {/* D-day 정보 */}
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">D-{daysLeft}</span>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center border-dashed border-border bg-card/80 dark:bg-card/60">
              <div className="mb-3 text-2xl">📅</div>
              <h3 className="mb-2 font-medium">{texts.noMonthly}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {texts.noMonthlyDescription}
              </p>
              <Button onClick={() => router.push("/monthly/new")}>
                <Plus className="h-4 w-4 mr-2" />
                {texts.createMonthly}
              </Button>
            </Card>
          )}

          {/* 오늘의 할 일 */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-bold">
                {texts.todayTasks} ({todayTasks.length}개)
              </h3>
            </div>

            <div className="space-y-2">
              {todayTasks.length > 0 ? (
                todayTasks.map((task, index) => {
                  const project = allProjects.find(
                    (p) => p.id === task.projectId
                  );
                  return (
                    <Card
                      key={task.id}
                      className={`p-3 transition-all duration-200 hover:shadow-md ${
                        task.done ? "bg-green-50/50 dark:bg-green-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 인덱스 번호 */}
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {index + 1}
                          </span>
                        </div>
                        {/* 완료 상태 토글 버튼 */}
                        <button
                          onClick={() => handleTaskToggle(task)}
                          className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                        >
                          {task.done ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground hover:text-green-600 hover:fill-green-100" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`text-sm font-medium transition-all duration-200 ${
                                task.done
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                          {/* 프로젝트명을 별도 행으로 표시 */}
                          {project && (
                            <div className="mb-1">
                              <span className="text-xs text-muted-foreground">
                                {project.title}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(task.date, currentLanguage)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {typeof task.duration === "string"
                                  ? parseFloat(task.duration)
                                  : task.duration}
                                시간
                              </span>
                            </div>
                          </div>
                        </div>
                        {/* 프로젝트로 연결되는 OUTlink 버튼 */}
                        {project && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="flex-shrink-0 h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Link href={`/para/projects/${project.id}`}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              ) : (
                <Card className="p-6 text-center border-dashed border-border bg-card/80 dark:bg-card/60">
                  <div className="mb-3 text-2xl">📝</div>
                  <h3 className="mb-2 font-medium">{texts.todayTasksEmpty}</h3>
                  <p className="text-sm text-muted-foreground">
                    {texts.todayTasksEmptyDescription}
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
                onClick={() => router.push("/monthly/new")}
                className="h-16 flex flex-col gap-1 hover:bg-primary/5 hover:border-primary/30 transition-colors"
              >
                <Target className="h-5 w-5" />
                <span className="text-sm">{texts.newMonthly}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
