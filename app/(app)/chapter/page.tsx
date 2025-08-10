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
  BookOpen,
  AlertCircle,
  Calendar,
  Zap,
  Award,
  Edit,
  BookOpen as BookOpenIcon,
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
import { Chapter, Retrospective } from "@/lib/types";
import {
  fetchAllChaptersByUserId,
  fetchProjectsByChapterId,
  getTaskCountsForMultipleProjects,
  fetchProjectCountsByChapterIds,
  fetchChaptersWithProjectCounts,
} from "@/lib/firebase";
import { formatDate, getChapterStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";

function ChapterPageContent() {
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
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ["chapters", user?.uid],
    queryFn: () => fetchAllChaptersByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 각 챕터의 프로젝트 개수만 효율적으로 가져오기
  const { data: chapterProjectCounts = {}, isLoading: projectCountsLoading } =
    useQuery({
      queryKey: ["chapterProjectCounts", user?.uid],
      queryFn: async () => {
        if (!user?.uid || chapters.length === 0) return {};
        const chapterIds = chapters.map((chapter) => chapter.id);
        console.log("🔍 프로젝트 개수 조회 - 챕터 IDs:", chapterIds);
        const counts = await fetchProjectCountsByChapterIds(
          chapterIds,
          user.uid
        );
        console.log("📊 프로젝트 개수 결과:", counts);
        return counts;
      },
      enabled: !!user?.uid && chapters.length > 0,
    });

  // 디버깅: 각 챕터의 프로젝트 상태 출력
  useEffect(() => {
    if (chapters.length > 0) {
      console.log("🔍 챕터별 프로젝트 상태:");
      chapters.forEach((chapter) => {
        const projectCount = chapterProjectCounts[chapter.id] || 0;
        const status = getChapterStatus(chapter);
        console.log(
          `- ${chapter.title} (${status}): ${projectCount}개 프로젝트`
        );
      });
    }
  }, [chapters, chapterProjectCounts]);

  // 디버깅: 실제 챕터별 프로젝트 쿼리 결과 확인
  useEffect(() => {
    if (user?.uid && chapters.length > 0) {
      console.log("🔍 챕터별 프로젝트 쿼리 디버깅 시작");
      console.log("총 챕터 수:", chapters.length);

      chapters.forEach(async (chapter) => {
        console.log(`\n📊 챕터 "${chapter.title}" (${chapter.id}) 조회 중...`);

        try {
          // 실제 쿼리 실행
          const projects = await fetchProjectsByChapterId(chapter.id, user.uid);
          console.log(`- 연결된 프로젝트 수: ${projects.length}개`);

          if (projects.length > 0) {
            console.log("- 연결된 프로젝트들:");
            projects.forEach((project, index) => {
              console.log(
                `  ${index + 1}. ${project.title} (ID: ${project.id})`
              );
              console.log(`     connectedChapters:`, project.connectedChapters);
            });
          } else {
            console.log("- 연결된 프로젝트 없음");
          }
        } catch (error) {
          console.error(`❌ 챕터 "${chapter.title}" 조회 실패:`, error);
        }
      });
    }
  }, [user?.uid, chapters]);

  // 각 챕터의 태스크 개수 데이터 가져오기 (현재 탭의 챕터만)
  const { data: chapterTaskCounts = {}, isLoading: taskCountsLoading } =
    useQuery({
      queryKey: [
        "chapterTaskCounts",
        user?.uid,
        currentTab,
        chapters.length,
        Object.keys(chapterProjectCounts).join(","),
      ],
      queryFn: async () => {
        const taskCountsMap: {
          [chapterId: string]: { totalTasks: number; completedTasks: number };
        } = {};

        // 현재 탭에 해당하는 챕터만 처리
        let targetChapters: Chapter[] = [];

        if (currentTab === "active") {
          const currentChapter = chapters.find(
            (chapter) => getChapterStatus(chapter) === "in_progress"
          );
          if (currentChapter) targetChapters = [currentChapter];
        } else if (currentTab === "future") {
          targetChapters = chapters.filter(
            (chapter) => getChapterStatus(chapter) === "planned"
          );
        } else if (currentTab === "past") {
          targetChapters = chapters.filter(
            (chapter) => getChapterStatus(chapter) === "ended"
          );
        }

        for (const chapter of targetChapters) {
          const projectCount = chapterProjectCounts[chapter.id] || 0;

          if (projectCount > 0) {
            // 프로젝트가 있을 때만 상세 조회
            const projects = await fetchProjectsByChapterId(
              chapter.id,
              user?.uid
            );
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
              taskCountsMap[chapter.id] = { totalTasks, completedTasks };
            } else {
              taskCountsMap[chapter.id] = { totalTasks: 0, completedTasks: 0 };
            }
          } else {
            taskCountsMap[chapter.id] = { totalTasks: 0, completedTasks: 0 };
          }
        }
        return taskCountsMap;
      },
      enabled: !!user?.uid && chapters.length > 0 && !projectCountsLoading,
      staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
      refetchOnWindowFocus: true, // 윈도우 포커스 시 재페칭
    });

  // 초기 로딩 상태 (사용자 인증, 챕터 목록 로딩)
  if (userLoading || chaptersLoading) {
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

  // 챕터 상태별 분류
  const currentChapter =
    chapters.find((chapter) => getChapterStatus(chapter) === "in_progress") ||
    null;
  const futureChapters = chapters.filter(
    (chapter) => getChapterStatus(chapter) === "planned"
  );
  const pastChapters = chapters.filter(
    (chapter) => getChapterStatus(chapter) === "ended"
  );

  // 정렬: 미래 챕터는 시작일 순, 과거 챕터는 최신순
  futureChapters.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  pastChapters.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // 계산된 값들을 위한 헬퍼 함수들
  const getCompletionRate = (chapter: Chapter) => {
    const taskCounts = chapterTaskCounts[chapter.id];
    if (taskCounts && taskCounts.totalTasks > 0) {
      return Math.round(
        (taskCounts.completedTasks / taskCounts.totalTasks) * 100
      );
    }
    return 0;
  };

  const getTaskCounts = (chapter: Chapter) => {
    const taskCounts = chapterTaskCounts[chapter.id];
    return {
      completed: taskCounts?.completedTasks || 0,
      total: taskCounts?.totalTasks || 0,
    };
  };

  const getProjectCount = (chapter: Chapter) => {
    return chapterProjectCounts[chapter.id] || 0;
  };

  const handleTabChange = (value: string) => {
    router.push(`/chapter?tab=${value}`, { scroll: false });
  };

  const handleCreateChapter = (monthOffset: number) => {
    // monthOffset에 따라 챕터 생성 페이지로 이동
    const searchParams = new URLSearchParams();
    searchParams.set("monthOffset", monthOffset.toString());
    router.push(`/chapter/new?${searchParams.toString()}`);
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
        <h1 className="text-2xl font-bold">{translate("chapter.title")}</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            {translate("chapter.tabs.active")}
          </TabsTrigger>
          <TabsTrigger value="future" className="relative">
            {translate("chapter.tabs.future")}
            {futureChapters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {futureChapters.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="relative">
            {translate("chapter.tabs.past")}
            {pastChapters.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {pastChapters.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6 space-y-8">
          {/* 현재 챕터 섹션 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              {currentChapter && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {getChapterStatus(currentChapter) === "ended"
                      ? translate("chapter.currentChapter.status.completed")
                      : translate("chapter.currentChapter.status.inProgress")}
                  </span>
                </div>
              )}
            </div>
            {currentChapter ? (
              <Link href={`/chapter/${currentChapter.id}`}>
                <Card className="border-2 border-primary/20 p-4 mb-6 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">
                      {currentChapter.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getChapterStatus(currentChapter) === "ended" ? (
                        <Badge variant="default">완료</Badge>
                      ) : (
                        <Badge variant="secondary">
                          D-
                          {Math.max(
                            0,
                            Math.ceil(
                              (currentChapter.endDate.getTime() -
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
                    <Award className="h-4 w-4 text-purple-500" />
                    <span>
                      {translate("chapter.currentChapter.reward")}:{" "}
                      {currentChapter.reward}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="mb-1 flex justify-between text-sm">
                      <span>
                        {translate("chapter.currentChapter.completionRate")}:{" "}
                        {getCompletionRate(currentChapter)}%
                      </span>
                      <span>
                        {taskCountsLoading ? (
                          <Skeleton className="h-4 w-12" />
                        ) : (
                          (() => {
                            const counts = getTaskCounts(currentChapter);
                            return `${counts.completed}/${counts.total}`;
                          })()
                        )}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-value"
                        style={{
                          width: `${getCompletionRate(currentChapter)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDate(currentChapter.startDate, currentLanguage)} ~{" "}
                      {formatDate(currentChapter.endDate, currentLanguage)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 font-medium">
                      {translate("chapter.currentChapter.focusAreas")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {currentChapter.focusAreas?.map((areaId) => (
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
                      {translate("chapter.currentChapter.projects")} (
                      {getProjectCount(currentChapter)}개)
                    </h4>
                    {projectCountsLoading ? (
                      <Skeleton className="h-4 w-32" />
                    ) : getProjectCount(currentChapter) > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        {translate(
                          "chapter.currentChapter.projectsConnected"
                        ).replace(
                          "{count}",
                          getProjectCount(currentChapter).toString()
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        {translate("chapter.currentChapter.noProjects")}
                      </p>
                    )}
                  </div>
                </Card>
              </Link>
            ) : (
              <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">
                  {translate("chapter.currentChapter.noChapter.title")}
                </h3>
                <p className="mb-6 text-xs text-muted-foreground max-w-sm mx-auto">
                  {translate("chapter.currentChapter.noChapter.description")}
                </p>
                <Button onClick={() => handleCreateChapter(0)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("chapter.currentChapter.noChapter.button")}
                </Button>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="future" className="mt-6 space-y-8">
          {/* 미래 챕터 헤더 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {translate("chapter.futureChapters.totalCount").replace(
                "{count}",
                futureChapters.length.toString()
              )}
            </div>
            <Button onClick={() => handleCreateChapter(1)}>
              <Plus className="mr-2 h-4 w-4" />
              {translate("chapter.futureChapters.button")}
            </Button>
          </div>

          {/* 미래 챕터 리스트 */}
          {futureChapters.length > 0 ? (
            <div className="space-y-4">
              {futureChapters.map((chapter, index) => (
                <div key={chapter.id} className={index > 0 ? "mt-4" : ""}>
                  <Link href={`/chapter/${chapter.id}`}>
                    <Card className="border-2 border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/30 p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{chapter.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-200 dark:border-purple-700"
                          >
                            {new Date(chapter.startDate).toLocaleDateString(
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
                        <Award className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                        <span>
                          {translate("chapter.futureChapters.reward")}:{" "}
                          {chapter.reward}
                        </span>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(chapter.startDate, currentLanguage)} ~{" "}
                          {formatDate(chapter.endDate, currentLanguage)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <h4 className="mb-2 font-medium">
                          {translate("chapter.futureChapters.target")}
                        </h4>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>
                            {translate(
                              "chapter.futureChapters.targetCount"
                            ).replace(
                              "{count}",
                              chapter.targetCount.toString()
                            )}
                          </span>
                          <span>
                            {projectCountsLoading ? (
                              <Skeleton className="h-4 w-8" />
                            ) : (
                              translate(
                                "chapter.futureChapters.connectedProjects"
                              ).replace(
                                "{count}",
                                getProjectCount(chapter).toString()
                              )
                            )}
                          </span>
                        </div>
                        {projectCountsLoading ? (
                          <Skeleton className="h-4 w-48" />
                        ) : getProjectCount(chapter) === 0 ? (
                          <p className="text-xs text-muted-foreground mt-1">
                            {translate("chapter.futureChapters.noProjects")}
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
                  <BookOpenIcon className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold">
                {translate("chapter.futureChapters.noChapters.title")}
              </h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                {translate("chapter.futureChapters.noChapters.description")}
              </p>
              <Button onClick={() => handleCreateChapter(1)}>
                <Plus className="mr-2 h-4 w-4" />
                {translate("chapter.futureChapters.noChapters.button")}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6 space-y-8">
          {/* 지난 챕터 헤더 */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {translate("chapter.pastChapters.totalCount").replace(
                "{count}",
                pastChapters.length.toString()
              )}
            </div>
          </div>

          {/* 지난 챕터 리스트 */}
          {pastChapters.length > 0 ? (
            <div className="space-y-4">
              {pastChapters.map((chapter, index) => (
                <div key={chapter.id} className={index > 0 ? "mt-4" : ""}>
                  <Link href={`/chapter/${chapter.id}`}>
                    <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold">{chapter.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {translate(
                              "chapter.pastChapters.achievement"
                            ).replace(
                              "{rate}",
                              getCompletionRate(chapter).toString()
                            )}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(chapter.startDate, currentLanguage)} ~{" "}
                          {formatDate(chapter.endDate, currentLanguage)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>
                            {translate("chapter.pastChapters.completionRate")}:{" "}
                            {getCompletionRate(chapter)}%
                          </span>
                          <span>
                            {taskCountsLoading ? (
                              <Skeleton className="h-4 w-12" />
                            ) : (
                              (() => {
                                const counts = getTaskCounts(chapter);
                                return `${counts.completed}/${counts.total}`;
                              })()
                            )}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{ width: `${getCompletionRate(chapter)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>
                          {projectCountsLoading ? (
                            <Skeleton className="h-4 w-8" />
                          ) : (
                            translate(
                              "chapter.pastChapters.connectedProjects"
                            ).replace(
                              "{count}",
                              getProjectCount(chapter).toString()
                            )
                          )}
                        </span>
                        {renderStars(chapter.retrospective?.userRating)}
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
                {translate("chapter.pastChapters.noChapters.title")}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {translate("chapter.pastChapters.noChapters.description")}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ChapterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChapterPageContent />
    </Suspense>
  );
}
