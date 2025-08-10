import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllProjectsByUserId,
  fetchAllAreasByUserId,
  fetchProjectsByUserIdWithPaging,
} from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { Project, Area } from "@/lib/types";
import { getProjectStatus, formatDate } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface ProjectSelectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: string[];
  onProjectToggle: (projectId: string) => void;
  onConfirm: () => void;
  maxProjects?: number;
  newlyCreatedProjectId?: string;
  projects?: any[]; // 외부에서 전달받은 프로젝트 목록
  areas?: any[]; // 외부에서 전달받은 영역 목록
  projectsLoading?: boolean;
  areasLoading?: boolean;
  currentChapterId?: string; // 현재 챕터 ID (수정 시에만 사용)
}

export function ProjectSelectionSheet({
  open,
  onOpenChange,
  selectedProjects,
  onProjectToggle,
  onConfirm,
  maxProjects,
  newlyCreatedProjectId,
  projects: externalProjects,
  areas: externalAreas,
  projectsLoading: externalProjectsLoading,
  areasLoading: externalAreasLoading,
  currentChapterId,
}: ProjectSelectionSheetProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  // 챕터 수정 시에는 모든 프로젝트를 보여주기 위해 기본값을 false로 설정
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(false);
  const [itemsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const { translate } = useLanguage();

  // 외부에서 전달받은 데이터가 있으면 사용, 없으면 직접 가져오기
  const auth = getAuth();
  const user = auth.currentUser;

  const {
    data: internalProjectsData,
    isLoading: internalProjectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", user?.uid, refreshKey],
    queryFn: async () => {
      if (externalProjects) return null;

      // 디버깅: 모든 프로젝트 개수 확인
      console.log("🔍 전체 프로젝트 개수 확인 중...");
      console.log("🔍 현재 사용자 ID:", user?.uid);
      const allProjects = await fetchAllProjectsByUserId(user?.uid || "");
      console.log(
        "🔍 fetchAllProjectsByUserId 결과:",
        allProjects.length,
        "개"
      );

      // 모든 경우에 10개씩 페이지네이션 사용
      console.log(
        "🔍 페칭 시작 - userId:",
        user?.uid,
        "pageLimit:",
        itemsPerPage
      );
      const result = await fetchProjectsByUserIdWithPaging(
        user?.uid || "",
        itemsPerPage,
        lastDoc,
        "latest"
      );
      console.log("🔍 페칭 완료 - 결과:", {
        projectsCount: result.projects.length,
        hasMore: result.hasMore,
        lastDoc: result.lastDoc ? "있음" : "없음",
      });

      if (lastDoc === null) {
        // 첫 페이지 로드
        setAllProjects(result.projects);
        console.log(
          "🔍 첫 페이지 로드:",
          result.projects.length,
          "개 프로젝트"
        );
        console.log(
          "프로젝트들:",
          result.projects.map((p) => ({ id: p.id, title: p.title }))
        );
        console.log("🔍 요청한 페이지 크기:", itemsPerPage);
        console.log("🔍 실제 반환된 크기:", result.projects.length);
      } else {
        // 추가 페이지 로드
        setAllProjects((prev) => [...prev, ...result.projects]);
        console.log(
          "🔍 추가 페이지 로드:",
          result.projects.length,
          "개 프로젝트"
        );
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      console.log("🔍 hasMore:", result.hasMore, "lastDoc:", result.lastDoc);

      return result.projects;
    },
    enabled: !!user?.uid && !externalProjects,
  });

  const { data: internalAreas = [], isLoading: internalAreasLoading } =
    useQuery({
      queryKey: ["areas", user?.uid],
      queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
      enabled: !!user?.uid && !externalAreas,
    });

  // 외부 데이터 또는 내부 데이터 사용
  const projects = externalProjects || allProjects;
  const areas = externalAreas || internalAreas;
  const projectsLoading = externalProjectsLoading || internalProjectsLoading;
  const areasLoading = externalAreasLoading || internalAreasLoading;

  // 프로젝트 상태를 미리 계산하여 객체에 추가
  const projectsWithStatus = projects.map((project) => ({
    ...project,
    status: getProjectStatus(project),
  }));

  // 필터링된 프로젝트
  const filteredProjects = projectsWithStatus.filter((project) => {
    // 검색어 필터
    if (
      searchTerm &&
      !project.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // 상태 필터
    if (statusFilter !== "all") {
      const projectStatus = getProjectStatus(project);
      if (projectStatus !== statusFilter) {
        return false;
      }
    }

    // 영역 필터
    if (areaFilter !== "all" && project.areaId !== areaFilter) {
      return false;
    }

    // 연결되지 않은 프로젝트만 필터 (체크박스가 체크되어 있을 때만)
    // 챕터 수정 시에는 모든 프로젝트를 보여줌
    if (showOnlyUnconnected && !currentChapterId) {
      const connectedChapters = (project as any).connectedChapters || [];
      const isConnected = connectedChapters.length > 0 || project.chapterId;
      if (isConnected) {
        return false;
      }
    }

    return true;
  });

  // 디버깅용 로그
  console.log("🔍 전체 프로젝트:", projects.length, "개");
  console.log("🔍 필터링된 프로젝트:", filteredProjects.length, "개");
  console.log(
    "🔍 검색어:",
    searchTerm,
    "상태필터:",
    statusFilter,
    "영역필터:",
    areaFilter,
    "연결필터:",
    showOnlyUnconnected
  );

  // 필터 변경 시 프로젝트 목록 초기화
  useEffect(() => {
    setLastDoc(null);
    setAllProjects([]);
    setHasMore(true);
  }, [searchTerm, statusFilter, areaFilter, showOnlyUnconnected]);

  // 새로 생성된 프로젝트가 있을 때 리프레시
  useEffect(() => {
    if (newlyCreatedProjectId) {
      refetchProjects();
    }
  }, [newlyCreatedProjectId, refetchProjects]);

  // 영역 이름으로 매핑하는 함수
  const getAreaName = (areaId?: string) => {
    if (!areaId) return "미분류";
    const area = areas.find((a) => a.id === areaId);
    return area?.name || "미분류";
  };

  // 더 많은 프로젝트 로드
  const loadMoreProjects = async () => {
    if (!hasMore || externalProjects) return;

    const result = await fetchProjectsByUserIdWithPaging(
      user?.uid || "",
      itemsPerPage,
      lastDoc,
      "latest"
    );

    setAllProjects((prev) => [...prev, ...result.projects]);
    setLastDoc(result.lastDoc);
    setHasMore(result.hasMore);
  };

  const isLimitReached = maxProjects
    ? selectedProjects.length >= maxProjects
    : false;
  const shouldShowWarning = selectedProjects.length >= 3;

  if (projectsLoading || areasLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>프로젝트 선택</SheetTitle>
            <SheetDescription>프로젝트를 불러오는 중...</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col">
        <SheetHeader>
          <SheetTitle>프로젝트 선택</SheetTitle>
          <SheetDescription>
            이 챕터에 연결할 프로젝트를 선택하세요.
            {maxProjects && ` 최대 ${maxProjects}개까지 선택할 수 있습니다.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* 필터 및 검색 */}
          <div className="space-y-3 mb-4 flex-shrink-0">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32 focus:ring-0">
                    <SelectValue placeholder="상태" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 상태</SelectItem>
                    <SelectItem value="planned">계획됨</SelectItem>
                    <SelectItem value="in_progress">진행 중</SelectItem>
                    <SelectItem value="completed">완료됨</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-full sm:w-32 focus:ring-0">
                    <SelectValue placeholder="영역" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">모든 영역</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="showOnlyUnconnected"
                checked={showOnlyUnconnected}
                onCheckedChange={(checked) =>
                  setShowOnlyUnconnected(checked as boolean)
                }
              />
              <Label htmlFor="showOnlyUnconnected" className="text-sm">
                {currentChapterId
                  ? "연결되지 않은 프로젝트만 보기 (체크 해제 시 모든 프로젝트 표시)"
                  : "연결되지 않은 프로젝트만 보기"}
              </Label>
            </div>

            <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
              <p className="text-sm text-foreground">
                {maxProjects
                  ? `선택된 프로젝트: ${selectedProjects.length}/${maxProjects}개`
                  : `선택된 프로젝트: ${selectedProjects.length}개`}
              </p>
            </div>

            {shouldShowWarning && (
              <RecommendationBadge
                type="warning"
                message="많은 프로젝트를 선택하면 집중도가 떨어질 수 있습니다"
                className="text-xs"
              />
            )}
          </div>

          {/* 프로젝트 목록 - ScrollArea로 감싸서 스크롤 영역 확대 */}
          <ScrollArea className="flex-1 w-full border rounded-lg bg-background">
            <div className="p-4 space-y-3">
              <div className="text-xs text-muted-foreground mb-3 flex justify-between items-center">
                <span>총 {filteredProjects.length}개 프로젝트</span>
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMoreProjects}
                    disabled={projectsLoading}
                    className="text-xs"
                  >
                    {projectsLoading
                      ? translate("settings.loading.loading")
                      : translate("settings.loading.showMore")}
                  </Button>
                )}
              </div>

              {filteredProjects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {filteredProjects.map((project) => (
                    <Card
                      key={project.id}
                      className={`cursor-pointer p-3 transition-all ${
                        selectedProjects.includes(project.id)
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50"
                      } ${
                        isLimitReached && !selectedProjects.includes(project.id)
                          ? "opacity-50 pointer-events-none"
                          : ""
                      } ${
                        newlyCreatedProjectId === project.id
                          ? "ring-2 ring-green-500 ring-offset-2"
                          : ""
                      }`}
                      onClick={() => onProjectToggle(project.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            disabled
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm leading-tight">
                              {project.title}
                            </h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {project.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{getAreaName(project.areaId)}</span>
                              <span>•</span>
                              <span>
                                {formatDate(project.startDate)} ~{" "}
                                {formatDate(project.endDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={
                              project.status === "completed"
                                ? "default"
                                : project.status === "in_progress"
                                ? "secondary"
                                : project.status === "overdue"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {project.status === "completed"
                              ? "완료됨"
                              : project.status === "in_progress"
                              ? "진행 중"
                              : project.status === "overdue"
                              ? "지연됨"
                              : "계획됨"}
                          </Badge>
                          {(() => {
                            const connectedChapters =
                              (project as any).connectedChapters || [];
                            const isConnectedToCurrentChapter =
                              currentChapterId &&
                              (connectedChapters.includes(currentChapterId) ||
                                project.chapterId === currentChapterId);

                            return isConnectedToCurrentChapter ? (
                              <Badge variant="outline" className="text-xs">
                                연결됨
                              </Badge>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm ||
                    statusFilter !== "all" ||
                    areaFilter !== "all"
                      ? "검색 조건에 맞는 프로젝트가 없습니다."
                      : showOnlyUnconnected
                      ? "연결되지 않은 프로젝트가 없습니다."
                      : "등록된 프로젝트가 없습니다."}
                  </p>
                  <Button asChild variant="outline">
                    <a
                      href="/para/projects/new?returnUrl=/chapter/new"
                      target="_blank"
                    >
                      <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm}>
            선택 완료 ({selectedProjects.length}
            {maxProjects ? `/${maxProjects}` : ""}개)
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
