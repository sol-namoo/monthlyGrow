"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Plus,
  Star,
  Bookmark,
  Clock,
  Briefcase,
  Compass,
  Folder,
  Archive,
  Filter,
  CalendarDays,
  Heart,
  Brain,
  DollarSign,
  Users,
  Gamepad2,
  Dumbbell,
  BookOpen as BookOpenIcon,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Utensils,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
  ArrowUpDown,
  Loader2,
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
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/components/feedback/Loading";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjectStatus } from "@/lib/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchAllAreasByUserId,
  fetchProjectsByUserIdWithPaging,
  fetchResourcesByUserIdWithPaging,
  fetchArchivesByUserIdWithPaging,
  getTaskCountsForMultipleProjects,
} from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateShort } from "@/lib/utils";

function ParaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";
  const [user, userLoading] = useAuthState(auth);

  const handleTabChange = (value: string) => {
    router.push(`/para?tab=${value}`, { scroll: false });
  };

  // 필터링 및 정렬 상태
  const [projectFilter, setProjectFilter] = useState("all");
  const [projectSortBy, setProjectSortBy] = useState("latest");
  const [resourceSortBy, setResourceSortBy] = useState("latest");
  const [archiveSortBy, setArchiveSortBy] = useState("latest");
  const [filterType, setFilterType] = useState("all");

  // Areas는 한 번에 가져오기 (개수가 많지 않을 것으로 예상)
  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 프로젝트 무한 쿼리
  const {
    data: projectsData,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects,
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useInfiniteQuery({
    queryKey: ["projects", user?.uid, projectSortBy],
    queryFn: ({ pageParam }) =>
      fetchProjectsByUserIdWithPaging(
        user?.uid || "",
        10,
        pageParam?.lastDoc,
        projectSortBy
      ),
    enabled: !!user?.uid,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? { lastDoc: lastPage.lastDoc } : undefined,
    initialPageParam: { lastDoc: undefined },
  });

  // 리소스 무한 쿼리
  const {
    data: resourcesData,
    fetchNextPage: fetchNextResources,
    hasNextPage: hasNextResources,
    isFetchingNextPage: isFetchingNextResources,
    isLoading: resourcesLoading,
    refetch: refetchResources,
  } = useInfiniteQuery({
    queryKey: ["resources", user?.uid, resourceSortBy],
    queryFn: ({ pageParam }) =>
      fetchResourcesByUserIdWithPaging(
        user?.uid || "",
        10,
        pageParam?.lastDoc,
        resourceSortBy
      ),
    enabled: !!user?.uid,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? { lastDoc: lastPage.lastDoc } : undefined,
    initialPageParam: { lastDoc: undefined },
  });

  // 아카이브 무한 쿼리
  const {
    data: archivesData,
    fetchNextPage: fetchNextArchives,
    hasNextPage: hasNextArchives,
    isFetchingNextPage: isFetchingNextArchives,
    isLoading: archivesLoading,
    refetch: refetchArchives,
  } = useInfiniteQuery({
    queryKey: ["archives", user?.uid, archiveSortBy],
    queryFn: ({ pageParam }) =>
      fetchArchivesByUserIdWithPaging(
        user?.uid || "",
        10,
        pageParam?.lastDoc,
        archiveSortBy
      ),
    enabled: !!user?.uid,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? { lastDoc: lastPage.lastDoc } : undefined,
    initialPageParam: { lastDoc: undefined },
  });

  // 정렬 변경 시 쿼리 다시 실행
  useEffect(() => {
    if (user?.uid) {
      refetchProjects();
    }
  }, [projectSortBy, user?.uid, refetchProjects]);

  useEffect(() => {
    if (user?.uid) {
      refetchResources();
    }
  }, [resourceSortBy, user?.uid, refetchResources]);

  useEffect(() => {
    if (user?.uid) {
      refetchArchives();
    }
  }, [archiveSortBy, user?.uid, refetchArchives]);

  // 데이터 평탄화
  const allProjects =
    projectsData?.pages.flatMap((page) => page.projects) || [];
  const allResources =
    resourcesData?.pages.flatMap((page) => page.resources) || [];
  const allArchives =
    archivesData?.pages.flatMap((page) => page.archives) || [];

  // 프로젝트별 태스크 개수 가져오기 (배치 최적화)
  const { data: projectTaskCounts = {}, isLoading: taskCountsLoading } =
    useQuery({
      queryKey: ["projectTaskCounts", user?.uid, allProjects.length],
      queryFn: async () => {
        if (!user?.uid || allProjects.length === 0) return {};
        const projectIds = allProjects.map((project) => project.id);
        try {
          return await getTaskCountsForMultipleProjects(projectIds);
        } catch (error) {
          console.error("Failed to get batch task counts:", error);
          return {};
        }
      },
      enabled: !!user?.uid && allProjects.length > 0,
    });

  // 로딩 상태 - 프로젝트와 태스크 개수가 모두 로드될 때까지 스켈레톤 표시
  if (
    userLoading ||
    areasLoading ||
    (allProjects.length > 0 && taskCountsLoading)
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

  // 프로젝트 상태를 미리 계산하여 객체에 추가
  const projectsWithStatus = allProjects.map((project) => ({
    ...project,
    status: getProjectStatus(project),
  }));

  // 필터링된 프로젝트 목록
  const filteredProjects = projectsWithStatus.filter((project) => {
    if (projectFilter === "all") return true;
    return project.status === projectFilter;
  });

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

  const isOverdue = (endDate: Date | any | null | undefined) => {
    if (!endDate) return false;

    let date: Date;

    // Timestamp 객체인 경우
    if (endDate && typeof endDate.toDate === "function") {
      date = endDate.toDate();
    } else if (endDate instanceof Date) {
      date = endDate;
    } else {
      return false;
    }

    // Invalid Date 체크
    if (isNaN(date.getTime())) {
      return false;
    }

    // 날짜만 비교 (시간 제외)
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endDateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return endDateOnly < todayDateOnly;
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">PARA</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>실제 행동 단위인 프로젝트</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/projects/new">
                <Plus className="mr-2 h-4 w-4" />새 프로젝트
              </Link>
            </Button>
          </div>

          {/* 프로젝트 필터링 및 정렬 */}
          <div className="flex items-center justify-between mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {projectFilter === "all" ? (
                    <Filter className="mr-2 h-4 w-4" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {projectFilter === "all"
                    ? `전체 (${filteredProjects.length}개)`
                    : projectFilter === "planned"
                    ? `예정 (${
                        projectsWithStatus.filter((p) => p.status === "planned")
                          .length
                      }개)`
                    : projectFilter === "in_progress"
                    ? `진행 중 (${
                        projectsWithStatus.filter(
                          (p) => p.status === "in_progress"
                        ).length
                      }개)`
                    : `완료됨 (${
                        projectsWithStatus.filter(
                          (p) => p.status === "completed"
                        ).length
                      }개)`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setProjectFilter("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectFilter("planned")}>
                  예정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setProjectFilter("in_progress")}
                >
                  진행 중
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectFilter("completed")}>
                  완료됨
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {projectSortBy === "latest" ? (
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  {projectSortBy === "latest" && "최신순"}
                  {projectSortBy === "oldest" && "생성순"}
                  {projectSortBy === "name" && "이름순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setProjectSortBy("latest")}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectSortBy("oldest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  생성순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectSortBy("name")}>
                  <FileText className="mr-2 h-4 w-4" />
                  이름순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            {projectsLoading ||
            (allProjects.length > 0 && taskCountsLoading) ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : filteredProjects.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-muted/50 p-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">프로젝트가 없어요</h3>
                <p className="text-muted-foreground mb-4">
                  목표를 달성하기 위한 프로젝트를 만들어보세요.
                </p>
                <Button asChild className="w-full max-w-xs">
                  <Link href="/para/projects/new">
                    <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                  </Link>
                </Button>
              </Card>
            ) : (
              <>
                {filteredProjects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/para/projects/${project.id}`)}
                  >
                    <div className="p-4">
                      {/* 제목과 뱃지들 */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-base flex-1 pr-2">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {(() => {
                              if (project.areaId) {
                                const area = areas.find(
                                  (a) => a.id === project.areaId
                                );
                                return area ? area.name : "미분류";
                              }
                              return "미분류";
                            })()}
                          </Badge>
                          <Badge
                            variant={
                              project.status === "completed"
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {project.status === "completed"
                              ? "완료됨"
                              : "진행 중"}
                          </Badge>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>

                      {/* 하단 정보: 기간과 상태 아이콘 */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>
                            {project.startDate && project.endDate && (
                              <>
                                {formatDate(project.startDate)} ~{" "}
                                {formatDate(project.endDate)}
                              </>
                            )}
                          </span>
                          {/* 상태 이상 아이콘들 */}
                          <div className="flex items-center gap-1">
                            {/* 기한 초과 아이콘 - 진행 중이고 완료되지 않은 프로젝트만 */}
                            {project.endDate && isOverdue(project.endDate) && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>

                        {/* 진행률 - 최적화된 태스크 개수 사용 */}
                        <span className="text-xs">
                          {(() => {
                            const taskCount = projectTaskCounts[project.id];
                            if (taskCount) {
                              return `${taskCount.completedTasks}/${taskCount.totalTasks}`;
                            }
                            // 태스크 개수가 로딩 중일 때는 스켈레톤 표시
                            if (taskCountsLoading) {
                              return (
                                <span className="inline-block w-8 h-3 bg-muted animate-pulse rounded" />
                              );
                            }
                            // 데이터가 없을 때
                            return "0/0";
                          })()}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* 더보기 버튼 */}
                {hasNextProjects && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => fetchNextProjects()}
                      disabled={isFetchingNextProjects}
                    >
                      {isFetchingNextProjects ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          로딩 중...
                        </>
                      ) : (
                        "더보기"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="h-4 w-4" />
              <span>장기적 관심 영역</span>
              <span className="text-xs text-muted-foreground">
                ({areas.length}개)
              </span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/areas/new">
                <Plus className="mr-2 h-4 w-4" />새 영역
              </Link>
            </Button>
          </div>
          {areas.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Compass className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">활동 영역이 없어요</h3>
              <p className="text-muted-foreground mb-4">
                건강, 커리어, 자기계발 등 관심 있는 영역을 만들어보세요.
              </p>
              <Button asChild className="w-full max-w-xs">
                <Link href="/para/areas/new">
                  <Plus className="mr-2 h-4 w-4" />새 영역 만들기
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {areas.map((area) => {
                const areaProjects = allProjects.filter(
                  (p) => p.areaId === area.id
                );
                const areaResources = allResources.filter(
                  (r) => r.areaId === area.id
                );

                const getIconComponent = (iconId: string) => {
                  const iconMap: { [key: string]: any } = {
                    compass: Compass,
                    heart: Heart,
                    brain: Brain,
                    briefcase: Briefcase,
                    dollarSign: DollarSign,
                    users: Users,
                    gamepad2: Gamepad2,
                    dumbbell: Dumbbell,
                    bookOpen: BookOpenIcon,
                    home: Home,
                    car: Car,
                    plane: Plane,
                    camera: Camera,
                    music: Music,
                    palette: Palette,
                    utensils: Utensils,
                  };
                  return iconMap[iconId] || Compass;
                };

                const AreaIcon = getIconComponent(area.icon || "compass");

                return (
                  <Card key={area.id} className="p-4">
                    <Link href={`/para/areas/${area.id}`} className="block">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="rounded-full p-1.5"
                            style={{ backgroundColor: `${area.color}20` }}
                          >
                            <AreaIcon
                              className="h-4 w-4"
                              style={{ color: area.color }}
                            />
                          </div>
                          <h3 className="text-lg font-bold">{area.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            프로젝트 {areaProjects.length}개
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            자료 {areaResources.length}개
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {area.description}
                      </p>
                      <div className="flex justify-end">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>아이디어와 참고 자료</span>
              <span className="text-xs text-muted-foreground">
                ({allResources.length}개)
              </span>
            </div>
            <Button asChild size="sm">
              <Link href="/para/resources/new">
                <Plus className="mr-2 h-4 w-4" />새 자료 추가
              </Link>
            </Button>
          </div>

          {/* 리소스 정렬 */}
          <div className="flex items-center justify-end mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {resourceSortBy === "latest" ? (
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                  ) : (
                    <Clock className="mr-2 h-4 w-4" />
                  )}
                  {resourceSortBy === "latest" && "최신순"}
                  {resourceSortBy === "oldest" && "생성순"}
                  {resourceSortBy === "name" && "이름순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setResourceSortBy("latest")}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResourceSortBy("oldest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  생성순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResourceSortBy("name")}>
                  <FileText className="mr-2 h-4 w-4" />
                  이름순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {resourcesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : allResources.length === 0 ? (
            <Card className="p-6 text-center border-dashed mt-4">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Folder className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">참고 자료가 없어요</h3>
              <p className="text-muted-foreground mb-4">
                유용한 링크, 아이디어, 참고 자료를 저장해보세요.
              </p>
              <Button asChild className="w-full max-w-xs">
                <Link href="/para/resources/new">
                  <Plus className="mr-2 h-4 w-4" />새 자료 추가하기
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {allResources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <Link
                    href={`/para/resources/${resource.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{resource.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {areas.find((area) => area.id === resource.areaId)
                          ?.name || "기타"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(resource.createdAt)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </Card>
              ))}

              {/* 더보기 버튼 */}
              {hasNextResources && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextResources()}
                    disabled={isFetchingNextResources}
                  >
                    {isFetchingNextResources ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      "더보기"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
              <Archive className="h-4 w-4" />
              <span>완료된 항목에 대한 회고</span>
              <span className="text-xs text-muted-foreground">
                ({allArchives.length}개)
              </span>
            </div>
          </div>
          {/* 아카이브 필터링 및 정렬 */}
          <div className="flex items-center justify-between mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filterType === "all" ? (
                    <Filter className="mr-2 h-4 w-4" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {filterType === "all"
                    ? "전체"
                    : filterType === "loop"
                    ? "루프 회고"
                    : "프로젝트 회고"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("loop")}>
                  루프 회고
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("project")}>
                  프로젝트 회고
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 정렬 드롭다운 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {archiveSortBy === "latest" ? (
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}
                  {archiveSortBy === "latest" ? "최신순" : "회고 별점순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setArchiveSortBy("latest")}>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setArchiveSortBy("rating")}>
                  <Star className="mr-2 h-4 w-4" />
                  회고 별점순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {archivesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : allArchives.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-muted-foreground">
                아직 보관된 회고가 없어요.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {allArchives
                .filter((archive) => {
                  if (filterType === "all") return true;
                  if (filterType === "loop") return archive.loopId;
                  if (filterType === "project") return archive.projectId;
                  return true;
                })
                .map((archive) => (
                  <Card key={archive.id} className="p-4">
                    <Link
                      href={`/para/archives/${archive.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold">
                          {archive.title || "제목 없음"}
                        </h3>
                        <Badge
                          className={`text-xs ${
                            archive.loopId
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {archive.loopId ? "루프 회고" : "프로젝트 회고"}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {archive.summary || "요약 없음"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(archive.createdAt)}</span>
                          {renderStars(archive.userRating)}
                          {archive.bookmarked && (
                            <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                ))}

              {/* 더보기 버튼 */}
              {hasNextArchives && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextArchives()}
                    disabled={isFetchingNextArchives}
                  >
                    {isFetchingNextArchives ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        로딩 중...
                      </>
                    ) : (
                      "더보기"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ParaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ParaPageContent />
    </Suspense>
  );
}
