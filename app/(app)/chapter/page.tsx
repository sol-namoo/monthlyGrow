"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
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
  Target,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Sparkles,
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
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Chapter, Retrospective } from "@/lib/types";
import {
  fetchAllChaptersByUserId,
  fetchProjectCountsByChapterIds,
  fetchChaptersWithProjectCounts,
  fetchProjectsByChapterId,
  fetchAllAreasByUserId,
  fetchAllResourcesByUserId,
  updateChapter,
} from "@/lib/firebase";
import {
  formatDate,
  getChapterStatus,
  calculateChapterProgressInfo,
} from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ProgressCard } from "@/components/widgets/progress-card";
import { ChapterCard } from "@/components/widgets/chapter-card";
import { ProjectCard } from "@/components/widgets/project-card";

// Lazy loaded components for other tabs
const FutureChaptersTab = lazy(() => import("./components/FutureChaptersTab"));
const PastChaptersTab = lazy(() => import("./components/PastChaptersTab"));

function ChapterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 상태 관리
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "completionRate">(
    "latest"
  );
  const [currentTab, setCurrentTab] = useState(
    searchParams.get("tab") || "current"
  );

  // useEffect를 useQuery 전에 호출
  useEffect(() => {
    setCurrentTab(searchParams.get("tab") || "current");
  }, [searchParams]);

  // Firestore에서 데이터 가져오기
  const { data: chapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ["chapters", user?.uid],
    queryFn: () => fetchAllChaptersByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 현재 챕터의 프로젝트들 (Current 탭에서만 로드)
  const currentChapter =
    chapters.find((chapter) => getChapterStatus(chapter) === "in_progress") ||
    null;

  const {
    data: currentChapterProjects = [],
    isLoading: currentProjectsLoading,
  } = useQuery({
    queryKey: ["currentChapterProjects", user?.uid, currentChapter?.id],
    queryFn: () =>
      currentChapter && user
        ? fetchProjectsByChapterId(currentChapter.id, user.uid)
        : [],
    enabled: !!user && !!currentChapter && currentTab === "current",
  });

  // 영역 데이터 (Current 탭에서만 로드)
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => (user ? fetchAllAreasByUserId(user.uid) : []),
    enabled: !!user && currentTab === "current",
  });

  // 리소스 데이터 (Current 탭에서만 로드)
  const { data: resources = [] } = useQuery({
    queryKey: ["resources", user?.uid],
    queryFn: () => (user ? fetchAllResourcesByUserId(user.uid) : []),
    enabled: !!user && currentTab === "current",
  });

  // 각 챕터의 프로젝트 개수 (Future/Past 탭에서만 로드)
  const { data: chapterProjectCounts = {}, isLoading: projectCountsLoading } =
    useQuery({
      queryKey: ["chapterProjectCounts", user?.uid],
      queryFn: async () => {
        if (!user?.uid || chapters.length === 0) return {};
        const chapterIds = chapters.map((chapter) => chapter.id);
        const counts = await fetchProjectCountsByChapterIds(
          chapterIds,
          user.uid
        );
        return counts;
      },
      enabled:
        !!user?.uid &&
        chapters.length > 0 &&
        (currentTab === "future" || currentTab === "past"),
    });

  // 초기 로딩 상태
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
  const futureChapters = chapters.filter(
    (chapter) => getChapterStatus(chapter) === "planned"
  );
  const pastChapters = chapters.filter(
    (chapter) => getChapterStatus(chapter) === "ended"
  );

  // 정렬
  futureChapters.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  pastChapters.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // 계산된 값들을 위한 헬퍼 함수들
  const getCompletionRate = (chapter: Chapter) => {
    const progressInfo = calculateChapterProgressInfo(chapter);
    return Math.round(progressInfo.progress * 100);
  };

  const getTaskCounts = (chapter: Chapter) => {
    const progressInfo = calculateChapterProgressInfo(chapter);
    return {
      completed: progressInfo.doneCounts,
      total: progressInfo.targetCounts,
    };
  };

  const getProjectCount = (chapter: Chapter) => {
    return chapterProjectCounts[chapter.id] || 0;
  };

  const handleTabChange = (value: string) => {
    router.push(`/chapter?tab=${value}`, { scroll: false });
  };

  const handleCreateChapter = (monthOffset: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("monthOffset", monthOffset.toString());
    router.push(`/chapter/new?${searchParams.toString()}`);
  };

  // 현재 챕터 통계 계산
  const currentChapterStats = currentChapter
    ? {
        totalProjects: currentChapterProjects.length,
        completedProjects: currentChapterProjects.filter(
          (p) => p.completedTasks >= (p.targetCount || p.completedTasks)
        ).length,
        totalTasks: currentChapterProjects.reduce(
          (sum, p) => sum + (p.targetCount || p.completedTasks),
          0
        ),
        completedTasks: currentChapterProjects.reduce(
          (sum, p) => sum + p.completedTasks,
          0
        ),
        progress:
          currentChapterProjects.length > 0
            ? Math.round(
                (currentChapterProjects.reduce(
                  (sum, p) => sum + p.completedTasks,
                  0
                ) /
                  currentChapterProjects.reduce(
                    (sum, p) => sum + (p.targetCount || p.completedTasks),
                    0
                  )) *
                  100
              )
            : 0,
        daysLeft: Math.max(
          0,
          Math.ceil(
            (currentChapter.endDate.getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      }
    : null;

  // areaId → area명 매핑 함수
  const getAreaName = (areaId?: string) =>
    areaId ? areas.find((a) => a.id === areaId)?.name || "-" : "-";

  const texts = {
    currentChapter: translate("chapter.currentChapter.title"),
    daysLeft: translate("chapter.currentChapter.daysLeft"),
    reward: translate("chapter.currentChapter.reward"),
    noReward: translate("chapter.currentChapter.noReward"),
    progress: translate("chapter.currentChapter.progress"),
    progressSuffix: translate("chapter.currentChapter.progressSuffix"),
    addedMidway: translate("chapter.currentChapter.addedMidway"),
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("chapter.title")}</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">
            {translate("chapter.tabs.current")}
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

        <TabsContent value="current" className="mt-6 space-y-6">
          {currentChapter ? (
            <>
              {/* 현재 챕터 헤더 - 새로운 디자인 */}
              <section>
                <div className="flex items-center gap-3 justify-between mb-4 ">
                  <h2 className="text-xl font-bold">{texts.currentChapter}</h2>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => router.push(`/chapter/${currentChapter.id}`)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {translate("chapter.currentChapter.viewDetails")}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <ChapterCard
                  chapter={currentChapter}
                  daysLeft={currentChapterStats?.daysLeft || 0}
                  progress={currentChapterStats?.progress || 0}
                  completedTasks={currentChapterStats?.completedTasks || 0}
                  totalTasks={currentChapterStats?.totalTasks || 0}
                  currentLanguage={currentLanguage}
                  texts={{
                    daysLeft: texts.daysLeft,
                    reward: texts.reward,
                    noReward: texts.noReward,
                    progress: texts.progress,
                    progressSuffix: texts.progressSuffix,
                  }}
                  href={`/chapter/${currentChapter.id}`}
                  showLink={false}
                />
              </section>

              {/* 프로젝트 목록 */}
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {translate("chapter.currentChapter.projectCount").replace(
                      "{count}",
                      currentChapterProjects.length.toString()
                    )}
                  </h3>
                </div>

                {currentProjectsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : currentChapterProjects.length === 0 ? (
                  <Card className="p-6 text-center">
                    <div className="mb-3 text-4xl">🎯</div>
                    <h3 className="mb-2 font-medium">
                      {translate("chapter.currentChapter.noProjectsTitle")}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {translate(
                        "chapter.currentChapter.noProjectsDescription"
                      )}
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => router.push("/ai-plan-generator")}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        {translate("chapter.currentChapter.aiPlanGenerator")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/para/projects/new")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {translate("chapter.currentChapter.manualAddProject")}
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {currentChapterProjects.map((project) => {
                      // 챕터별 목표 데이터 찾기
                      const chapterProject =
                        currentChapter?.connectedProjects?.find(
                          (cp) => cp.projectId === project.id
                        );

                      return (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          mode="chapter"
                          chapterTargetCount={
                            chapterProject?.chapterTargetCount
                          }
                          chapterDoneCount={chapterProject?.chapterDoneCount}
                          showBothProgress={
                            settings?.chapterProjectCardDisplay === "both"
                          }
                          showTargetButtons={true}
                          onTargetCountChange={(projectId, newCount) => {
                            // 챕터의 connectedProjects 업데이트
                            const updatedConnectedProjects =
                              currentChapter?.connectedProjects?.map((cp) =>
                                cp.projectId === projectId
                                  ? { ...cp, chapterTargetCount: newCount }
                                  : cp
                              ) || [];

                            // 챕터 업데이트
                            updateChapter(currentChapter?.id || "", {
                              connectedProjects: updatedConnectedProjects,
                            })
                              .then(() => {
                                // 캐시 무효화
                                queryClient.invalidateQueries({
                                  queryKey: ["chapters"],
                                });
                                queryClient.invalidateQueries({
                                  queryKey: ["currentChapterProjects"],
                                });

                                toast({
                                  title: "목표 개수 업데이트 완료",
                                  description:
                                    "챕터별 목표 개수가 업데이트되었습니다.",
                                });
                              })
                              .catch((error) => {
                                console.error(
                                  "목표 개수 업데이트 실패:",
                                  error
                                );
                                toast({
                                  title: "업데이트 실패",
                                  description:
                                    "목표 개수 업데이트에 실패했습니다.",
                                  variant: "destructive",
                                });
                              });
                          }}
                        >
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {getAreaName(project.areaId)}{" "}
                              {translate("chapter.currentChapter.areaSuffix")}
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
                        </ProjectCard>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
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
        </TabsContent>

        <TabsContent value="future" className="mt-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <FutureChaptersTab
              chapters={futureChapters}
              projectCounts={chapterProjectCounts}
              projectCountsLoading={projectCountsLoading}
              onCreateChapter={handleCreateChapter}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <PastChaptersTab
              chapters={pastChapters}
              projectCounts={chapterProjectCounts}
              projectCountsLoading={projectCountsLoading}
            />
          </Suspense>
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
