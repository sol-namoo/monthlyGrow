"use client";

import type React from "react";
import { useState, useEffect, use, Suspense, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ChevronLeft,
  Briefcase,
  Plus,
  X,
  Calendar,
  Clock,
  Edit2,
  Info,
} from "lucide-react";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getProjectStatus, formatDate, formatDateForInput } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useFieldArray, Controller } from "react-hook-form";
import type { Project } from "@/lib/types";
import {
  fetchProjectById,
  updateProject,
  fetchAllAreasByUserId,
  fetchAllTasksByProjectId,
  fetchAllLoopsByUserId,
  deleteTaskFromProject,
  addTaskToProject,
  updateTaskInProject,
} from "@/lib/firebase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

// 프로젝트 편집 폼 스키마 정의
const editProjectFormSchema = z
  .object({
    title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
    description: z.string().min(1, "프로젝트 설명을 입력해주세요"),
    category: z.enum(["repetitive", "task_based"], {
      required_error: "프로젝트 유형을 선택해주세요",
    }),
    areaId: z.string().optional(),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    endDate: z.string().min(1, "종료일을 입력해주세요"),
    total: z.number().min(0, "목표를 입력해주세요"),
    tasks: z.array(
      z.object({
        id: z.any(), // 시스템에서 자동 생성하므로 검증 불필요
        title: z.string().min(1, "태스크 제목을 입력해주세요"),
        date: z.string().min(1, "태스크 날짜를 입력해주세요"),
        duration: z
          .number()
          .min(0, "소요 시간은 0 이상이어야 합니다")
          .multipleOf(0.1, "소요 시간은 소수점 첫째 자리까지 입력 가능합니다"),
        done: z.boolean(),
      })
    ),
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
  )
  .refine(
    (data) => {
      // 모든 태스크의 날짜가 프로젝트 기간 내에 있는지 확인
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      return data.tasks.every((task) => {
        const taskDate = new Date(task.date);
        return taskDate >= startDate && taskDate <= endDate;
      });
    },
    {
      message: "모든 태스크는 프로젝트 기간 내에 있어야 합니다",
      path: ["tasks"],
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
  const queryClient = useQueryClient();

  // 선택된 태스크들을 관리하는 상태
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  // 삭제된 태스크 ID들을 추적하는 상태
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  // 새로 추가된 태스크들을 추적하는 상태 (임시 ID -> 실제 Firestore ID 매핑)
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());

  // 루프 연결 관리 상태
  const [showLoopConnectionDialog, setShowLoopConnectionDialog] =
    useState(false);
  const [selectedLoopIds, setSelectedLoopIds] = useState<string[]>([]);

  // 카테고리 변경 다이얼로그 상태
  const [showCategoryChangeDialog, setShowCategoryChangeDialog] =
    useState(false);
  const [pendingCategoryChange, setPendingCategoryChange] = useState<
    "repetitive" | "task_based" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 저장 중 로딩 상태

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
    queryFn: async () => {
      console.log("🔍 Fetching tasks for projectId:", projectId);
      const result = await fetchAllTasksByProjectId(projectId);
      console.log("📦 Raw tasks data from Firestore:", result);
      return result;
    },
    enabled: !!projectId,
  });

  // 루프 목록 가져오기
  const { data: allLoops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 진행률 계산 (완료된 Tasks / 전체 Tasks)
  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 연결 가능한 루프 필터링 (프로젝트 기간과 겹치는 루프들, 최대 6개월 후까지)
  // react-hook-form 설정
  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "repetitive" as "repetitive" | "task_based",
      areaId: "",
      startDate: "",
      endDate: "",
      total: 1,
      tasks: [],
    },
  });

  const getAvailableLoopsForConnection = () => {
    if (!project || !allLoops.length || !form) return [];

    const projectStart = new Date(form.watch("startDate"));
    const projectEnd = new Date(form.watch("endDate"));
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    return allLoops.filter((loop) => {
      const loopStart = new Date(loop.startDate);
      const loopEnd = new Date(loop.endDate);

      // 6개월 이후 제한
      if (loopStart > sixMonthsLater) return false;

      // 프로젝트 기간과 겹치는지 확인
      return projectStart <= loopEnd && projectEnd >= loopStart;
    });
  };

  const availableLoopsForConnection = getAvailableLoopsForConnection();

  // 루프 선택/해제 핸들러
  const toggleLoopSelection = (loopId: string) => {
    setSelectedLoopIds((prev) =>
      prev.includes(loopId)
        ? prev.filter((id) => id !== loopId)
        : [...prev, loopId]
    );
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: "repetitive" | "task_based") => {
    const currentCategory = form.watch("category");

    // 같은 카테고리면 변경하지 않음
    if (currentCategory === newCategory) return;

    // 현재 태스크가 있는지 확인
    const currentTasks = form.watch("tasks") || [];
    const hasTasks = currentTasks.length > 0;

    // 태스크가 있으면 무조건 다이얼로그 표시
    if (hasTasks) {
      setPendingCategoryChange(newCategory);
      setShowCategoryChangeDialog(true);
    } else {
      // 태스크가 없으면 바로 변경
      applyCategoryChange(newCategory);
    }
  };

  // 다이얼로그에서 확인 선택 (태스크 초기화)
  const handleConfirmCategoryChange = () => {
    if (pendingCategoryChange) {
      form.setValue("category", pendingCategoryChange);

      // 태스크 초기화
      replace([]);

      // 반복형으로 변경하는 경우 기본값 설정
      if (pendingCategoryChange === "repetitive") {
        form.setValue("total", 1);
      }
    }
    setShowCategoryChangeDialog(false);
    setPendingCategoryChange(null);
  };

  // 카테고리 변경 적용
  const applyCategoryChange = (newCategory: "repetitive" | "task_based") => {
    form.setValue("category", newCategory);
  };

  // 루프 상태 확인
  const getLoopStatus = (loop: any) => {
    const now = new Date();
    const loopStart = new Date(loop.startDate);
    const loopEnd = new Date(loop.endDate);

    if (now >= loopStart && now <= loopEnd) {
      return "in_progress";
    } else if (now < loopStart) {
      return "planned";
    } else {
      return "completed";
    }
  };

  // 프로젝트 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    if (project) {
      console.log("Firestore: Project data:", project);
      form.reset({
        title: project.title,
        description: project.description,
        category: project.category || "repetitive",
        areaId: project.areaId || (areas.length > 0 ? areas[0].id : ""),
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        total: project.target, // project.total 대신 project.target 사용
        tasks: [], // 초기값 설정
      });

      // 현재 연결된 루프들을 selectedLoopIds에 설정
      if (project.connectedLoops) {
        setSelectedLoopIds(project.connectedLoops.map((loop) => loop.id));
      }
    }
  }, [project, form, areas]);

  // useFieldArray for tasks (form 초기화 이후에 정의)
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tasks",
    keyName: "key", // 고유 키 사용
  });

  // 태스크 데이터를 폼에 설정하는 함수
  const initializeFormWithTasks = useCallback(() => {
    if (!form || tasksLoading) return;

    console.log("🔍 폼 초기화 시작");
    console.log("tasks length:", tasks.length);

    // 태스크가 없어도 폼 초기화 진행
    const formattedTasks = tasks.map((task) => ({
      id: task.id, // 🔑 실제 Firestore ID 사용
      title: task.title,
      date: formatDateForInput(task.date),
      duration: task.duration,
      done: task.done,
    }));

    // 날짜순으로 정렬
    const sortedTasks = formattedTasks.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log("formattedTasks:", formattedTasks);
    console.log("sortedTasks:", sortedTasks);
    console.log(
      "원본 tasks 배열의 ID들:",
      tasks.map((t) => t.id)
    );

    // 각 태스크의 ID 변환 과정 확인
    formattedTasks.forEach((task, index) => {
      console.log(
        `🔍 태스크 ${index}: 원본 ID=${tasks[index].id}, 변환 후 ID=${task.id}`
      );
    });

    // 폼 초기화 전에 현재 상태 확인
    console.log("🔍 폼 초기화 전 fields 상태:", fields);

    // useFieldArray의 replace를 직접 사용 (key 속성 추가)
    const tasksWithKeys = sortedTasks.map((task, index) => ({
      ...task,
      key: task.id, // Firestore ID를 key로 사용
    }));
    replace(tasksWithKeys);

    // 페이지 로드 시 삭제 상태 초기화
    setDeletedTaskIds([]);
    setNewTaskIds(new Set());

    console.log("🔍 폼 초기화 완료");

    // fields가 업데이트될 때까지 잠시 기다린 후 다시 로그
    setTimeout(() => {
      console.log("fields after replace:", fields.length);
      console.log("🔍 폼 초기화 후 fields 상태:", fields);
    }, 100);
  }, [form, tasks, tasksLoading, replace]);

  // 태스크 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    console.log("!! useEffect 실행 !!");
    console.log("tasks loaded:", tasks);
    console.log("tasksLoading:", tasksLoading);
    console.log("form available:", !!form);
    console.log("fields length:", fields.length);
    console.log("deletedTaskIds:", deletedTaskIds);

    if (form && !tasksLoading && fields.length === 0) {
      initializeFormWithTasks();
    }
  }, [tasks, tasksLoading, form, fields.length, initializeFormWithTasks]);

  // fields 변화 감지
  useEffect(() => {
    if (fields.length > 0) {
      console.log("✅ fields가 성공적으로 업데이트됨:", fields.length);
      console.log(
        "✅ fields 내용:",
        fields.map((f) => ({ id: f.id, title: f.title }))
      );
    }
  }, [fields]);

  // 태스크 추가/삭제 헬퍼 함수
  const addTask = () => {
    // 기존 태스크들의 ID를 확인하여 고유한 임시 ID 생성
    const existingIds = fields.map((f) => f.id);
    let tempId;
    let counter = 1;

    do {
      tempId = `temp_${counter}`;
      counter++;
    } while (existingIds.includes(tempId));

    append({
      id: tempId,
      title: "",
      date: formatDateForInput(new Date()),
      duration: 1,
      done: false,
    });

    // 새로 추가된 태스크 ID를 추적
    setNewTaskIds((prev) => new Set([...prev, tempId]));
  };

  // 반복형 프로젝트에서 목표 횟수에 따라 태스크 목록 동적 생성
  const generatePreviewTasks = (
    targetCount: number,
    startDate: string,
    endDate: string,
    existingTasks: any[] = []
  ) => {
    if (!startDate || !endDate || targetCount <= 0) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const tasks = [];
    for (let i = 0; i < targetCount; i++) {
      const taskDate = new Date(start);

      // 첫 번째 태스크는 시작일, 마지막 태스크는 종료일로 설정
      if (i === 0) {
        taskDate.setTime(start.getTime());
      } else if (i === targetCount - 1) {
        taskDate.setTime(end.getTime());
      } else {
        // 중간 태스크들은 균등 분배
        const progress = i / (targetCount - 1);
        const daysFromStart = Math.round(progress * duration);
        taskDate.setDate(start.getDate() + daysFromStart);
      }

      // 프로젝트 기간을 벗어나지 않도록 조정
      if (taskDate < start) {
        taskDate.setTime(start.getTime());
      } else if (taskDate > end) {
        taskDate.setTime(end.getTime());
      }

      // 기존 태스크의 제목과 ID를 유지하거나 새로 생성
      const existingTask = existingTasks[i];
      const title = existingTask?.title || `${i + 1}회차`;
      const id = existingTask?.id || `temp_${i + 1}`; // 기존 ID 유지, 없으면 임시 ID

      console.log(
        `🔍 generatePreviewTasks - 태스크 ${i}: 기존 ID=${existingTask?.id}, 최종 ID=${id}`
      );

      tasks.push({
        id: id,
        title: title,
        date: taskDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
        duration: existingTask?.duration || 1,
        done: existingTask?.done || false,
      });
    }
    return tasks;
  };

  // 프로젝트 업데이트 처리
  const onSubmit = async (data: EditProjectFormData) => {
    if (!project) return;

    setIsSubmitting(true); // 로딩 상태 시작

    try {
      console.log("🚀 프로젝트 수정 시작");
      console.log("원본 tasks:", tasks.length);
      console.log("삭제된 태스크들:", deletedTaskIds);
      console.log("새로 추가된 태스크들:", Array.from(newTaskIds));

      // 1. 프로젝트 정보 업데이트
      const connectedLoops = allLoops
        .filter((loop) => selectedLoopIds.includes(loop.id))
        .map((loop) => ({
          id: loop.id,
          title: loop.title,
          startDate: loop.startDate,
          endDate: loop.endDate,
        }));

      const updateData: Partial<Omit<Project, "id" | "userId" | "createdAt">> =
        {
          title: data.title,
          description: data.description,
          category: data.category,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          target: data.total,
          connectedLoops,
          updatedAt: new Date(),
        };

      if (data.areaId && data.areaId.trim() !== "") {
        updateData.areaId = data.areaId;
      }

      await updateProject(project.id, { ...project, ...updateData });

      // 2. 삭제된 태스크들 처리
      if (deletedTaskIds.length > 0) {
        console.log("🗑️ 삭제할 태스크들:", deletedTaskIds);
        for (const taskId of deletedTaskIds) {
          try {
            await deleteTaskFromProject(taskId);
            console.log(`✅ 태스크 삭제 완료: ${taskId}`);
          } catch (error) {
            console.error(`❌ 태스크 삭제 실패: ${taskId}`, error);
          }
        }
      }

      // 3. 폼의 태스크들 처리
      const formTasks = data.tasks.map((task) => ({
        ...task,
        title: task.title.trim() || "태스크",
      }));

      console.log("📝 처리할 태스크들:", formTasks.length);

      for (const task of formTasks) {
        const isNewTask = task.id.startsWith("temp_");
        const isExistingTask = tasks.some((t) => t.id === task.id);

        console.log(
          `🔍 태스크: ${task.title} (ID: ${task.id}, 새: ${isNewTask}, 기존: ${isExistingTask})`
        );

        try {
          if (isNewTask) {
            // 새 태스크 생성
            console.log(`➕ 새 태스크 생성: ${task.title}`);
            await addTaskToProject(project.id, {
              title: task.title,
              date: new Date(task.date),
              duration: task.duration,
              done: task.done,
            });
          } else if (isExistingTask) {
            // 기존 태스크 수정
            console.log(`📝 기존 태스크 수정: ${task.title}`);
            await updateTaskInProject(task.id, {
              title: task.title,
              date: new Date(task.date),
              duration: task.duration,
              done: task.done,
            });
          } else {
            console.warn(
              `⚠️ 알 수 없는 태스크: ${task.title} (ID: ${task.id})`
            );
          }
        } catch (error) {
          console.error(`❌ 태스크 처리 실패: ${task.title}`, error);
          throw new Error(`태스크 저장 실패: ${task.title}`);
        }
      }

      // 성공 메시지
      const successMessage =
        deletedTaskIds.length > 0
          ? `프로젝트 수정 완료 (${deletedTaskIds.length}개 태스크 삭제됨)`
          : "프로젝트 수정 완료";

      toast({
        title: "프로젝트 수정 완료",
        description: successMessage,
      });

      // 4. 캐시 무효화 후 페이지 이동
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["taskCounts", projectId] }),
      ]);

      router.push(`/para/projects/${project.id}`);
    } catch (error) {
      console.error("프로젝트 수정 실패:", error);
      toast({
        title: "프로젝트 수정 실패",
        description: "프로젝트 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // 로딩 상태 해제
    }
  };

  // 로딩 상태
  if (
    userLoading ||
    projectLoading ||
    areasLoading ||
    tasksLoading ||
    loopsLoading
  ) {
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
    <div
      className={`container max-w-md px-4 py-6 relative ${
        isSubmitting ? "pointer-events-none" : ""
      }`}
    >
      {/* 로딩 오버레이 */}
      <LoadingOverlay isVisible={isSubmitting} message="프로젝트 저장 중..." />

      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 수정</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">프로젝트 정보를 수정하세요</h2>
        <p className="text-sm text-muted-foreground">
          프로젝트의 목표와 설정을 업데이트하여 더 나은 성과를 달성하세요.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

          <div className="space-y-4">
            {/* 프로젝트 유형 선택 */}
            <div>
              <Label>프로젝트 유형</Label>
              <RadioGroup
                value={form.watch("category")}
                onValueChange={(value: "repetitive" | "task_based") => {
                  handleCategoryChange(value);
                }}
                className="mt-2"
              >
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem
                      value="repetitive"
                      id="repetitive"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="repetitive"
                        className="text-sm font-medium cursor-pointer"
                      >
                        반복형 프로젝트
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        동일한 행동을 여러 번 반복하는 프로젝트 (운동, 독서,
                        습관 등)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem
                      value="task_based"
                      id="task_based"
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="task_based"
                        className="text-sm font-medium cursor-pointer"
                      >
                        작업형 프로젝트
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        다양한 업무를 단계별로 완료하는 프로젝트 (개발, 학습,
                        창작 등)
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
              {form.formState.errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">프로젝트 제목</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="예: 아침 운동 습관화"
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
                placeholder="이 프로젝트로 달성하고 싶은 목표를 설명해주세요"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="areaId">소속 영역</Label>
              <Select
                value={form.watch("areaId")}
                onValueChange={(value) => form.setValue("areaId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="영역을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
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

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">일정 및 목표</h2>

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
                <Label htmlFor="endDate">목표 완료일</Label>
                <Input id="endDate" type="date" {...form.register("endDate")} />
                {form.formState.errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {projectWithStatus.status !== "planned" && (
              <div className="p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                  <Info className="h-4 w-4" />
                  <span className="font-medium">프로젝트 정보</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  프로젝트가 시작된 후에는 시작일을 변경할 수 없습니다.
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
                    ? "권장: 3개월 이내로 설정하면 효과적으로 관리할 수 있어요"
                    : "프로젝트 기간이 길어요. 더 작은 단위로 나누는 것을 고려해보세요"
                }
              />
            )}

            <div>
              <Label htmlFor="total">
                목표{" "}
                {form.watch("category") === "repetitive" ? "횟수" : "태스크 수"}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="total"
                  type="number"
                  {...form.register("total", { valueAsNumber: true })}
                  min="1"
                  placeholder={
                    form.watch("category") === "repetitive"
                      ? "예: 30"
                      : "예: 10"
                  }
                  onBlur={(e) => {
                    // 반복형 프로젝트에서만 목표 횟수 변경 시 태스크 목록 동적 생성
                    if (form.watch("category") === "repetitive") {
                      const newTotal = parseInt(e.target.value) || 1;
                      const startDate = form.watch("startDate");
                      const endDate = form.watch("endDate");

                      if (startDate && endDate && newTotal > 0) {
                        console.log(
                          "🔄 반복형 프로젝트 - 목표 횟수 변경:",
                          newTotal
                        );
                        const previewTasks = generatePreviewTasks(
                          newTotal,
                          startDate,
                          endDate,
                          fields
                        );
                        replace(previewTasks);
                      }
                    }
                  }}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {form.watch("category") === "repetitive" ? "회" : "개"}
                </span>
              </div>
              {form.formState.errors.total && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.total.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 태스크 목록 섹션 */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">태스크 목록</h2>
              <span className="text-sm text-muted-foreground">
                ({fields.length}개)
              </span>
            </div>
            {(form.watch("category") === "task_based" ||
              (form.watch("category") === "repetitive" &&
                completedTasks >= form.watch("total"))) && (
              <div className="flex gap-2">
                {selectedTasks.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      console.log("🗑️ 삭제 버튼 클릭됨");
                      console.log("선택된 태스크 ID들:", selectedTasks);

                      // 1. UI에서 선택된 태스크들 제거
                      const remainingTasks = fields.filter(
                        (field) => !selectedTasks.includes(field.id)
                      );

                      console.log(
                        "삭제 후 남을 태스크들:",
                        remainingTasks.length
                      );

                      // 2. 삭제된 태스크들 분류
                      const deletedExistingTasks = selectedTasks.filter(
                        (taskId) => {
                          const field = fields.find((f) => f.id === taskId);
                          return field && !field.id.startsWith("temp_"); // 기존 Firestore 태스크만
                        }
                      );

                      const deletedNewTasks = selectedTasks.filter((taskId) => {
                        const field = fields.find((f) => f.id === taskId);
                        return field && field.id.startsWith("temp_"); // 새로 추가된 태스크만
                      });

                      console.log(
                        "삭제될 기존 태스크들:",
                        deletedExistingTasks
                      );
                      console.log("삭제될 새 태스크들:", deletedNewTasks);

                      // 3. 상태 업데이트
                      setDeletedTaskIds((prev) => [
                        ...prev,
                        ...deletedExistingTasks,
                      ]);
                      setNewTaskIds((prev) => {
                        const updated = new Set(prev);
                        deletedNewTasks.forEach((id) => updated.delete(id));
                        return updated;
                      });

                      // 4. 폼 업데이트
                      replace(remainingTasks);

                      // 5. 선택 상태 초기화
                      setSelectedTasks([]);

                      toast({
                        title: "태스크 삭제됨",
                        description: `${selectedTasks.length}개 태스크가 삭제되었습니다. 저장 시 반영됩니다.`,
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    삭제 ({selectedTasks.length})
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  태스크 추가
                </Button>
              </div>
            )}
          </div>

          {form.watch("category") === "repetitive" && (
            <div className="mb-4 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡 반복형 프로젝트는 목표 횟수에 따라 태스크가 자동으로
                생성됩니다.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                🎯 목표 달성 후 초과 달성 태스크를 추가할 수 있어요
              </p>
            </div>
          )}

          <div className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground mb-2">
                  등록된 태스크가 없습니다
                </p>
                <p className="text-sm text-muted-foreground">
                  프로젝트 달성을 위한 구체적인 태스크를 추가해보세요
                </p>
              </div>
            ) : (
              <div className="max-h-[calc(100vh-120px)] overflow-y-auto space-y-2 pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="group">
                    {/* 선택 체크박스 (카드 위쪽) - 작업형 또는 반복형에서 추가된 태스크만 표시 */}
                    {(form.watch("category") === "task_based" ||
                      (form.watch("category") === "repetitive" &&
                        index >= form.watch("total"))) && (
                      <div className="flex justify-start mb-2">
                        <Checkbox
                          checked={selectedTasks.includes(field.id)}
                          onCheckedChange={(checked) => {
                            console.log("checkbox click", field);
                            console.log(
                              "현재 fields 배열:",
                              fields.map((f) => ({ id: f.id, title: f.title }))
                            );
                            console.log("클릭된 field의 ID:", field.id);
                            console.log(
                              "fields 배열에서 같은 title을 가진 항목:",
                              fields.find((f) => f.title === field.title)
                            );

                            if (checked) {
                              setSelectedTasks((prev) => [...prev, field.id]);
                            } else {
                              setSelectedTasks((prev) =>
                                prev.filter((id) => id !== field.id)
                              );
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* 태스크 카드 */}
                    <div className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                      <div className="space-y-4">
                        {/* 첫 번째 줄: 완료 상태, 제목 */}
                        <div className="flex items-center gap-3">
                          {/* 인덱스 번호 */}
                          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                            <span className="text-xs font-medium text-muted-foreground">
                              {index + 1}
                            </span>
                          </div>

                          {/* 완료 상태 표시 (작은 배지) */}
                          {form.watch(`tasks.${index}.done`) && (
                            <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />
                          )}

                          {/* 제목 입력 */}
                          <Input
                            {...form.register(`tasks.${index}.title`)}
                            placeholder="태스크 제목"
                            className={`flex-1 min-w-0 ${
                              form.watch(`tasks.${index}.done`)
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                            readOnly={
                              form.watch("category") === "repetitive" &&
                              index < form.watch("total")
                            }
                          />
                        </div>

                        {/* 두 번째 줄: 날짜, 시간 */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              type="date"
                              {...form.register(`tasks.${index}.date`)}
                              className="w-auto text-sm min-w-0"
                              min={form.watch("startDate")}
                              max={form.watch("endDate")}
                              readOnly={
                                form.watch("category") === "repetitive" &&
                                index < form.watch("total")
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              {...form.register(`tasks.${index}.duration`, {
                                valueAsNumber: true,
                                onChange: (e) => {
                                  console.log(
                                    `🔍 Edit Task ${
                                      index + 1
                                    } duration onChange:`,
                                    {
                                      rawValue: e.target.value,
                                      type: typeof e.target.value,
                                      parsed: parseFloat(e.target.value),
                                      isNaN: isNaN(parseFloat(e.target.value)),
                                    }
                                  );
                                },
                                onBlur: (e) => {
                                  console.log(
                                    `🔍 Edit Task ${
                                      index + 1
                                    } duration onBlur:`,
                                    {
                                      rawValue: e.target.value,
                                      type: typeof e.target.value,
                                      parsed: parseFloat(e.target.value),
                                      isNaN: isNaN(parseFloat(e.target.value)),
                                    }
                                  );
                                },
                              })}
                              placeholder="시간"
                              min="0"
                              step="0.1"
                              className="w-16 text-sm"
                              readOnly={
                                form.watch("category") === "repetitive" &&
                                index < form.watch("total")
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              시간
                            </span>
                          </div>
                        </div>

                        {/* 에러 메시지 표시 */}
                        {form.formState.errors.tasks?.[index] && (
                          <div className="text-sm text-red-500">
                            {Object.values(
                              form.formState.errors.tasks[index] || {}
                            ).map((error: any, errorIndex: number) => (
                              <p key={errorIndex}>{error?.message}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* 루프 연결 섹션 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">루프 연결</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              이 프로젝트를 특정 루프에 연결하여 월별 목표로 관리할 수 있습니다.
            </p>

            {/* 현재 연결된 루프들 표시 */}
            {selectedLoopIds.length > 0 && allLoops.length > 0 && (
              <div>
                <Label>현재 연결된 루프</Label>
                <div className="mt-2 space-y-2">
                  {allLoops
                    .filter((loop) => selectedLoopIds.includes(loop.id))
                    .map((loop) => (
                      <div
                        key={loop.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                      >
                        <div>
                          <span className="font-medium">{loop.title}</span>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(loop.startDate)} ~{" "}
                            {formatDate(loop.endDate)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // 루프 연결 해제
                            setSelectedLoopIds((prev) =>
                              prev.filter((id) => id !== loop.id)
                            );
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                새로운 루프에 연결하거나 기존 연결을 관리하세요
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowLoopConnectionDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                루프 연결 관리
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "프로젝트 수정"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>

      {/* 루프 연결 대화상자 */}
      <Dialog
        open={showLoopConnectionDialog}
        onOpenChange={setShowLoopConnectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프에 연결</DialogTitle>
            <DialogDescription>
              이 프로젝트를 연결할 루프를 선택하세요. (프로젝트 기간과 겹치는
              루프만 표시됩니다)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableLoopsForConnection.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  연결할 수 있는 루프가 없습니다.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  프로젝트 기간과 겹치는 루프만 연결할 수 있습니다.
                </p>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>팁:</strong> 루프를 먼저 생성하거나 프로젝트
                    기간을 조정해보세요.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {availableLoopsForConnection.map((loop) => (
                    <div
                      key={loop.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedLoopIds.includes(loop.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => toggleLoopSelection(loop.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{loop.title}</h4>
                          {selectedLoopIds.includes(loop.id) && (
                            <Badge variant="outline" className="text-xs">
                              선택됨
                            </Badge>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            getLoopStatus(loop) === "in_progress"
                              ? "bg-green-100 text-green-700"
                              : getLoopStatus(loop) === "planned"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {getLoopStatus(loop) === "in_progress"
                            ? "진행 중"
                            : getLoopStatus(loop) === "planned"
                            ? "예정"
                            : "완료"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(loop.startDate)} -{" "}
                        {formatDate(loop.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        연결된 프로젝트: {loop.projectIds?.length || 0}개
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowLoopConnectionDialog(false);
                      toast({
                        title: "루프 연결 설정됨",
                        description: `${selectedLoopIds.length}개 루프가 선택되었습니다. 저장 시 적용됩니다.`,
                      });
                    }}
                    className="flex-1"
                  >
                    확인 ({selectedLoopIds.length}개)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 변경사항 취소 - 원래 연결된 루프들로 되돌리기
                      if (project?.connectedLoops) {
                        setSelectedLoopIds(
                          project.connectedLoops.map((loop) => loop.id)
                        );
                      } else {
                        setSelectedLoopIds([]);
                      }
                      setShowLoopConnectionDialog(false);
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 카테고리 변경 다이얼로그 */}
      <Dialog
        open={showCategoryChangeDialog}
        onOpenChange={setShowCategoryChangeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 유형 변경</DialogTitle>
            <DialogDescription>
              프로젝트 유형을 변경하면 현재 태스크 목록이 초기화됩니다.
              계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              현재 태스크: {fields.length}개
            </p>
            <p className="text-sm text-muted-foreground">
              변경할 유형:{" "}
              {pendingCategoryChange === "repetitive" ? "반복형" : "작업형"}
            </p>
            <p className="text-sm text-muted-foreground">
              모든 태스크가 삭제되고 새로 시작됩니다.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConfirmCategoryChange} className="flex-1">
              계속하기
            </Button>
            <Button
              onClick={() => {
                setShowCategoryChangeDialog(false);
                setPendingCategoryChange(null);
              }}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
