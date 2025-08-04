"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Star,
  Bookmark,
  Clock,
  CalendarDays,
  Target,
  AlertCircle,
  Calendar,
  Zap,
  Gift,
  Edit,
  Sparkles,
  Plus,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/feedback/Loading";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Loop, Retrospective } from "@/lib/types";
import {
  fetchAllLoopsByUserId,
  fetchProjectsByLoopId,
  getTaskCountsForMultipleProjects,
} from "@/lib/firebase";
import { formatDate, formatDateNumeric, getLoopStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

function LoopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);

  // 상태 관리
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "completionRate">(
    "latest"
  );
  const [currentTab, setCurrentTab] = useState(
    searchParams.get("tab") || "active"
  );

  // useEffect를 useQuery 전에 호출
  useEffect(() => {
    setCurrentTab(searchParams.get("tab") || "active");
  }, [searchParams]);

  // Firestore에서 데이터 가져오기
  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 각 루프의 프로젝트 데이터 가져오기
  const { data: loopProjects = {}, isLoading: projectsLoading } = useQuery({
    queryKey: ["loopProjects", user?.uid],
    queryFn: async () => {
      const projectsMap: { [loopId: string]: any[] } = {};
      for (const loop of loops) {
        const projects = await fetchProjectsByLoopId(loop.id);
        projectsMap[loop.id] = projects;
      }
      return projectsMap;
    },
    enabled: !!user?.uid && loops.length > 0,
  });

  // 각 루프의 태스크 개수 데이터 가져오기
  const { data: loopTaskCounts = {}, isLoading: taskCountsLoading } = useQuery({
    queryKey: ["loopTaskCounts", user?.uid],
    queryFn: async () => {
      const taskCountsMap: {
        [loopId: string]: { totalTasks: number; completedTasks: number };
      } = {};
      for (const loop of loops) {
        const projects = loopProjects[loop.id] || [];
        if (projects.length > 0) {
          const projectIds = projects.map((p) => p.id);
          const taskCounts = await getTaskCountsForMultipleProjects(projectIds);
          const totalTasks = Object.values(taskCounts).reduce(
            (sum, counts) => sum + counts.totalTasks,
            0
          );
          const completedTasks = Object.values(taskCounts).reduce(
            (sum, counts) => sum + counts.completedTasks,
            0
          );
          taskCountsMap[loop.id] = { totalTasks, completedTasks };
        } else {
          taskCountsMap[loop.id] = { totalTasks: 0, completedTasks: 0 };
        }
      }
      return taskCountsMap;
    },
    enabled:
      !!user?.uid && loops.length > 0 && Object.keys(loopProjects).length > 0,
  });

  // 로딩 상태
  if (userLoading || loopsLoading || projectsLoading || taskCountsLoading) {
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

  // 루프 상태별 분류
  const currentLoop =
    loops.find((loop) => getLoopStatus(loop) === "in_progress") || null;
  const futureLoops = loops.filter((loop) => getLoopStatus(loop) === "planned");
  const pastLoops = loops.filter((loop) => getLoopStatus(loop) === "ended");

  // 정렬: 미래 루프는 시작일 순, 과거 루프는 최신순
  futureLoops.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  pastLoops.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // 계산된 값들을 위한 헬퍼 함수들
  const getCompletionRate = (loop: Loop) => {
    const taskCounts = loopTaskCounts[loop.id];
    if (taskCounts && taskCounts.totalTasks > 0) {
      return Math.round(
        (taskCounts.completedTasks / taskCounts.totalTasks) * 100
      );
    }
    return 0;
  };

  const getTaskCounts = (loop: Loop) => {
    const taskCounts = loopTaskCounts[loop.id];
    return {
      completed: taskCounts?.completedTasks || 0,
      total: taskCounts?.totalTasks || 0,
    };
  };

  const getProjectCount = (loop: Loop) => {
    return loopProjects[loop.id]?.length || 0;
  };

  const handleTabChange = (value: string) => {
    router.push(`/loop?tab=${value}`, { scroll: false });
  };

  const handleCreateLoop = (monthOffset: number) => {
    // monthOffset에 따라 루프 생성 페이지로 이동
    const searchParams = new URLSearchParams();
    searchParams.set("monthOffset", monthOffset.toString());
    router.push(`/loop/new?${searchParams.toString()}`);
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">월간 루프</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">진행 중</TabsTrigger>
          <TabsTrigger value="future" className="relative">
            미래 계획
            {futureLoops.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {futureLoops.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="relative">
            지난 루프
            {pastLoops.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {pastLoops.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-8">
          {/* 현재 루프 섹션 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">현재 루프</h2>
              {currentLoop && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {getLoopStatus(currentLoop) === "ended"
                      ? "완료됨"
                      : "진행 중"}
                  </span>
                </div>
              )}
            </div>
            {currentLoop ? (
              <Link href={`/loop/${currentLoop.id}`}>
                <Card className="border-2 border-primary/20 p-4 mb-6 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{currentLoop.title}</h3>
                    <div className="flex items-center gap-2">
                      {getLoopStatus(currentLoop) === "ended" ? (
                        <Badge variant="default">완료</Badge>
                      ) : (
                        <Badge variant="secondary">
                          D-
                          {Math.max(
                            0,
                            Math.ceil(
                              (currentLoop.endDate.getTime() -
                                new Date().getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )}
                        </Badge>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-purple-500" />
                    <span>보상: {currentLoop.reward}</span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>달성률: {getCompletionRate(currentLoop)}%</span>
                      <span>
                        {(() => {
                          const counts = getTaskCounts(currentLoop);
                          return `${counts.completed}/${counts.total}`;
                        })()}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-value"
                        style={{ width: `${getCompletionRate(currentLoop)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDateNumeric(currentLoop.startDate)} ~{" "}
                      {formatDateNumeric(currentLoop.endDate)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">중점 Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentLoop.focusAreas?.map((areaId) => (
                        <span
                          key={areaId}
                          className="rounded-full bg-primary/10 px-3 py-1 text-xs"
                        >
                          {areaId}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">
                      프로젝트 ({getProjectCount(currentLoop)}개)
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      🔗 프로젝트 {getProjectCount(currentLoop)}개 연결됨
                    </p>
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">현재 루프가 없어요</h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                  새로운 월간 루프를 만들어서 체계적인 성장을 시작해보세요.
                </p>
                <Button onClick={() => handleCreateLoop(0)}>
                  <Plus className="mr-2 h-4 w-4" />새 루프 만들기
                </Button>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="future" className="mt-6 space-y-8">
          {/* 미래 루프 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">미래 계획</h2>
            <Button onClick={() => handleCreateLoop(1)}>
              <Plus className="mr-2 h-4 w-4" />새 루프 만들기
            </Button>
          </div>

          {/* 미래 루프 리스트 */}
          {futureLoops.length > 0 ? (
            <div className="space-y-4">
              {futureLoops.map((loop, index) => (
                <div key={loop.id} className={index > 0 ? "mt-4" : ""}>
                  <Link href={`/loop/${loop.id}`}>
                    <Card className="border-2 border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{loop.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700"
                          >
                            {new Date(loop.startDate).toLocaleDateString(
                              "ko-KR",
                              {
                                month: "long",
                              }
                            )}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm">
                        <Gift className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        <span>보상: {loop.reward}</span>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDateNumeric(loop.startDate)} ~{" "}
                          {formatDateNumeric(loop.endDate)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="mb-2 font-medium">목표</h4>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>목표: {loop.targetCount}회</span>
                          <span>
                            연결된 프로젝트: {getProjectCount(loop)}개
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold">미래 루프가 없어요</h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                6개월 앞까지의 루프를 미리 만들어서 장기 계획을 세워보세요.
              </p>
              <Button onClick={() => handleCreateLoop(1)}>
                <Plus className="mr-2 h-4 w-4" />첫 번째 미래 루프 만들기
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-8">
          {/* 지난 루프 헤더 */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">지난 루프</h2>
            <div className="text-sm text-muted-foreground">
              총 {pastLoops.length}개
            </div>
          </div>

          {/* 지난 루프 리스트 */}
          {pastLoops.length > 0 ? (
            <div className="space-y-4">
              {pastLoops.map((loop, index) => (
                <div key={loop.id} className={index > 0 ? "mt-4" : ""}>
                  <Link href={`/loop/${loop.id}`}>
                    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{loop.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {getCompletionRate(loop)}% 달성
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDateNumeric(loop.startDate)} ~{" "}
                          {formatDateNumeric(loop.endDate)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>달성률: {getCompletionRate(loop)}%</span>
                          <span>
                            {(() => {
                              const counts = getTaskCounts(loop);
                              return `${counts.completed}/${counts.total}`;
                            })()}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{ width: `${getCompletionRate(loop)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>연결된 프로젝트: {getProjectCount(loop)}개</span>
                        {renderStars(loop.retrospective?.userRating)}
                      </div>
                    </Card>
                  </Link>
                </div>
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
                아직 완료된 루프가 없어요
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                첫 번째 루프를 시작해서 성취의 기록을 만들어보세요.
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoopPageContent />
    </Suspense>
  );
}
