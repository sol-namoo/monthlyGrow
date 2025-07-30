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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
} from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { Project, Area } from "@/lib/types";
import { getProjectStatus } from "@/lib/utils";

interface ProjectSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: string[];
  onProjectToggle: (projectId: string) => void;
  onConfirm: () => void;
  maxProjects?: number;
  newlyCreatedProjectId?: string;
}

export function ProjectSelectionModal({
  open,
  onOpenChange,
  selectedProjects,
  onProjectToggle,
  onConfirm,
  maxProjects = 5,
  newlyCreatedProjectId,
}: ProjectSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [refreshKey, setRefreshKey] = useState(0);

  const auth = getAuth();
  const user = auth.currentUser;

  // Firestore에서 프로젝트와 영역 데이터 가져오기
  const {
    data: projects = [],
    isLoading: projectsLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryKey: ["projects", user?.uid, refreshKey],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 프로젝트 상태를 미리 계산하여 객체에 추가
  const projectsWithStatus = projects.map((project) => ({
    ...project,
    status: getProjectStatus(project),
  }));

  // 필터링된 프로젝트
  const filteredProjects = projectsWithStatus.filter((project) => {
    // 완료된 프로젝트 제외
    if (project.status === "completed") return false;

    // 검색어 필터
    if (
      searchTerm &&
      !project.title.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // 상태 필터
    if (statusFilter !== "all" && project.status !== statusFilter) {
      return false;
    }

    // 영역 필터
    if (areaFilter !== "all" && project.areaId !== areaFilter) {
      return false;
    }

    // 연결되지 않은 프로젝트만 필터
    if (showOnlyUnconnected && project.loopId) {
      return false;
    }

    return true;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  // 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
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

  // 날짜 포맷팅 함수
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isLimitReached = selectedProjects.length >= maxProjects;

  if (projectsLoading || areasLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>프로젝트 선택</DialogTitle>
            <DialogDescription>프로젝트를 불러오는 중...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>프로젝트 선택</DialogTitle>
          <DialogDescription>
            이 루프에 연결할 프로젝트를 선택하세요. 최대 {maxProjects}개까지
            선택할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

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
                루프에 연결된 적 없는 프로젝트만
              </Label>
            </div>

            <RecommendationBadge
              type="info"
              message={`선택된 프로젝트: ${selectedProjects.length}/${maxProjects}개`}
              className="text-xs"
            />
          </div>

          {/* 프로젝트 목록 - ScrollArea로 감싸서 스크롤 영역 확대 */}
          <ScrollArea className="h-[60vh] w-full border rounded-lg bg-gray-50/30">
            <div className="p-4 space-y-3">
              <div className="text-xs text-gray-500 mb-3 flex justify-between items-center">
                <span>총 {filteredProjects.length}개 프로젝트</span>
                {totalPages > 1 && (
                  <span className="text-xs text-muted-foreground">
                    {currentPage} / {totalPages} 페이지
                  </span>
                )}
              </div>

              {currentProjects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
                  {currentProjects.map((project) => (
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
                        <div className="flex flex-col items-end gap-1 ml-2">
                          {project.loopId && (
                            <Badge variant="secondary" className="text-xs">
                              연결됨
                            </Badge>
                          )}
                          {newlyCreatedProjectId === project.id && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-500"
                            >
                              새로 생성됨
                            </Badge>
                          )}
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
                      href="/para/projects/new?returnUrl=/loop/new"
                      target="_blank"
                    >
                      <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                    </a>
                  </Button>
                </div>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    이전
                  </Button>

                  <div className="flex items-center gap-1">
                    {totalPages <= 7 ? (
                      Array.from({ length: totalPages }, (_, i) => (
                        <Button
                          key={i + 1}
                          variant={
                            currentPage === i + 1 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setCurrentPage(i + 1)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {i + 1}
                        </Button>
                      ))
                    ) : (
                      <>
                        {currentPage > 3 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              1
                            </Button>
                            {currentPage > 4 && (
                              <span className="text-xs text-muted-foreground px-1">
                                ...
                              </span>
                            )}
                          </>
                        )}

                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(totalPages - 4, currentPage - 2)
                              ) + i;
                            if (pageNum > totalPages) return null;
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="h-8 w-8 p-0 text-xs"
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}

                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <span className="text-xs text-muted-foreground px-1">
                                ...
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="h-8 w-8 p-0 text-xs"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={onConfirm}>
            선택 완료 ({selectedProjects.length}/{maxProjects})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
