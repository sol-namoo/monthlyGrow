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
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProjectStatus } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchAllProjectsByUserId,
  fetchAllAreasByUserId,
  fetchAllResourcesByUserId,
  fetchAllRetrospectivesByUserId,
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

  // 필터링 상태
  const [projectFilter, setProjectFilter] = useState("all");

  // 무한 스크롤 관련 상태
  const [displayedProjects, setDisplayedProjects] = useState<any[]>([]);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const [isLoadingMoreProjects, setIsLoadingMoreProjects] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 불필요한 코드 제거 - TanStack Query가 처리함
  const [filterType, setFilterType] = useState("all"); // 'all', 'loop', 'project'
  const [sortBy, setSortBy] = useState("latest"); // 'latest', 'rating'

  // Firestore에서 데이터 가져오기
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources", user?.uid],
    queryFn: () => fetchAllResourcesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: archives = [], isLoading: archivesLoading } = useQuery({
    queryKey: ["archives", user?.uid],
    queryFn: () => fetchAllRetrospectivesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 로딩 상태
  // 디버깅용 로그
  console.log("Data loaded:", {
    projects: projects.length,
    areas: areas.length,
    resources: resources.length,
    archives: archives.length,
  });

  if (
    userLoading ||
    projectsLoading ||
    areasLoading ||
    resourcesLoading ||
    archivesLoading
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
  const projectsWithStatus = projects.map((project) => ({
    ...project,
    status: getProjectStatus(project),
  }));

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

    const today = new Date();
    return date < today;
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

          {/* 프로젝트 필터링 */}
          <div className="flex items-center gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {projectFilter === "all" ? (
                    <Filter className="mr-2 h-4 w-4" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {projectFilter === "all"
                    ? `전체 (${projects.length}개)`
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
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
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
                {projectsWithStatus.map((project) => (
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
                            {project.area}
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
                            {/* 기한 초과 아이콘 */}
                            {project.endDate && isOverdue(project.endDate) && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>

                        {/* 진행률 */}
                        <span className="text-xs">
                          {project.progress}/{project.total}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
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
                const areaProjects = projects.filter(
                  (p) => p.areaId === area.id
                );
                const areaResources = resources.filter(
                  (r) => r.areaId === area.id
                );

                console.log(`Area ${area.name}:`, {
                  projects: areaProjects.length,
                  resources: areaResources.length,
                  areaId: area.id,
                });

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>아이디어와 참고 자료</span>
            <span className="text-xs text-muted-foreground">
              ({resources.length}개)
            </span>
          </div>

          {resources.length === 0 ? (
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
            <div className="space-y-4 mt-4">
              {resources.map((resource) => (
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
            </div>
          )}
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
              <Archive className="h-4 w-4" />
              <span>완료된 항목에 대한 회고</span>
              <span className="text-xs text-muted-foreground">
                ({archives.length}개)
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortBy === "latest" ? (
                    <CalendarDays className="mr-2 h-4 w-4" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}
                  {sortBy === "latest" ? "최신순" : "회고 별점순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("latest")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")}>
                  <Star className="mr-2 h-4 w-4" />
                  회고 별점순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {archives.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-muted-foreground">
                아직 보관된 회고가 없어요.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {archives
                .filter((archive) => {
                  if (filterType === "all") return true;
                  if (filterType === "loop") return archive.loopId;
                  if (filterType === "project") return archive.projectId;
                  return true;
                })
                .sort((a, b) => {
                  if (sortBy === "latest") {
                    return (
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                    );
                  } else {
                    return (b.userRating || 0) - (a.userRating || 0);
                  }
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
                          {archive.bookmarked && (
                            <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                          {renderStars(archive.userRating)}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                ))}
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
