"use client";

import type React from "react";

import { useState, use, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Calendar, Info, X, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate, getLoopStatus } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchLoopById,
  fetchAllAreasByUserId,
  updateLoop,
  fetchProjectsByLoopId,
  fetchAllProjectsByUserId,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import {
  Compass,
  Heart,
  Briefcase,
  Users,
  DollarSign,
  Brain,
  Gamepad2,
  BookOpen,
  Palette,
} from "lucide-react";

// 아이콘 컴포넌트 매핑 함수
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    heart: Heart,
    briefcase: Briefcase,
    users: Users,
    dollarSign: DollarSign,
    brain: Brain,
    gamepad2: Gamepad2,
    bookOpen: BookOpen,
    palette: Palette,
  };
  return iconMap[iconName] || Compass;
};

// 로딩 스켈레톤 컴포넌트
function EditLoopSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Skeleton className="h-8 w-8 mr-2" />
        <Skeleton className="h-6 w-32" />
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function EditLoopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: loopId } = use(params);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const queryClient = useQueryClient();

  // 현재 날짜 정보
  const currentDate = new Date();

  // 통합된 데이터 페칭 - 캐시 최적화
  const {
    data: editLoopData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["editLoopData", loopId, user?.uid],
    queryFn: async () => {
      if (!user?.uid || !loopId) return null;

      // 병렬로 모든 데이터 가져오기
      const [loop, areas, connectedProjects, allProjects] = await Promise.all([
        fetchLoopById(loopId),
        fetchAllAreasByUserId(user.uid),
        fetchProjectsByLoopId(loopId, user.uid),
        fetchAllProjectsByUserId(user.uid),
      ]);

      return {
        loop,
        areas: areas || [],
        connectedProjects: connectedProjects || [],
        allProjects: allProjects || [],
      };
    },
    enabled: !!user?.uid && !!loopId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 메모리에 유지
  });

  // 데이터 추출
  const loop = editLoopData?.loop;
  const areas = editLoopData?.areas || [];
  const connectedProjects = editLoopData?.connectedProjects || [];
  const allProjects = editLoopData?.allProjects || [];
  const projectsLoading = isLoading;

  // 수정 가능한 필드 상태
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // 프로젝트 추가 모달 상태
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 새로 생성된 프로젝트 자동 연결 처리
  useEffect(() => {
    const newProjectId = searchParams.get("newProjectId");
    if (newProjectId && !selectedProjectIds.includes(newProjectId)) {
      // 새로 생성된 프로젝트를 선택된 프로젝트 목록에 추가
      setSelectedProjectIds((prev) => [...prev, newProjectId]);

      // URL에서 newProjectId 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete("newProjectId");
      router.replace(url.pathname + url.search);

      toast({
        title: "프로젝트 연결됨",
        description: "새로 생성된 프로젝트가 루프에 연결되었습니다.",
      });
    }
  }, [searchParams, selectedProjectIds, router, toast]);

  // 루프 데이터와 연결된 프로젝트가 로드되면 폼 초기화
  useEffect(() => {
    if (loop) {
      setTitle(loop.title || "");
      setReward(loop.reward || "");

      // 종료일이 월의 마지막 날이 아닌 경우 자동으로 수정
      const endDate = new Date(loop.endDate);
      const year = endDate.getFullYear();
      const month = endDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0);

      if (endDate.getDate() !== lastDayOfMonth.getDate()) {
        // 올바른 종료일로 루프 업데이트
        const correctedEndDate = lastDayOfMonth;
        updateLoop(loopId, { endDate: correctedEndDate }).then(() => {
          // 통합된 쿼리 무효화
          queryClient.invalidateQueries({
            queryKey: ["editLoopData", loopId, user?.uid],
          });
        });
      }

      // 기존 focusAreas (이름 기반) 데이터를 ID로 변환
      if (loop.focusAreas && loop.focusAreas.length > 0) {
        const areaIds = loop.focusAreas
          .map(
            (areaName: string) =>
              areas.find((area: any) => area.name === areaName)?.id
          )
          .filter((id: any) => id) as string[];
        setSelectedAreaIds(areaIds);
      } else {
        setSelectedAreaIds([]);
      }

      // 연결된 프로젝트 IDs 설정
      const projectIds = connectedProjects.map((p: any) => p.id);
      setSelectedProjectIds(projectIds);
    }
  }, [loop, areas, connectedProjects, loopId, queryClient]);

  // 루프 업데이트 mutation
  const updateLoopMutation = useMutation({
    mutationFn: (updatedData: any) => updateLoop(loopId, updatedData),
    onSuccess: () => {
      // 통합된 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: ["editLoopData", loopId, user?.uid],
      });
      queryClient.invalidateQueries({ queryKey: ["loops"] });
      toast({
        title: "루프 수정 완료",
        description: "루프가 성공적으로 수정되었습니다.",
      });
      router.replace(`/loop/${loopId}`);
    },
    onError: (error: Error) => {
      console.error("루프 수정 실패:", error);
      toast({
        title: "수정 실패",
        description: "루프 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 중점 영역은 언제든지 수정 가능
  const canEditAreas = true;

  // Area 선택/해제 핸들러
  const handleAreaToggle = (areaId: string) => {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  // 프로젝트 선택/해제 핸들러
  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds((prev) => {
      const newIds = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];

      // 디버깅용 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === "development") {
        console.log("프로젝트 토글:", projectId);
        console.log("선택된 프로젝트 IDs:", newIds);
      }

      return newIds;
    });
  };

  // 프로젝트 추가 모달 열기
  const handleOpenAddProjectModal = () => {
    setSelectedProjectIds(connectedProjects.map((p: any) => p.id));
    setSearchTerm("");
    setShowAddProjectModal(true);
  };

  // 프로젝트 추가/제거 저장 (로컬 상태만 업데이트)
  const handleSaveProjectChanges = () => {
    // 로컬 상태만 업데이트하고 DB에는 저장하지 않음
    // 최종 저장 시에만 DB에 반영됨
    setShowAddProjectModal(false);
  };

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "입력 오류",
        description: "루프 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const updatedData = {
      title: title.trim(),
      reward: reward.trim(),
      focusAreas: selectedAreaIds,
    };

    updateLoopMutation.mutate(updatedData);
  };

  // 로딩 상태
  if (isLoading || projectsLoading) {
    return <EditLoopSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 수정</h1>
        </div>

        <Alert>
          <AlertDescription>
            루프를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!loop) {
    return (
      <div className="container max-w-md px-4 py-6 text-center">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 수정</h1>
        </div>
        <p className="text-muted-foreground">루프를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 루프 상태 확인
  const loopStatus = getLoopStatus(loop);
  const isCompleted = loopStatus === "ended";

  if (isCompleted) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 수정</h1>
        </div>

        <Alert>
          <AlertDescription>완료된 루프는 수정할 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Suspense fallback={<EditLoopSkeleton />}>
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 수정</h1>
        </div>

        <div className="mb-6 space-y-2">
          <RecommendationBadge
            type="info"
            message="루프 제목, 보상, 중점 영역은 언제든지 수정할 수 있습니다"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">루프 제목</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 1월 건강 루프"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reward">달성 보상</Label>
                <Input
                  id="reward"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="예: 새로운 운동화 구매"
                  className="mt-1"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  💡 루프를 완료했을 때 자신에게 줄 보상을 설정하세요.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>시작일</Label>
                  <div className="mt-1 flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(loop.startDate)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    루프 기간은 수정할 수 없습니다
                  </p>
                </div>

                <div>
                  <Label>종료일</Label>
                  <div className="mt-1 flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(loop.endDate)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    해당 월의 마지막 날까지
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* 중점 Areas */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">중점 Areas (최대 4개)</h2>
            </div>

            <div className="mb-4 space-y-2">
              <RecommendationBadge
                type="info"
                message="권장: 2개 영역에 집중하면 루프의 효과를 높일 수 있어요"
              />
              {selectedAreaIds.length > 2 && (
                <RecommendationBadge
                  type="warning"
                  message="많은 영역을 선택하면 집중도가 떨어질 수 있습니다"
                />
              )}
            </div>

            {areas.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {areas
                    .filter((area) => area.name !== "미분류")
                    .map((area) => {
                      const IconComponent = getIconComponent(
                        area.icon || "compass"
                      );

                      return (
                        <div
                          key={area.id}
                          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors ${
                            selectedAreaIds.includes(area.id)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => handleAreaToggle(area.id)}
                        >
                          <div
                            className="mb-1 rounded-full p-1"
                            style={{
                              backgroundColor: `${area.color || "#6b7280"}20`,
                            }}
                          >
                            <IconComponent
                              className="h-3 w-3"
                              style={{ color: area.color || "#6b7280" }}
                            />
                          </div>
                          <span className="text-xs">{area.name}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const focusAreas = areas.filter((area) =>
                    selectedAreaIds.includes(area.id)
                  );

                  if (focusAreas.length > 0) {
                    return focusAreas.map((area) => {
                      const IconComponent = getIconComponent(
                        area.icon || "compass"
                      );
                      return (
                        <Badge
                          key={area.id}
                          variant="secondary"
                          className="opacity-70 flex items-center gap-1"
                        >
                          <IconComponent className="h-3 w-3" />
                          {area.name}
                        </Badge>
                      );
                    });
                  } else {
                    return (
                      <span className="text-xs text-muted-foreground">
                        중점 영역이 설정되지 않았습니다.
                      </span>
                    );
                  }
                })()}
              </div>
            )}
          </Card>

          {/* 프로젝트 연결 */}
          <Card className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-2">프로젝트 연결</h2>
              <p className="text-sm text-muted-foreground mb-4">
                이 루프와 연결할 프로젝트를 선택하거나 새 프로젝트를
                만들어보세요. 프로젝트는 나중에 추가할 수도 있습니다.
              </p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenAddProjectModal}
                  className="flex-1"
                >
                  기존 프로젝트 선택
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // 새 프로젝트 생성 페이지로 이동 (현재 루프 ID 포함)
                    const returnUrl = `${window.location.origin}/loop/edit/${loopId}`;
                    router.push(
                      `/para/projects/new?returnUrl=${encodeURIComponent(
                        returnUrl
                      )}`
                    );
                  }}
                  className="flex-1"
                >
                  <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                </Button>
              </div>
            </div>

            {/* 선택된 프로젝트 표시 */}
            {selectedProjectIds.length > 0 && (
              <div className="space-y-3 mb-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">연결된 프로젝트</h3>
                  <Badge variant="secondary" className="text-xs">
                    {selectedProjectIds.length}개
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedProjectIds.map((projectId) => {
                    // connectedProjects에서 먼저 찾고, 없으면 allProjects에서 찾기
                    const project =
                      connectedProjects.find((p) => p.id === projectId) ||
                      allProjects.find((p) => p.id === projectId);

                    // 디버깅용 로그 (개발 환경에서만)
                    if (process.env.NODE_ENV === "development" && !project) {
                      console.log("프로젝트를 찾을 수 없음:", projectId);
                      console.log(
                        "connectedProjects:",
                        connectedProjects.map((p) => ({
                          id: p.id,
                          title: p.title,
                        }))
                      );
                      console.log(
                        "allProjects:",
                        allProjects.map((p) => ({ id: p.id, title: p.title }))
                      );
                    }

                    if (!project) {
                      return (
                        <div
                          key={projectId}
                          className="flex items-center justify-between p-2 bg-background rounded border"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              삭제된 프로젝트
                            </p>
                            <p className="text-xs text-muted-foreground">
                              프로젝트가 삭제되었습니다
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={projectId}
                        className="flex items-center justify-between p-2 bg-background rounded border"
                      >
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              // 프로젝트의 area ID를 사용해서 실제 area 이름 찾기
                              if (project.areaId) {
                                const area = areas.find(
                                  (a) => a.id === project.areaId
                                );
                                return area ? area.name : "미분류";
                              }
                              return "미분류";
                            })()}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProjectIds(
                              selectedProjectIds.filter(
                                (id) => id !== projectId
                              )
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 프로젝트가 없을 때 안내 */}
            {selectedProjectIds.length === 0 && (
              <div className="text-center py-6">
                <div className="mb-3 flex justify-center">
                  <div className="rounded-full bg-muted/50 p-3">
                    <Briefcase className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  아직 연결된 프로젝트가 없습니다
                </p>
              </div>
            )}

            <div className="mt-4 space-y-2">
              <RecommendationBadge
                type="info"
                message="권장: 2~3개 프로젝트에 집중하면 루프의 효과를 높일 수 있어요"
              />

              {selectedProjectIds.length > 3 && (
                <RecommendationBadge
                  type="warning"
                  message="많은 프로젝트를 선택하면 집중도가 떨어질 수 있습니다"
                />
              )}
            </div>
          </Card>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={updateLoopMutation.isPending}
          >
            {updateLoopMutation.isPending ? "저장 중..." : "변경사항 저장"}
          </Button>
        </form>

        {/* 프로젝트 추가/제거 모달 */}
        <Dialog
          open={showAddProjectModal}
          onOpenChange={setShowAddProjectModal}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>프로젝트 추가/제거</DialogTitle>
              <DialogDescription>
                이 루프에 연결할 프로젝트를 선택하세요. 최대 5개까지 연결할 수
                있습니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* 검색 입력 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="프로젝트 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 프로젝트 목록 */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {(() => {
                  // 검색어로 필터링
                  const filteredProjects = allProjects.filter(
                    (project) =>
                      project.title
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      project.description
                        ?.toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  );

                  if (filteredProjects.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? "검색 결과가 없습니다."
                            : "생성된 프로젝트가 없습니다."}
                        </p>
                        {!searchTerm && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="mt-2"
                          >
                            <Link href="/para/projects/new">
                              <Plus className="mr-2 h-4 w-4" />새 프로젝트 생성
                            </Link>
                          </Button>
                        )}
                      </div>
                    );
                  }

                  return filteredProjects.map((project) => {
                    const isSelected = selectedProjectIds.includes(project.id);
                    const isConnected = connectedProjects.some(
                      (p) => p.id === project.id
                    );

                    return (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-primary/10 border-primary"
                            : "bg-background hover:bg-muted/50"
                        }`}
                        onClick={() => handleProjectToggle(project.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{project.title}</h4>
                            {isConnected && (
                              <Badge variant="outline" className="text-xs">
                                연결됨
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {project.description || "설명 없음"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Area:{" "}
                            {(() => {
                              // 프로젝트의 area ID를 사용해서 실제 area 이름 찾기
                              if (project.areaId) {
                                const area = areas.find(
                                  (a) => a.id === project.areaId
                                );
                                return area ? area.name : "미분류";
                              }
                              return "미분류";
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground"
                            }`}
                          >
                            {isSelected && (
                              <div className="w-2 h-2 bg-primary-foreground rounded" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* 선택된 프로젝트 수 표시 */}
              <div className="flex items-center justify-between text-sm">
                <span>선택된 프로젝트: {selectedProjectIds.length}/5</span>
                {selectedProjectIds.length > 5 && (
                  <span className="text-red-500 text-xs">
                    최대 5개까지만 선택할 수 있습니다
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddProjectModal(false)}
              >
                취소
              </Button>
              <Button
                onClick={handleSaveProjectChanges}
                disabled={
                  selectedProjectIds.length > 5 || updateLoopMutation.isPending
                }
              >
                {updateLoopMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Suspense>
  );
}
