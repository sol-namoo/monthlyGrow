"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  auth,
  fetchProjectsOverlappingWithMonthly,
  fetchAllProjectsByUserId,
} from "@/lib/firebase/index";
import { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ProjectConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProjects: Array<{
    projectId: string;
    monthlyTargetCount?: number;
  }>;
  onProjectsChange: (
    projects: Array<{
      projectId: string;
      monthlyTargetCount?: number;
    }>
  ) => void;
  monthlyStartDate: Date;
  monthlyEndDate: Date;
}

export function ProjectConnectionDialog({
  open,
  onOpenChange,
  selectedProjects,
  onProjectsChange,
  monthlyStartDate,
  monthlyEndDate,
}: ProjectConnectionDialogProps) {
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  // const [searchTerm, setSearchTerm] = useState("");
  const [localSelectedProjects, setLocalSelectedProjects] = useState<
    Array<{
      projectId: string;
      monthlyTargetCount?: number;
    }>
  >(selectedProjects);

  // 먼슬리 기간과 겹치는 프로젝트들 가져오기
  const { data: overlappingProjects = [], isLoading } = useQuery({
    queryKey: [
      "overlapping-projects",
      user?.uid,
      monthlyStartDate,
      monthlyEndDate,
    ],
    queryFn: () =>
      fetchProjectsOverlappingWithMonthly(
        user?.uid || "",
        monthlyStartDate,
        monthlyEndDate
      ),
    enabled: !!user?.uid && open,
  });

  // 디버깅용: 모든 프로젝트도 가져와서 비교
  const { data: allProjects = [], error: allProjectsError } = useQuery({
    queryKey: ["all-projects-debug", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid && open, // 다이얼로그가 열렸을 때만 쿼리 실행
  });

  // 다이얼로그가 열렸을 때만 로그 출력
  if (open) {
    console.log("🔍 쿼리 상태:", {
      userId: user?.uid,
      isEnabled: !!user?.uid && open,
      open,
      isLoading,
      allProjectsError,
      allProjectsCount: allProjects.length,
    });
  }

  // 다이얼로그가 열렸을 때만 로그 출력
  if (open) {
    console.log("🔍 디버깅 - 모든 프로젝트:", {
      userId: user?.uid,
      allProjectsCount: allProjects.length,
      allProjects: allProjects.map((p) => ({
        title: p.title,
        start: p.startDate.toLocaleDateString("en-CA"),
        end: p.endDate.toLocaleDateString("en-CA"),
      })),
    });

    // 디버깅용 로그
    console.log("🎯 ProjectConnectionDialog:", {
      monthlyStartDate: monthlyStartDate.toLocaleDateString("en-CA"),
      monthlyEndDate: monthlyEndDate.toLocaleDateString("en-CA"),
      overlappingProjectsCount: overlappingProjects.length,
      projects: overlappingProjects.map((p) => ({
        title: p.title,
        start: p.startDate.toLocaleDateString("en-CA"),
        end: p.endDate.toLocaleDateString("en-CA"),
      })),
    });
  }

  // 프로젝트 선택/해제 핸들러
  const toggleProjectSelection = (project: Project) => {
    const isSelected = localSelectedProjects.some(
      (p) => p.projectId === project.id
    );

    if (isSelected) {
      setLocalSelectedProjects((prev) =>
        prev.filter((p) => p.projectId !== project.id)
      );
    } else {
      // 기본 태스크 개수 계산 (프로젝트 기간과 먼슬리 기간의 겹치는 비율로 계산)
      const projectStart = new Date(project.startDate);
      const projectEnd = new Date(project.endDate);
      const overlapStart = new Date(
        Math.max(projectStart.getTime(), monthlyStartDate.getTime())
      );
      const overlapEnd = new Date(
        Math.min(projectEnd.getTime(), monthlyEndDate.getTime())
      );

      const overlapDays = Math.ceil(
        (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalProjectDays = Math.ceil(
        (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const defaultTargetCount = Math.max(
        1,
        Math.round(
          (overlapDays / totalProjectDays) * (project.targetCount || 1)
        )
      );

      setLocalSelectedProjects((prev) => [
        ...prev,
        {
          projectId: project.id,
          monthlyTargetCount: defaultTargetCount,
        },
      ]);
    }
  };

  // 선택된 프로젝트의 태스크 개수 업데이트
  const updateProjectTargetCount = (projectId: string, count: number) => {
    setLocalSelectedProjects((prev) =>
      prev.map((p) =>
        p.projectId === projectId
          ? { ...p, monthlyTargetCount: Math.max(1, count) }
          : p
      )
    );
  };

  // 선택된 프로젝트 제거 핸들러
  const removeSelectedProject = (projectId: string) => {
    setLocalSelectedProjects((prev) =>
      prev.filter((p) => p.projectId !== projectId)
    );
  };

  // 저장 핸들러
  const handleSave = () => {
    onProjectsChange(localSelectedProjects);
    onOpenChange(false);
    toast({
      title: "프로젝트 연결 완료",
      description: `${localSelectedProjects.length}개 프로젝트가 연결되었습니다.`,
    });
  };

  // 취소 핸들러
  const handleCancel = () => {
    setLocalSelectedProjects(selectedProjects);
    onOpenChange(false);
  };

  // 다이얼로그가 열릴 때마다 현재 선택된 프로젝트들로 초기화
  useEffect(() => {
    if (open) {
      setLocalSelectedProjects(selectedProjects);
    }
  }, [open, selectedProjects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>프로젝트 연결</DialogTitle>
          <DialogDescription>
            이 먼슬리와 연결할 프로젝트들을 선택하세요. 먼슬리 기간과 겹치는
            프로젝트만 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 프로젝트 검색 및 선택 */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="프로젝트 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div> */}

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    프로젝트를 불러오는 중...
                  </p>
                </div>
              ) : overlappingProjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    연결할 수 있는 프로젝트가 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    먼슬리 기간과 겹치는 프로젝트만 연결할 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {overlappingProjects.map((project) => {
                    const isSelected = localSelectedProjects.some(
                      (p) => p.projectId === project.id
                    );

                    return (
                      <Card
                        key={project.id}
                        className={`p-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleProjectSelection(project)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleProjectSelection(project)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {project.title}
                              </p>
                              {isSelected && (
                                <Badge variant="outline" className="text-xs">
                                  선택됨
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {project.area || "미분류"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(project.startDate)} ~{" "}
                              {formatDate(project.endDate)}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            취소
          </Button>
          <Button onClick={handleSave}>
            연결하기 ({localSelectedProjects.length}개)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
