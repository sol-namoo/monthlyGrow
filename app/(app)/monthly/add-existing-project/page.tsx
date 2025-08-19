"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/feedback/Loading";
import {
  CustomAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/custom-alert";
import { AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchMonthlyById,
  fetchAllProjectsByUserId,
  updateMonthly,
} from "@/lib/firebase/index";
import { getProjectStatus } from "@/lib/utils";
import type { Monthly, Project } from "@/lib/types";

function AddExistingProjectPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const monthlyId = searchParams.get("monthlyId");
  const [user, userLoading] = useAuthState(auth);
  const queryClient = useQueryClient();

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(true);

  // 현재 먼슬리 정보 가져오기
  const { data: currentMonthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly", monthlyId],
    queryFn: () => fetchMonthlyById(monthlyId!),
    enabled: !!monthlyId,
  });

  // 연결되지 않은 프로젝트들 가져오기
  const { data: unconnectedProjects = [], isLoading: projectsLoading } =
    useQuery({
      queryKey: ["unconnectedProjects", user?.uid, monthlyId],
      queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
      enabled: !!user?.uid && !!monthlyId,
    });

  // 프로젝트를 먼슬리에 연결하는 mutation
  // 새로운 구조에서는 프로젝트 연결이 필요 없음
  const connectProjectsMutation = useMutation({
    mutationFn: async (projectIds: string[]) => {
      // 새로운 구조에서는 프로젝트 연결이 필요 없으므로 아무것도 하지 않음
      console.log("새로운 구조에서는 프로젝트 연결이 필요 없습니다");
    },
    onSuccess: () => {
      toast({
        title: "알림",
        description: "새로운 구조에서는 프로젝트 연결이 필요 없습니다.",
      });
      router.push(`/monthly/${monthlyId}`);
    },
    onError: (error) => {
      toast({
        title: "오류",
        description: translate("pageLoading.processing"),
        variant: "destructive",
      });
    },
  });

  // 로딩 중이거나 데이터가 없으면 처리
  if (monthlyLoading || !currentMonthly) {
    return <Loading />;
  }

  // 필터링된 프로젝트 계산 로직
  const filteredProjects = showOnlyUnconnected
    ? unconnectedProjects
    : unconnectedProjects;

  // 프로젝트 선택 토글 함수
  const toggleProject = (projectId: string) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
    } else {
      // 새로운 구조에서는 제한 없음
      setSelectedProjects([...selectedProjects, projectId]);
    }
  };

  // 프로젝트 추가 가능 여부 확인 (새로운 구조에서는 항상 가능)
  const currentProjectCount = 0; // 새로운 구조에서는 연결된 프로젝트가 없음
  const canAddMoreProjects = true;

  // 프로젝트 추가 처리 함수
  const handleAddProjects = () => {
    if (selectedProjects.length > 0) {
      connectProjectsMutation.mutate(selectedProjects);
    }
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/monthly/${monthlyId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">기존 프로젝트 추가</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-lg font-bold">{currentMonthly.objective}</h2>
        <p className="text-sm text-muted-foreground">
          현재 먼슬리에 연결된 프로젝트: {currentProjectCount}/5
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          추가 가능한 프로젝트: {Math.max(0, 5 - currentProjectCount)}개
        </p>
      </Card>

      {!canAddMoreProjects && (
        <CustomAlert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>주의사항</AlertTitle>
          <AlertDescription>
            기존 프로젝트를 먼슬리에 연결하면 해당 프로젝트의 기존 데이터가
            유지됩니다. 프로젝트의 시작일과 목표 완료일이 먼슬리 기간과 맞지
            않을 수 있습니다.
          </AlertDescription>
        </CustomAlert>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">프로젝트 선택</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnlyUnconnected(!showOnlyUnconnected)}
        >
          {showOnlyUnconnected ? "모든 프로젝트 보기" : "먼슬리 미연결만 보기"}
        </Button>
      </div>

      <div className="space-y-3 mb-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                selectedProjects.includes(project.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              } ${
                !canAddMoreProjects && !selectedProjects.includes(project.id)
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                    disabled={
                      !canAddMoreProjects &&
                      !selectedProjects.includes(project.id)
                    }
                  />
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    project.area === "미분류" ? "destructive" : "outline"
                  }
                >
                  {project.area || "미분류"}
                </Badge>
              </div>

              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span>완료된 태스크: {project.completedTasks}개</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-value"
                    style={{
                      width: `${project.completedTasks > 0 ? 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              {showOnlyUnconnected
                ? "먼슬리에 연결되지 않은 프로젝트가 없습니다"
                : "추가할 수 있는 프로젝트가 없습니다"}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleAddProjects}
          disabled={
            selectedProjects.length === 0 || connectProjectsMutation.isPending
          }
        >
          {connectProjectsMutation.isPending
            ? "연결 중..."
            : `${selectedProjects.length}개 프로젝트 추가`}
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/monthly/${monthlyId}`}>취소</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AddExistingProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AddExistingProjectPageContent />
    </Suspense>
  );
}
