"use client";

import type React from "react";
import { useState, useEffect, use, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Briefcase, Plus, X, Calendar, Clock } from "lucide-react";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getProjectStatus, formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchProjectById,
  updateProject,
  fetchAllAreasByUserId,
  fetchAllTasksByProjectId,
} from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 프로젝트 편집 폼 스키마 정의
const editProjectFormSchema = z
  .object({
    title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
    description: z.string().min(1, "프로젝트 설명을 입력해주세요"),
    areaId: z.string().optional(),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    endDate: z.string().min(1, "종료일을 입력해주세요"),
    total: z.number().min(1, "목표 횟수를 입력해주세요"),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate >= startDate;
    },
    {
      message: "종료일은 시작일보다 늦어야 합니다",
      path: ["endDate"],
    }
  );

type EditProjectFormData = z.infer<typeof editProjectFormSchema>;

// 로딩 스켈레톤 컴포넌트
function EditProjectSkeleton() {
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

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);

  // Next.js 15에서는 params가 Promise이므로 unwrap
  const resolvedParams = use(params as unknown as Promise<{ id: string }>);
  const { id: projectId } = resolvedParams;

  // Firestore에서 프로젝트 데이터 가져오기
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

  // 영역 목록 가져오기
  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 프로젝트의 Tasks 가져오기
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: () => fetchAllTasksByProjectId(projectId),
    enabled: !!projectId,
  });

  // 진행률 계산 (완료된 Tasks / 전체 Tasks)
  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // react-hook-form 설정
  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      areaId: "",
      startDate: "",
      endDate: "",
      total: 1,
    },
  });

  // 프로젝트 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    if (project) {
      const formatDateForInput = (date: Date | string) => {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return dateObj.toISOString().split("T")[0];
      };

      form.reset({
        title: project.title,
        description: project.description,
        areaId: project.areaId || "",
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        total: project.total,
      });
    }
  }, [project, form]);

  // 프로젝트 업데이트 처리
  const onSubmit = async (data: EditProjectFormData) => {
    if (!project) return;

    try {
      const updatedProject = {
        ...project,
        title: data.title,
        description: data.description,
        areaId: data.areaId || undefined,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        progress: completedTasks, // Task 기반으로 계산된 진행률
        total: data.total,
        updatedAt: new Date(),
      };

      await updateProject(project.id, updatedProject);

      toast({
        title: "프로젝트 수정 완료",
        description: "프로젝트가 성공적으로 수정되었습니다.",
      });

      router.push(`/para/projects/${project.id}`);
    } catch (error) {
      console.error("프로젝트 수정 실패:", error);
      toast({
        title: "프로젝트 수정 실패",
        description: "프로젝트 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 로딩 상태
  if (userLoading || projectLoading || areasLoading || tasksLoading) {
    return <EditProjectSkeleton />;
  }

  // 에러 상태
  if (projectError) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Alert>
          <AlertDescription>
            프로젝트 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 프로젝트가 없는 경우
  if (!project) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Alert>
          <AlertDescription>해당 프로젝트를 찾을 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const projectWithStatus = {
    ...project,
    status: getProjectStatus(project),
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const duration = calculateDuration(
    form.watch("startDate"),
    form.watch("endDate")
  );

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">프로젝트 수정</h1>
        <p className="text-muted-foreground">
          프로젝트 정보를 수정하고 업데이트하세요.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            <h2 className="text-lg font-semibold">기본 정보</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">프로젝트 제목</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="프로젝트 제목을 입력하세요"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">프로젝트 설명</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="프로젝트에 대한 자세한 설명을 입력하세요"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="areaId">연결된 영역 (선택사항)</Label>
              <Select
                value={form.watch("areaId") || "none"}
                onValueChange={(value) =>
                  form.setValue("areaId", value === "none" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="영역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">영역 없음</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* 일정 정보 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <h2 className="text-lg font-semibold">일정 정보</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                  disabled={projectWithStatus.status !== "planned"}
                />
                {form.formState.errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">종료일</Label>
                <Input id="endDate" type="date" {...form.register("endDate")} />
                {form.formState.errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {projectWithStatus.status !== "planned" && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 프로젝트가 시작된 후에는 시작일을 변경할 수 없습니다.
                </p>
              </div>
            )}

            {duration > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>프로젝트 기간: {duration}일</span>
              </div>
            )}

            {duration > 0 && (
              <RecommendationBadge
                type={duration <= 90 ? "info" : "warning"}
                message={
                  duration <= 90
                    ? "좋은 프로젝트 기간입니다 (3개월 이내 권장)"
                    : "프로젝트 기간이 길어요. 더 작은 단위로 나누는 것을 고려해보세요"
                }
              />
            )}
          </div>
        </Card>

        {/* 진행 상황 */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <h2 className="text-lg font-semibold">진행 상황</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>현재 진행 (읽기 전용)</Label>
                <Input
                  value={completedTasks}
                  readOnly
                  disabled
                  className="bg-muted/50"
                />
              </div>

              <div>
                <Label htmlFor="total">목표 횟수</Label>
                <Input
                  id="total"
                  type="number"
                  {...form.register("total", { valueAsNumber: true })}
                  min="1"
                />
                {form.formState.errors.total && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.total.message}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>진행률</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="mt-2 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            프로젝트 수정
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
