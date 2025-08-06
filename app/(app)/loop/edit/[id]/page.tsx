"use client";

import type React from "react";

import { useState, use, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Calendar, Info, X, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  fetchAllProjectsByUserId,
} from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [user] = useAuthState(auth);
  const queryClient = useQueryClient();

  // 현재 날짜 정보
  const currentDate = new Date();

  // 실제 루프 데이터 가져오기
  const {
    data: loop,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loop", loopId],
    queryFn: () => fetchLoopById(loopId),
    enabled: !!loopId,
  });

  // 사용자의 모든 Area 가져오기
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 사용자의 모든 프로젝트 가져오기
  const { data: allProjects = [] } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 수정 가능한 필드 상태
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState("");
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

  // 프로젝트 추가 모달 상태
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // 루프 데이터가 로드되면 폼 초기화
  useEffect(() => {
    if (loop) {
      setTitle(loop.title || "");
      setReward(loop.reward || "");

      // 기존 focusAreas (이름 기반) 데이터를 ID로 변환
      if (loop.focusAreas && loop.focusAreas.length > 0) {
        const areaIds = loop.focusAreas
          .map((areaName) => areas.find((area) => area.name === areaName)?.id)
          .filter((id) => id) as string[];
        setSelectedAreaIds(areaIds);
      } else {
        setSelectedAreaIds([]);
      }
    }
  }, [loop, areas]);

  // 루프 업데이트 mutation
  const updateLoopMutation = useMutation({
    mutationFn: (updatedData: any) => updateLoop(loopId, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loop", loopId] });
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

  // 루프 생성 후 3일 이내인지 확인
  const isWithinThreeDays = () => {
    if (!loop?.createdAt) return false;
    const createdDate = new Date(loop.createdAt);
    const threeDaysAfter = new Date(createdDate);
    threeDaysAfter.setDate(createdDate.getDate() + 3);
    return currentDate <= threeDaysAfter;
  };

  // 루프 시작일이 지났는지 확인
  const hasLoopStarted = () => {
    if (!loop?.startDate) return false;
    const startDate = new Date(loop.startDate);
    return currentDate >= startDate;
  };

  // 수정 가능 여부 확인
  const canEditAreas = isWithinThreeDays() && !hasLoopStarted();

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
    setSelectedProjectIds((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  // 프로젝트 추가 모달 열기
  const handleOpenAddProjectModal = () => {
    setSelectedProjectIds(loop?.projectIds || []);
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
      ...(canEditAreas && { focusAreas: selectedAreaIds }),
      projectIds: selectedProjectIds, // 프로젝트 변경사항도 포함
    };

    updateLoopMutation.mutate(updatedData);
  };

  // 로딩 상태
  if (isLoading) {
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

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>루프 수정 정책</AlertTitle>
          <AlertDescription>
            루프 제목과 보상은 언제든지 수정할 수 있습니다. 중점 Areas는 루프
            시작 전에만 수정 가능합니다. 시작일과 종료일은 수정할 수 없습니다.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6 p-4">
            <div className="mb-4">
              <Label htmlFor="title">루프 제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="reward">달성 보상</Label>
              <Input
                id="reward"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="mt-1"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                루프를 완료했을 때 자신에게 줄 보상을 설정하세요.
              </p>
            </div>

            <div className="mb-4">
              <Label>루프 기간</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(loop.startDate)} ~ {formatDate(loop.endDate)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                루프 기간은 수정할 수 없습니다.
              </p>
            </div>
          </Card>

          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">중점 Areas</h2>
              {!canEditAreas && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800"
                >
                  수정 불가
                </Badge>
              )}
            </div>

            {canEditAreas ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {areas.map((area) => (
                    <Badge
                      key={area.id}
                      variant={
                        selectedAreaIds.includes(area.id)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer transition-colors ${
                        selectedAreaIds.includes(area.id)
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => handleAreaToggle(area.id)}
                    >
                      {area.name}
                      {selectedAreaIds.includes(area.id) && (
                        <X className="ml-1 h-3 w-3" />
                      )}
                    </Badge>
                  ))}
                </div>
                {areas.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    생성된 Area가 없습니다.{" "}
                    <Link
                      href="/para/areas/new"
                      className="text-primary hover:underline"
                    >
                      Area를 먼저 생성
                    </Link>
                    해주세요.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const focusAreas = areas.filter((area) =>
                    selectedAreaIds.includes(area.id)
                  );

                  if (focusAreas.length > 0) {
                    return focusAreas.map((area) => (
                      <Badge
                        key={area.id}
                        variant="secondary"
                        className="opacity-70"
                      >
                        {area.name}
                      </Badge>
                    ));
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

            {!canEditAreas && (
              <p className="mt-3 text-xs text-muted-foreground">
                중점 Areas는 루프 시작 전에만 수정할 수 있습니다.
              </p>
            )}
          </Card>

          <Card className="mb-6 p-4">
            <h2 className="mb-4 text-lg font-semibold">연결된 프로젝트</h2>

            {(() => {
              // 루프에 연결된 프로젝트들 필터링
              const connectedProjects = allProjects.filter((project) =>
                loop.projectIds?.includes(project.id)
              );

              if (connectedProjects.length > 0) {
                return (
                  <div className="space-y-2">
                    {connectedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="rounded-lg bg-secondary p-3 text-sm"
                      >
                        <div className="mb-1 flex justify-between">
                          <span className="font-medium">{project.title}</span>
                          <span className="text-muted-foreground">
                            {(() => {
                              if (project.areaId) {
                                const area = areas.find(
                                  (a) => a.id === project.areaId
                                );
                                return area ? area.name : "미분류";
                              }
                              return "미분류";
                            })()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                          {project.description || "설명 없음"}
                        </p>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{ width: "60%" }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else if (loop.projectIds && loop.projectIds.length > 0) {
                // 프로젝트 ID는 있지만 해당 프로젝트를 찾을 수 없는 경우
                return (
                  <div className="space-y-2">
                    {loop.projectIds.map((projectId, index) => (
                      <div
                        key={projectId}
                        className="rounded-lg bg-secondary p-3 text-sm"
                      >
                        <div className="mb-1 flex justify-between">
                          <span>프로젝트 {index + 1}</span>
                          <span className="text-muted-foreground">삭제됨</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{ width: "0%" }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      연결된 프로젝트가 없습니다.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleOpenAddProjectModal}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      프로젝트 추가
                    </Button>
                  </div>
                );
              }
            })()}

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleOpenAddProjectModal}
                className="w-full bg-transparent"
              >
                프로젝트 추가/제거
              </Button>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateLoopMutation.isPending}
            >
              {updateLoopMutation.isPending ? "저장 중..." : "변경사항 저장"}
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href={`/loop/${loopId}`}>취소</Link>
            </Button>
          </div>
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
                    const isConnected = loop?.projectIds?.includes(project.id);

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
                            Area: {project.area || "미분류"}
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
