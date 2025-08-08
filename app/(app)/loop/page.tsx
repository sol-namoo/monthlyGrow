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
  fetchProjectCountsByLoopIds,
  fetchLoopsWithProjectCounts,
} from "@/lib/firebase";
import { formatDate, getLoopStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

function LoopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();

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

  // Firestore에서 데이터 가져오기 - 임시로 이전 방식 사용
  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 각 루프의 프로젝트 개수만 효율적으로 가져오기
  const { data: loopProjectCounts = {}, isLoading: projectCountsLoading } =
    useQuery({
      queryKey: ["loopProjectCounts", user?.uid],
      queryFn: async () => {
        if (!user?.uid || loops.length === 0) return {};
        const loopIds = loops.map((loop) => loop.id);
        console.log("🔍 프로젝트 개수 조회 - 루프 IDs:", loopIds);
        const counts = await fetchProjectCountsByLoopIds(loopIds, user.uid);
        console.log("📊 프로젝트 개수 결과:", counts);
        return counts;
      },
      enabled: !!user?.uid && loops.length > 0,
    });

  // 디버깅: 각 루프의 프로젝트 상태 출력
  useEffect(() => {
    if (loops.length > 0) {
      console.log("🔍 루프별 프로젝트 상태:");
      loops.forEach((loop) => {
        const projectCount = loopProjectCounts[loop.id] || 0;
        const status = getLoopStatus(loop);
        console.log(`- ${loop.title} (${status}): ${projectCount}개 프로젝트`);
      });
    }
  }, [loops, loopProjectCounts]);

  // 디버깅: 실제 루프별 프로젝트 쿼리 결과 확인
  useEffect(() => {
    if (user?.uid && loops.length > 0) {
      console.log("🔍 루프별 프로젝트 쿼리 디버깅 시작");
      console.log("총 루프 수:", loops.length);

      loops.forEach(async (loop) => {
        console.log(`\n📊 루프 "${loop.title}" (${loop.id}) 조회 중...`);

        try {
          // 실제 쿼리 실행
          const projects = await fetchProjectsByLoopId(loop.id, user.uid);
          console.log(`- 연결된 프로젝트 수: ${projects.length}개`);

          if (projects.length > 0) {
            console.log("- 연결된 프로젝트들:");
            projects.forEach((project, index) => {
              console.log(
                `  ${index + 1}. ${project.title} (ID: ${project.id})`
              );
              console.log(`     connectedLoops:`, project.connectedLoops);
            });
          } else {
            console.log("- 연결된 프로젝트 없음");
          }
        } catch (error) {
          console.error(`❌ 루프 "${loop.title}" 조회 실패:`, error);
        }
      });
    }
  }, [user?.uid, loops]);

  // 각 루프의 태스크 개수 데이터 가져오기 (현재 탭의 루프만)
  const { data: loopTaskCounts = {}, isLoading: taskCountsLoading } = useQuery({
    queryKey: [
      "loopTaskCounts",
      user?.uid,
      currentTab,
      loops.length,
      Object.keys(loopProjectCounts).join(","),
    ],
    queryFn: async () => {
      const taskCountsMap: {
        [loopId: string]: { totalTasks: number; completedTasks: number };
      } = {};

      // 현재 탭에 해당하는 루프만 처리
      let targetLoops: Loop[] = [];

      if (currentTab === "active") {
        const currentLoop = loops.find(
          (loop) => getLoopStatus(loop) === "in_progress"
        );
        if (currentLoop) targetLoops = [currentLoop];
      } else if (currentTab === "future") {
        targetLoops = loops.filter((loop) => getLoopStatus(loop) === "planned");
      } else if (currentTab === "past") {
        targetLoops = loops.filter((loop) => getLoopStatus(loop) === "ended");
      }

      for (const loop of targetLoops) {
        const projectCount = loopProjectCounts[loop.id] || 0;

        if (projectCount > 0) {
          // 프로젝트가 있을 때만 상세 조회
          const projects = await fetchProjectsByLoopId(loop.id, user?.uid);
          if (projects.length > 0) {
            const projectIds = projects.map((p) => p.id);
            const taskCounts = await getTaskCountsForMultipleProjects(
              projectIds
            );
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
        } else {
          taskCountsMap[loop.id] = { totalTasks: 0, completedTasks: 0 };
        }
      }
      return taskCountsMap;
    },
    enabled: !!user?.uid && loops.length > 0 && !projectCountsLoading,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: true, // 윈도우 포커스 시 재페칭
  });

  // 초기 로딩 상태 (사용자 인증, 루프 목록 로딩)
  if (userLoading || loopsLoading) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20">
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
    return loopProjectCounts[loop.id] || 0;
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
        <h1 className="text-2xl font-bold">{translate("loop.title")}</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            {translate("loop.tabs.active")}
          </TabsTrigger>
          <TabsTrigger value="future" className="relative">
            {translate("loop.tabs.future")}
            {futureLoops.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {futureLoops.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="relative">
            {translate("loop.tabs.past")}
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
              {currentLoop && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {getLoopStatus(currentLoop) === "ended"
                      ? translate("loop.currentLoop.status.completed")
                      : translate("loop.currentLoop.status.inProgress")}
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
                    <span>
                      {translate("loop.currentLoop.reward")}:{" "}
                      {currentLoop.reward}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>
                        {translate("loop.currentLoop.completionRate")}:{" "}
                        {getCompletionRate(currentLoop)}%
                      </span>
                      <span>
                        {taskCountsLoading ? (
                          <Skeleton className="h-4 w-12" />
                        ) : (
                          (() => {
                            const counts = getTaskCounts(currentLoop);
                            return `${counts.completed}/${counts.total}`;
                          })()
                        )}
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
                      {formatDate(currentLoop.startDate, currentLanguage)} ~{" "}
                      {formatDate(currentLoop.endDate, currentLanguage)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">
                      {translate("loop.currentLoop.focusAreas")}
                    </h4>
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
                      {translate("loop.currentLoop.projects")} (
                      {getProjectCount(currentLoop)}개)
                    </h4>
                    {projectCountsLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : getProjectCount(currentLoop) > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {translate(
                          "loop.currentLoop.projectsConnected"
                        ).replace(
                          "{count}",
                          getProjectCount(currentLoop).toString()
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {translate("loop.currentLoop.noProjects")}
                      </p>
                    )}
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
                <h3 className="mb-2 text-lg font-bold">
                  {translate("loop.currentLoop.noLoop.title")}
                </h3>
                <p className="mb-6 text-xs text-muted-foreground max-w-sm mx-auto">
                  {translate("loop.currentLoop.noLoop.description")}
                </p>
                <Button onClick={() => handleCreateLoop(0)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("loop.currentLoop.noLoop.button")}
                </Button>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="future" className="mt-6 space-y-8">
          {/* 미래 루프 헤더 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {translate("loop.futureLoops.totalCount").replace(
                "{count}",
                futureLoops.length.toString()
              )}
            </div>
            <Button onClick={() => handleCreateLoop(1)}>
              <Plus className="mr-2 h-4 w-4" />
              {translate("loop.futureLoops.button")}
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
                              currentLanguage === "ko" ? "ko-KR" : "en-UK",
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
                        <span>
                          {translate("loop.futureLoops.reward")}: {loop.reward}
                        </span>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(loop.startDate, currentLanguage)} ~{" "}
                          {formatDate(loop.endDate, currentLanguage)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="mb-2 font-medium">
                          {translate("loop.futureLoops.target")}
                        </h4>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>
                            {translate("loop.futureLoops.targetCount").replace(
                              "{count}",
                              loop.targetCount.toString()
                            )}
                          </span>
                          <span>
                            {projectCountsLoading ? (
                              <Skeleton className="h-4 w-8" />
                            ) : (
                              translate(
                                "loop.futureLoops.connectedProjects"
                              ).replace(
                                "{count}",
                                getProjectCount(loop).toString()
                              )
                            )}
                          </span>
                        </div>
                        {projectCountsLoading ? (
                          <Skeleton className="h-4 w-48" />
                        ) : getProjectCount(loop) === 0 ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {translate("loop.futureLoops.noProjects")}
                          </p>
                        ) : null}
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
              <h3 className="mb-2 text-lg font-bold">
                {translate("loop.futureLoops.noLoops.title")}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                {translate("loop.futureLoops.noLoops.description")}
              </p>
              <Button onClick={() => handleCreateLoop(1)}>
                <Plus className="mr-2 h-4 w-4" />
                {translate("loop.futureLoops.noLoops.button")}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-8">
          {/* 지난 루프 헤더 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {translate("loop.pastLoops.totalCount").replace(
                "{count}",
                pastLoops.length.toString()
              )}
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
                            {translate("loop.pastLoops.achievement").replace(
                              "{rate}",
                              getCompletionRate(loop).toString()
                            )}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(loop.startDate, currentLanguage)} ~{" "}
                          {formatDate(loop.endDate, currentLanguage)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>
                            {translate("loop.pastLoops.completionRate")}:{" "}
                            {getCompletionRate(loop)}%
                          </span>
                          <span>
                            {taskCountsLoading ? (
                              <Skeleton className="h-4 w-12" />
                            ) : (
                              (() => {
                                const counts = getTaskCounts(loop);
                                return `${counts.completed}/${counts.total}`;
                              })()
                            )}
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
                        <span>
                          {projectCountsLoading ? (
                            <Skeleton className="h-4 w-8" />
                          ) : (
                            translate(
                              "loop.pastLoops.connectedProjects"
                            ).replace(
                              "{count}",
                              getProjectCount(loop).toString()
                            )
                          )}
                        </span>
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
                {translate("loop.pastLoops.noLoops.title")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {translate("loop.pastLoops.noLoops.description")}
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
