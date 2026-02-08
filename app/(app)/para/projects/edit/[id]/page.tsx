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
  DialogFooter,
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
import {
  getProjectStatus,
  formatDate,
  formatDateForInput,
  createValidDate,
} from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { useFieldArray, Controller } from "react-hook-form";
import type { Project } from "@/lib/types";
import {
  fetchProjectById,
  updateProject,
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  fetchAllTasksByProjectId,
  fetchAllMonthliesByUserId,
  fetchMonthlyById,
  deleteTaskFromProject,
  addTaskToProject,
  updateTaskInProject,
  updateMonthly,
} from "@/lib/firebase/index";
import {
  CustomAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/custom-alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Alert } from "@/components/ui/alert";
import { MonthlyConnectionDialog } from "@/components/ui/monthly-connection-dialog";

// 프로젝트 편집 폼 스키마 정의
const editProjectFormSchema = z
  .object({
    title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
    description: z.string().optional(),
    category: z.enum(["repetitive", "task_based"], {
      required_error: "프로젝트 유형을 선택해주세요",
    }),
    areaId: z.string().optional(),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    endDate: z.string().min(1, "종료일을 입력해주세요"),
    target: z.string().min(1, "목표 설명을 입력해주세요"),
    targetCount: z.number().min(0, "목표 개수를 입력해주세요"),
    total: z.number().min(0, "목표 개수를 입력해주세요"),
    tasks: z.array(
      z.object({
        id: z.any(), // 시스템에서 자동 생성하므로 검증 불필요
        title: z.string().min(1, "태스크 제목을 입력해주세요"),
        date: z.string().min(1, "태스크 날짜를 입력해주세요"),
        duration: z
          .number()
          .min(0.1, "소요 시간은 0.1 이상이어야 합니다")
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
  const { translate } = useLanguage();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 선택된 태스크들을 관리하는 상태
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  // 삭제된 태스크 ID들을 추적하는 상태
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  // 새로 추가된 태스크들을 추적하는 상태 (임시 ID -> 실제 Firestore ID 매핑)
  const [newTaskIds, setNewTaskIds] = useState<Set<string>>(new Set());

  // 월간 연결 관리 상태
  const [showMonthlyConnectionDialog, setShowMonthlyConnectionDialog] =
    useState(false);
  const [selectedMonthlyIds, setSelectedMonthlyIds] = useState<string[]>([]);

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
      const result = await fetchAllTasksByProjectId(projectId);
      return result;
    },
    enabled: !!projectId,
  });

  // 월간 목록 가져오기
  const { data: allMonthlies = [], isLoading: monthliesLoading } = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: () => fetchAllMonthliesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 모든 프로젝트 가져오기 (월간 연결 수 계산용)
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["all-projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 진행률 계산 (완료된 Tasks / 전체 Tasks)
  const completedTasks = tasks.filter((task) => task.done).length;
  const totalTasks = tasks.length;

  // 진행률 계산 - 반복형은 targetCount 기준, 작업형은 실제 태스크 개수 기준
  const progressPercentage =
    project?.category === "repetitive"
      ? project?.targetCount && project.targetCount > 0
        ? Math.round((completedTasks / project.targetCount) * 100)
        : 0
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // 연결 가능한 월간 필터링 (프로젝트 기간과 겹치는 월간들, 최대 6개월 후까지)
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
      target: "",
      targetCount: 1,
      tasks: [],
    },
  });

  const getAvailableMonthliesForConnection = () => {
    if (!project || !allMonthlies.length || !form) return [];

    const projectStart = new Date(form.watch("startDate"));
    const projectEnd = new Date(form.watch("endDate"));

    // 현재 날짜 정보
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const sixMonthsLater = new Date(currentYear, currentMonth + 6, 0);

    return allMonthlies.filter((monthly) => {
      const monthlyStart = new Date(monthly.startDate);
      const monthlyEnd = new Date(monthly.endDate);

      // 6개월 이후 제한
      if (monthlyStart > sixMonthsLater) return false;

      // 프로젝트 기간과 겹치는지 확인
      return projectStart <= monthlyEnd && projectEnd >= monthlyStart;
    });
  };

  const availableMonthliesForConnection = getAvailableMonthliesForConnection();

  // 월간 선택/해제 핸들러
  const toggleMonthlySelection = (monthlyId: string) => {
    setSelectedMonthlyIds((prev) =>
      prev.includes(monthlyId)
        ? prev.filter((id) => id !== monthlyId)
        : [...prev, monthlyId]
    );
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (newCategory: "repetitive" | "task_based") => {
    const currentCategory = form.watch("category");

    // 같은 카테고리면 변경하지 않음
    if (currentCategory === newCategory) return;

    // 현재 태스크가 있는지 확인 (fields 배열 사용)
    const hasTasks = fields.length > 0;

    // 태스크가 있으면 무조건 다이얼로그 표시
    if (hasTasks) {
      setPendingCategoryChange(newCategory);
      setShowCategoryChangeDialog(true);
    } else {
      // 태스크가 없으면 바로 변경
      applyCategoryChange(newCategory);
    }
  };

  // 카테고리 변경 적용
  const applyCategoryChange = (newCategory: "repetitive" | "task_based") => {
    form.setValue("category", newCategory);

    if (newCategory === "repetitive") {
      // 반복형으로 변경 시 기존 태스크 초기화
      replace([]);
      // 삭제된 태스크 ID들도 초기화
      setDeletedTaskIds([]);
      setNewTaskIds(new Set());
    }
    // 작업형으로 변경 시 기존 태스크 유지
  };

  // 월간 상태 확인
  const getMonthlyStatus = (monthly: any) => {
    const now = new Date();
    const monthlyStart = new Date(monthly.startDate);
    const monthlyEnd = new Date(monthly.endDate);

    if (now >= monthlyStart && now <= monthlyEnd) {
      return "in_progress";
    } else if (now < monthlyStart) {
      return "planned";
    } else {
      return "completed";
    }
  };

  // 월간에 연결된 프로젝트 수를 계산하는 함수
  const getConnectedProjectCount = (monthlyId: string) => {
    if (!allProjects) return 0;

    // 모든 프로젝트에서 해당 월간에 연결된 프로젝트 수 계산
    return allProjects.filter((project) =>
      project.connectedMonthlies?.includes(monthlyId)
    ).length;
  };

  // 프로젝트 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    if (project) {
      form.reset({
        title: project.title,
        description: project.description,
        category: project.category || "repetitive",
        areaId: project.areaId || (areas.length > 0 ? areas[0].id : ""),
        startDate: formatDateForInput(project.startDate),
        endDate: formatDateForInput(project.endDate),
        target: project.target || "",
        targetCount: project.targetCount || 1,
        total: project.targetCount || 1,
        tasks: [], // 초기값 설정
      });

      // 현재 연결된 월간들을 selectedMonthlyIds에 설정
      if (project.connectedMonthlies) {
        setSelectedMonthlyIds(project.connectedMonthlies);
      }
    }
  }, [project, form, areas, allMonthlies, projectId]);

  // useFieldArray for tasks (form 초기화 이후에 정의)
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tasks",
    keyName: "key", // 고유 키 사용
  });

  // 태스크 데이터를 폼에 설정하는 함수
  const initializeFormWithTasks = useCallback(() => {
    if (!form || tasksLoading) return;

    // 태스크가 없어도 폼 초기화 진행
    const formattedTasks = tasks.map((task) => ({
      id: task.id, // 🔑 실제 Firestore ID 사용
      title: task.title,
      date: formatDateForInput(task.date),
      duration: task.duration,
      done: task.done,
    }));

    // 완료 여부를 최우선 기준으로 정렬 (완료되지 않은 것이 먼저)
    const sortedTasks = formattedTasks.sort((a, b) => {
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      // 완료 여부가 같으면 날짜순 정렬
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // useFieldArray의 replace를 직접 사용 (key 속성 추가)
    const tasksWithKeys = sortedTasks.map((task, index) => ({
      ...task,
      key: task.id, // Firestore ID를 key로 사용
    }));
    replace(tasksWithKeys);

    // 페이지 로드 시 삭제 상태 초기화
    setDeletedTaskIds([]);
    setNewTaskIds(new Set());
  }, [form, tasks, tasksLoading, replace]);

  // 태스크 데이터가 로드되면 폼에 채우기
  useEffect(() => {
    if (form && !tasksLoading && fields.length === 0) {
      initializeFormWithTasks();
    }
  }, [tasks, tasksLoading, form, fields.length, initializeFormWithTasks]);

  // fields 변화 감지
  useEffect(() => {
    if (fields.length > 0) {
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
      // 1. 프로젝트 정보 업데이트
      const connectedMonthlies = selectedMonthlyIds;

      const updateData: Partial<Omit<Project, "id" | "userId" | "createdAt">> =
        {
          title: data.title,
          description: data.description,
          category: data.category,
          startDate: createValidDate(data.startDate),
          endDate: createValidDate(data.endDate),
          target: data.target,
          targetCount: data.targetCount,
          connectedMonthlies,
          updatedAt: new Date(),
        };

      if (data.areaId && data.areaId.trim() !== "") {
        updateData.areaId = data.areaId;
      }

      await updateProject(project.id, updateData);

      // 2. Monthly.connectedProjects 동기화 (병렬: fetch 후 병렬 update)
      const prevMonthlyIds = project.connectedMonthlies || [];
      const nextMonthlyIds = selectedMonthlyIds;
      const toRemove = prevMonthlyIds.filter((id) => !nextMonthlyIds.includes(id));

      const monthliesToAdd = await Promise.all(
        nextMonthlyIds.map((monthlyId) => fetchMonthlyById(monthlyId))
      );
      await Promise.all(
        nextMonthlyIds.map(async (monthlyId, i) => {
          const monthly = monthliesToAdd[i];
          const existing = (monthly.connectedProjects || []).map((c: any) =>
            typeof c === "string"
              ? { projectId: c, monthlyTargetCount: 1, monthlyDoneCount: 0 }
              : {
                  projectId: c.projectId,
                  monthlyTargetCount: c.monthlyTargetCount ?? 1,
                  monthlyDoneCount: c.monthlyDoneCount ?? 0,
                }
          );
          const withoutThis = existing.filter((c) => c.projectId !== project.id);
          const current = existing.find((c) => c.projectId === project.id);
          const newConnectedProjects = [
            ...withoutThis,
            {
              projectId: project.id,
              monthlyTargetCount: 1,
              monthlyDoneCount: current?.monthlyDoneCount ?? 0,
            },
          ];
          const prevIds = (monthly.connectedProjects || []).map((c: any) =>
            typeof c === "string" ? c : c.projectId
          );
          await updateMonthly(
            monthlyId,
            { connectedProjects: newConnectedProjects },
            {
              prevConnectedProjectIds: prevIds,
              skipProjectConnectedMonthliesSync: true,
              updatedMonthlyForProgress: {
                id: monthly.id,
                objective: monthly.objective,
                startDate: monthly.startDate,
                endDate: monthly.endDate,
                connectedProjects: newConnectedProjects,
              },
            }
          );
        })
      );

      const monthliesToRemove = await Promise.all(
        toRemove.map((monthlyId) => fetchMonthlyById(monthlyId))
      );
      await Promise.all(
        toRemove.map(async (monthlyId, i) => {
          const monthly = monthliesToRemove[i];
          const existing = (monthly.connectedProjects || []).map((c: any) =>
            typeof c === "string"
              ? { projectId: c, monthlyTargetCount: 1, monthlyDoneCount: 0 }
              : {
                  projectId: c.projectId,
                  monthlyTargetCount: c.monthlyTargetCount ?? 1,
                  monthlyDoneCount: c.monthlyDoneCount ?? 0,
                }
          );
          const newConnectedProjects = existing.filter(
            (c) => c.projectId !== project.id
          );
          const prevIds = (monthly.connectedProjects || []).map((c: any) =>
            typeof c === "string" ? c : c.projectId
          );
          await updateMonthly(
            monthlyId,
            { connectedProjects: newConnectedProjects },
            {
              prevConnectedProjectIds: prevIds,
              skipProjectConnectedMonthliesSync: true,
              updatedMonthlyForProgress: {
                id: monthly.id,
                objective: monthly.objective,
                startDate: monthly.startDate,
                endDate: monthly.endDate,
                connectedProjects: newConnectedProjects,
              },
            }
          );
        })
      );

      // 3. 삭제된 태스크들 처리 (병렬)
      if (deletedTaskIds.length > 0) {
        await Promise.all(
          deletedTaskIds.map((taskId) =>
            deleteTaskFromProject(project.id, taskId).catch(() => {})
          )
        );
      }

      // 4. 폼의 태스크들 처리 (병렬)
      const formTasks = data.tasks.map((task) => ({
        ...task,
        title: task.title.trim() || "태스크",
      }));

      const taskResults = await Promise.allSettled(
        formTasks.map(async (task) => {
          const isNewTask = task.id.startsWith("temp_");
          const isExistingTask = tasks.some((t) => t.id === task.id);
          if (isNewTask) {
            await addTaskToProject(project.id, {
              title: task.title,
              date: new Date(task.date),
              duration: task.duration,
              done: task.done,
              userId: user?.uid || "",
              projectId: project.id,
            });
          } else if (isExistingTask) {
            await updateTaskInProject(project.id, task.id, {
              title: task.title,
              date: new Date(task.date),
              duration: task.duration,
              done: task.done,
            });
          }
        })
      );
      const taskFailure = taskResults.find((r) => r.status === "rejected");
      if (taskFailure && taskFailure.status === "rejected") {
        throw new Error(
          `태스크 저장 실패: ${taskFailure.reason?.message ?? ""}`
        );
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

      // 4. 캐시 무효화 후 페이지 이동 (연결된 먼슬리 쪽도 무효화해 상세/수정에서 최신 반영)
      const updatedMonthlyIds = [...new Set([...nextMonthlyIds, ...toRemove])];
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] }),
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["taskCounts", projectId] }),
        queryClient.invalidateQueries({ queryKey: ["connectedMonthlies", projectId] }),
        ...updatedMonthlyIds.map((mid) =>
          queryClient.invalidateQueries({ queryKey: ["monthly", mid] })
        ),
        queryClient.invalidateQueries({ queryKey: ["monthlies"] }),
      ]);

      router.replace(`/para/projects/${project.id}`);
    } catch (error) {
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
    monthliesLoading
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
      className={`container max-w-md px-4 py-4 pb-20 relative h-fit ${
        isSubmitting ? "pointer-events-none" : ""
      }`}
    >
      {/* 로딩 오버레이 */}
      <LoadingOverlay isLoading={isSubmitting} message="프로젝트 저장 중...">
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

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

          <div className="space-y-4">
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

            {/* 프로젝트 유형 선택 */}
            <div>
              <Label>프로젝트 유형</Label>
              <div className="mt-2 space-y-3">
                <div
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleCategoryChange("repetitive")}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.watch("category") === "repetitive"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/25"
                      }`}
                    >
                      {form.watch("category") === "repetitive" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium cursor-pointer">
                      반복형 프로젝트
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      동일한 행동을 여러 번 반복하는 프로젝트 (운동, 독서, 습관
                      등)
                    </p>
                  </div>
                </div>
                <div
                  className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleCategoryChange("task_based")}
                >
                  <div className="mt-1 flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        form.watch("category") === "task_based"
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/25"
                      }`}
                    >
                      {form.watch("category") === "task_based" && (
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium cursor-pointer">
                      작업형 프로젝트
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      다양한 업무를 단계별로 완료하는 프로젝트 (개발, 학습, 창작
                      등)
                    </p>
                  </div>
                </div>
              </div>
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
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="description">프로젝트 설명</Label>
                <Badge variant="secondary" className="text-xs">
                  선택사항
                </Badge>
              </div>
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
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">일정 및 목표</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="target">목표 설명</Label>
              <Input
                id="target"
                type="text"
                {...form.register("target")}
                placeholder={
                  form.watch("category") === "repetitive"
                    ? "예: 주요 개념 정리"
                    : "예: 완성된 이력서 1부"
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.watch("category") === "repetitive"
                  ? "반복할 행동의 구체적인 목표를 설명하세요"
                  : "완성할 결과물의 구체적인 목표를 설명하세요"}
              </p>
              {form.formState.errors.target && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.target.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                  disabled={projectWithStatus.status !== "scheduled"}
                />
                {form.formState.errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="endDate">목표 완료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register("endDate")}
                  max={(() => {
                    // 이번달 이후 6개월까지만 가능 (월간 생성 가능 월과 동일)
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth();
                    const sixMonthsLater = new Date(
                      currentYear,
                      currentMonth + 6,
                      0
                    );
                    return sixMonthsLater.toISOString().split("T")[0];
                  })()}
                />
                {form.formState.errors.endDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <CustomAlert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>기간 정보</AlertTitle>
              <AlertDescription>
                {projectWithStatus.status !== "scheduled" && (
                  <>
                    프로젝트가 시작된 후에는 시작일을 변경할 수 없습니다.
                    <br />
                  </>
                )}
                종료일은 이번달 이후 6개월까지만 설정 가능합니다 (월간 생성 가능
                월과 동일)
              </AlertDescription>
            </CustomAlert>

            {duration > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <Label htmlFor="targetCount">
                {form.watch("category") === "repetitive"
                  ? translate("para.projects.targetCount.repetitive")
                  : translate("para.projects.targetCount.taskBased")}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="targetCount"
                  type="number"
                  {...form.register("targetCount", { valueAsNumber: true })}
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
              {form.formState.errors.targetCount && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.targetCount.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 태스크 목록 섹션 */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">태스크 목록</h2>
              <span className="text-sm text-muted-foreground">
                ({fields.length}개)
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addTask}>
              <Plus className="h-4 w-4 mr-2" />
              태스크 추가
            </Button>
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

          {/* 삭제 버튼 - 선택된 태스크가 있을 때만 표시 */}
          {(form.watch("category") === "task_based" ||
            (form.watch("category") === "repetitive" &&
              completedTasks >= form.watch("targetCount"))) &&
            selectedTasks.length > 0 && (
              <div className="mb-3">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // 1. UI에서 선택된 태스크들 제거
                    const remainingTasks = fields.filter(
                      (field) => !selectedTasks.includes(field.id)
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
              <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="group">
                    {/* 체크박스와 넘버링 - 카드 바깥에 배치 */}
                    <div className="flex items-center gap-2 mb-2">
                      {/* 선택 체크박스 - 작업형 또는 반복형에서 추가된 태스크만 표시 */}
                      {(form.watch("category") === "task_based" ||
                        (form.watch("category") === "repetitive" &&
                          index >= form.watch("targetCount"))) && (
                        <div className="flex-shrink-0">
                          <Checkbox
                            checked={selectedTasks.includes(field.id)}
                            onCheckedChange={(checked) => {
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

                      {/* 인덱스 번호 */}
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        <span className="text-xs font-medium text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {/* 태스크 카드 */}
                    <div className="p-3 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                      <div className="space-y-3">
                        {/* 첫 번째 줄: 완료 상태, 제목 */}
                        <div className="flex items-center gap-3">
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
                              index < form.watch("targetCount")
                            }
                          />
                        </div>

                        {/* 두 번째 줄: 날짜, 시간 */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <Input
                              type="date"
                              {...form.register(`tasks.${index}.date`)}
                              className="w-full text-sm min-w-0"
                              min={form.watch("startDate")}
                              max={form.watch("endDate")}
                              readOnly={
                                form.watch("category") === "repetitive" &&
                                index < form.watch("targetCount")
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              {...form.register(`tasks.${index}.duration`, {
                                valueAsNumber: true,
                                onChange: (e) => {},
                                onBlur: (e) => {},
                              })}
                              placeholder="1.0"
                              min="0.1"
                              step="0.1"
                              className="w-16 text-sm"
                              readOnly={
                                form.watch("category") === "repetitive" &&
                                index < form.watch("targetCount")
                              }
                            />
                            <span className="text-xs text-muted-foreground">
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

        {/* 먼슬리 연결 섹션 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">먼슬리 연결</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              이 프로젝트를 특정 먼슬리에 연결하여 월별 목표로 관리할 수
              있습니다.
            </p>

            {/* 현재 연결된 먼슬리들 표시 */}
            {selectedMonthlyIds.length > 0 && allMonthlies.length > 0 && (
              <div>
                <Label>현재 연결된 먼슬리</Label>
                <div className="mt-2 space-y-2">
                  {allMonthlies
                    .filter((monthly) =>
                      selectedMonthlyIds.includes(monthly.id)
                    )
                    .map((monthly) => (
                      <div
                        key={monthly.id}
                        className="p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">
                              {monthly.objective}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(monthly.startDate)} ~{" "}
                              {formatDate(monthly.endDate)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMonthlyIds((prev) =>
                                prev.filter((id) => id !== monthly.id)
                              );
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                새로운 먼슬리에 연결하거나 기존 연결을 관리하세요
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowMonthlyConnectionDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                먼슬리 연결 관리
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

      <MonthlyConnectionDialog
        open={showMonthlyConnectionDialog}
        onOpenChange={setShowMonthlyConnectionDialog}
        availableMonthlies={availableMonthliesForConnection}
        selectedMonthlyIds={selectedMonthlyIds}
        onMonthlySelectionChange={setSelectedMonthlyIds}
        onConfirm={() => {}}
      />

      {/* 카테고리 변경 다이얼로그 */}
      <Dialog
        open={showCategoryChangeDialog}
        onOpenChange={setShowCategoryChangeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 유형 변경</DialogTitle>
            <DialogDescription>
              프로젝트 유형을 변경하면 기존에 생성된 모든 태스크가 삭제됩니다.
              계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 현재 {fields.length}개의 태스크가 생성되어 있습니다. 이 작업은
              되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryChangeDialog(false);
                setPendingCategoryChange(null);
              }}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingCategoryChange) {
                  applyCategoryChange(pendingCategoryChange);
                  replace([]); // 태스크 초기화
                }
                setShowCategoryChangeDialog(false);
                setPendingCategoryChange(null);
              }}
            >
              유형 변경하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </LoadingOverlay>
    </div>
  );
}
