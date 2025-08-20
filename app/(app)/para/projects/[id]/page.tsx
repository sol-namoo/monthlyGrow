"use client";

import { useState, useEffect, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Star,
  Bookmark,
  Clock,
  CalendarDays,
  Target,
  AlertCircle,
  Calendar,
  Zap,
  Gift,
  Edit,
  Sparkles,
  Plus,
  Archive,
  BookOpen,
  ExternalLink,
  CheckCircle2,
  Circle,
  Trash2,
  FileText,
  PenTool,
  Info,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  CustomAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/custom-alert";
import { Alert } from "@/components/ui/alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { getProjectStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchProjectById,
  deleteProjectById,
  fetchAllTasksByProjectId,
  getTaskCountsByProjectId,
  getTaskTimeStatsByProjectId,
  addTaskToProject,
  updateTaskInProject,
  deleteTaskFromProject,
  fetchAreaById,
  fetchMonthliesByIds,
  updateProject,
  createUnifiedArchive,
  updateUnifiedArchive,
  fetchSingleArchive,
} from "@/lib/firebase/index";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate, formatDateForInput, getMonthlyStatus } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";

// 태스크 폼 스키마 정의
const taskFormSchema = z.object({
  title: z.string().min(1, "태스크 제목을 입력해주세요"),
  date: z.string().min(1, "날짜를 선택해주세요"),
  duration: z
    .number()
    .min(0.1, "소요 시간은 0.1 이상이어야 합니다")
    .multipleOf(0.1, "소요 시간은 소수점 첫째 자리까지 입력 가능합니다"),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

// 로딩 스켈레톤 컴포넌트
function ProjectDetailSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();

  // Next.js 15에서는 params가 Promise이므로 unwrap
  const resolvedParams = use(params as unknown as Promise<{ id: string }>);
  const { id: projectId } = resolvedParams;
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false); // 변경 사항 감지 플래그
  const [isNavigating, setIsNavigating] = useState(false); // 페이지 이동 중 로딩 상태

  // 태스크 폼 설정
  const taskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      date: "",
      duration: 1,
    },
  });

  // 태스크 수정 폼 설정
  const editTaskForm = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      date: "",
      duration: 1,
    },
  });

  const queryClient = useQueryClient();

  // 페이지를 나갈 때 캐시 무효화 (변경 사항이 있을 때만)
  useEffect(() => {
    return () => {
      // 변경 사항이 있을 때만 캐시 무효화
      if (hasChanges) {
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        queryClient.invalidateQueries({ queryKey: ["projects", user?.uid] });
        queryClient.invalidateQueries({ queryKey: ["taskCounts", projectId] });
        queryClient.invalidateQueries({ queryKey: ["timeStats", projectId] });
      }
    };
  }, [projectId, user?.uid, queryClient, hasChanges]);

  // 페이지 이동 시 조건부 캐시 무효화
  const handleNavigateToEdit = async () => {
    setIsNavigating(true); // 로딩 상태 시작

    try {
      // 변경사항이 있을 때만 캐시 무효화
      if (hasChanges) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
          queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
          queryClient.invalidateQueries({
            queryKey: ["taskCounts", projectId],
          }),
          queryClient.invalidateQueries({ queryKey: ["timeStats", projectId] }),
        ]);

        // 캐시에서 완전히 제거
        queryClient.removeQueries({ queryKey: ["project", projectId] });
        queryClient.removeQueries({ queryKey: ["tasks", projectId] });
      }

      router.push(`/para/projects/edit/${projectId}`);
    } catch (error) {
      console.error("페이지 이동 중 오류:", error);
      setIsNavigating(false); // 오류 시 로딩 상태 해제
    }
  };

  // 프로젝트 삭제 mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProjectById(projectId),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: translate("paraProjectDetail.delete.success.title"),
        description: translate("paraProjectDetail.delete.success.description"),
      });
      router.push("/para?tab=projects");
    },
    onError: (error: Error) => {
      console.error("프로젝트 삭제 실패:", error);
      toast({
        title: translate("paraProjectDetail.delete.error.title"),
        description: translate("paraProjectDetail.delete.error.description"),
        variant: "destructive",
      });
    },
  });

  // 태스크 추가 mutation
  const addTaskMutation = useMutation({
    mutationFn: (taskData: TaskFormData) => {
      const newTask = {
        title: taskData.title,
        date: new Date(taskData.date),
        duration: taskData.duration,
        done: false,
      };
      return addTaskToProject(projectId, {
        ...newTask,
        userId: user?.uid || "",
        projectId,
      });
    },
    onSuccess: () => {
      setHasChanges(true); // 변경 사항 플래그 설정만
      // 태스크 변경 시 먼슬리 태스크 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
      queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });
      toast({
        title: translate("paraProjectDetail.task.add.success.title"),
        description: translate(
          "paraProjectDetail.task.add.success.description"
        ),
      });
      setShowTaskDialog(false);
      taskForm.reset();
    },
    onError: (error) => {
      toast({
        title: translate("paraProjectDetail.task.add.error.title"),
        description: translate("paraProjectDetail.task.add.error.description"),
        variant: "destructive",
      });
    },
  });

  // 태스크 수정 mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      taskData,
    }: {
      taskId: string;
      taskData: Partial<any>;
    }) => {
      return updateTaskInProject(projectId, taskId, taskData);
    },
    onSuccess: () => {
      setHasChanges(true); // 변경 사항 플래그 설정
      toast({
        title: translate("paraProjectDetail.task.edit.success.title"),
        description: translate(
          "paraProjectDetail.task.edit.success.description"
        ),
      });
    },
    onError: (error) => {
      toast({
        title: translate("paraProjectDetail.task.edit.error.title"),
        description: translate("paraProjectDetail.task.edit.error.description"),
        variant: "destructive",
      });
    },
    onSettled: () => {
      // 성공/실패와 관계없이 쿼리 무효화하여 최신 데이터 확보
      queryClient.invalidateQueries({
        queryKey: ["tasks", "project", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskCounts", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
      queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });

      // monthly의 completed tasks 쿼리도 무효화
      queryClient.invalidateQueries({ queryKey: ["completedTasks"] });
    },
  });

  // 태스크 삭제 mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      return deleteTaskFromProject(projectId, taskId);
    },
    onMutate: async (taskId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({
        queryKey: ["tasks", "project", projectId],
      });

      // 이전 데이터 백업
      const previousTasks = queryClient.getQueryData([
        "tasks",
        "project",
        projectId,
      ]);

      // Optimistic update - 태스크 제거
      queryClient.setQueryData(["tasks", "project", projectId], (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== taskId);
      });

      return { previousTasks };
    },
    onError: (error, taskId, context) => {
      // 오류 시 이전 데이터로 복원
      if (context?.previousTasks) {
        queryClient.setQueryData(
          ["tasks", "project", projectId],
          context.previousTasks
        );
      }
      toast({
        title: "태스크 삭제 실패",
        description: "태스크 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      setHasChanges(true); // 변경 사항 플래그 설정
      // 태스크 변경 시 먼슬리 태스크 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
      queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });
      toast({
        title: "태스크 삭제 완료",
        description: "태스크가 성공적으로 삭제되었습니다.",
      });
    },
    onSettled: () => {
      // 성공/실패와 관계없이 쿼리 무효화하여 최신 데이터 확보
      queryClient.invalidateQueries({
        queryKey: ["tasks", "project", projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["taskCounts", projectId],
      });
      // 태스크 변경 시 먼슬리 태스크 카운트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
      queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });
    },
  });

  // undefined 값들을 필터링하는 유틸리티 함수
  const filterUndefinedValues = (obj: any) => {
    const filtered: any = {};
    Object.keys(obj).forEach((key) => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
        filtered[key] = obj[key];
      }
    });
    return filtered;
  };

  // 회고 저장 mutation
  const saveRetrospectiveMutation = useMutation({
    mutationFn: async (retrospectiveData: any) => {
      // undefined 값들을 필터링
      const filteredData = filterUndefinedValues({
        bestMoment: retrospectiveData.bestMoment,
        routineAdherence: retrospectiveData.routineAdherence,
        unexpectedObstacles: retrospectiveData.unexpectedObstacles,
        nextMonthlyApplication: retrospectiveData.nextMonthlyApplication,
        userRating: retrospectiveData.userRating,
        bookmarked: retrospectiveData.bookmarked,
        title: retrospectiveData.title,
        summary: retrospectiveData.summary,
        content: retrospectiveData.content,
      });

      // 기존 아카이브가 있는지 확인
      const existingArchive = await fetchSingleArchive(
        user?.uid || "",
        project?.id || "",
        "project_retrospective"
      );

      if (existingArchive) {
        // 기존 아카이브 업데이트
        await updateUnifiedArchive(existingArchive.id, {
          title: filteredData.title || project?.title || "",
          content: filteredData.content || "",
          userRating: filteredData.userRating,
          bookmarked: filteredData.bookmarked,
          goalAchieved: filteredData.goalAchieved,
          memorableTask: filteredData.memorableTask,
          stuckPoints: filteredData.stuckPoints,
          newLearnings: filteredData.newLearnings,
          nextProjectImprovements: filteredData.nextProjectImprovements,
        });
      } else {
        // 새 아카이브 생성
        const newArchive = await createUnifiedArchive({
          userId: user?.uid || "",
          type: "project_retrospective",
          parentId: project?.id || "",
          title: filteredData.title || project?.title || "",
          content: filteredData.content || "",
          userRating: filteredData.userRating,
          bookmarked: filteredData.bookmarked,
          goalAchieved: filteredData.goalAchieved,
          memorableTask: filteredData.memorableTask,
          stuckPoints: filteredData.stuckPoints,
          newLearnings: filteredData.newLearnings,
          nextProjectImprovements: filteredData.nextProjectImprovements,
        });

        // 프로젝트에 회고 연결 (아카이브 ID 사용)
        await updateProject(project?.id || "", {
          retrospective: {
            id: newArchive.id,
            userId: newArchive.userId,
            projectId: newArchive.parentId,
            createdAt: newArchive.createdAt,
            updatedAt: newArchive.updatedAt,
            ...filteredData,
          },
        });
      }
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "회고 저장 완료",
        description: "회고가 성공적으로 저장되었습니다.",
      });
      setShowRetrospectiveDialog(false);
    },
    onError: (error: Error) => {
      console.error("회고 저장 실패:", error);
      toast({
        title: "회고 저장 실패",
        description: "회고 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 노트 저장 mutation
  const saveNoteMutation = useMutation({
    mutationFn: async (noteContent: string) => {
      // 기존 아카이브가 있는지 확인
      const existingArchive = await fetchSingleArchive(
        user?.uid || "",
        project?.id || "",
        "project_note"
      );

      if (existingArchive) {
        // 기존 아카이브 업데이트
        await updateUnifiedArchive(existingArchive.id, {
          title: project?.title || "",
          content: noteContent,
        });
      } else {
        // 새 아카이브 생성
        const newArchive = await createUnifiedArchive({
          userId: user?.uid || "",
          type: "project_note",
          parentId: project?.id || "",
          title: project?.title || "",
          content: noteContent,
        });

        // 프로젝트에 노트 연결 (아카이브 ID 사용)
        await updateProject(project?.id || "", {
          notes: [
            {
              id: newArchive.id,
              userId: newArchive.userId,
              title: project?.title || "",
              content: noteContent,
              createdAt: newArchive.createdAt,
              updatedAt: newArchive.updatedAt,
            },
          ],
        });
      }
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "노트 저장 완료",
        description: "노트가 성공적으로 저장되었습니다.",
      });
      setShowAddNoteDialog(false);
    },
    onError: (error: Error) => {
      console.error("노트 저장 실패:", error);
      toast({
        title: "노트 저장 실패",
        description: "노트 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 모든 useState들을 useQuery 전에 호출
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false); // 회고 모달 상태

  // 현재 업데이트 중인 태스크 ID 추적
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Firestore에서 실제 데이터 가져오기
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectById(projectId),
    enabled: !!projectId,
  });

  // Area 정보 가져오기
  const { data: area } = useQuery({
    queryKey: ["area", project?.areaId],
    queryFn: () => fetchAreaById(project?.areaId || ""),
    enabled: !!project?.areaId,
  });

  // 연결된 먼슬리 정보 가져오기
  const { data: connectedMonthlies = [] } = useQuery({
    queryKey: ["connectedMonthlies", project?.id],
    queryFn: async () => {
      if (!project || !project.connectedMonthlies) return [];

      // connectedMonthlies가 객체 배열인지 문자열 배열인지 확인
      const monthlyIds = Array.isArray(project.connectedMonthlies)
        ? project.connectedMonthlies.map((monthly: any) =>
            typeof monthly === "string" ? monthly : monthly.id
          )
        : [];

      const monthlies = await fetchMonthliesByIds(monthlyIds);

      return monthlies;
    },
    enabled: !!project && !!project.connectedMonthlies,
  });

  // 태스크 개수만 가져오기 (성능 최적화용) - 우선 로드
  const { data: taskCounts, isLoading: isTaskCountsLoading } = useQuery({
    queryKey: ["taskCounts", projectId],
    queryFn: () => getTaskCountsByProjectId(projectId),
    enabled: !!projectId,
  });

  // 시간 통계 가져오기 (개요 탭에서 사용)
  const { data: timeStats, isLoading: isTimeStatsLoading } = useQuery({
    queryKey: ["timeStats", projectId],
    queryFn: () => getTaskTimeStatsByProjectId(projectId),
    enabled: !!projectId && activeTab === "overview",
  });

  // 프로젝트의 모든 tasks 가져오기 (필요할 때만)
  const {
    data: tasks,
    isLoading: isTasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks", "project", projectId],
    queryFn: () => fetchAllTasksByProjectId(projectId),
    enabled: !!projectId && activeTab === "tasks", // 태스크 탭에서만 로드
  });

  // 로딩 상태
  if (isLoading || isTasksLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <ProjectDetailSkeleton />
      </div>
    );
  }

  // 에러 상태
  if (error || tasksError) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
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
            {error ? "프로젝트 정보를 불러오는 중 오류가 발생했습니다." : ""}
            {tasksError ? "작업 정보를 불러오는 중 오류가 발생했습니다." : ""}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 상태
  if (!project) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
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

  // 프로젝트 상태를 미리 계산하여 객체에 추가
  const projectWithStatus = project
    ? {
        ...project,
        status: getProjectStatus(project),
      }
    : null;

  // 최적화된 태스크 개수 사용 (taskCounts 우선, 폴백으로 tasks 사용)
  const completedTasks =
    (taskCounts?.completed ?? 0) ||
    (tasks?.filter((task: any) => task.done).length ?? 0);
  const totalTasks = (taskCounts?.total ?? 0) || (tasks?.length ?? 0);

  // 반복형 프로젝트의 경우 targetCount 사용, 작업형의 경우 tasks 개수 사용
  const targetCount =
    project?.targetCount ||
    (project?.category === "repetitive" ? completedTasks : totalTasks);

  // 진행률 계산 - 반복형은 targetCount 기준, 작업형은 실제 태스크 개수 기준
  const progressPercentage =
    project?.category === "repetitive"
      ? project?.targetCount && project.targetCount > 0
        ? Math.round((completedTasks / project.targetCount) * 100)
        : 0
      : totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  // 스마트 회고 조건 (완료율 90% 미만)
  const shouldShowSmartRetrospective = progressPercentage < 90;

  if (!project) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20 text-center">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 태스크 폼 제출 핸들러
  const onTaskSubmit = (data: TaskFormData) => {
    addTaskMutation.mutate(data);
  };

  // 태스크 모달 열기 핸들러
  const openTaskDialog = () => {
    // 프로젝트 시작일을 기본값으로 설정
    const projectStart = new Date(project.startDate);

    taskForm.setValue("date", formatDateForInput(projectStart));
    taskForm.setValue("duration", 1.0); // 기본값 1.0시간 설정
    setShowTaskDialog(true);
  };

  // 태스크 완료 상태 토글 핸들러 (개선된 버전)
  const handleTaskToggle = (taskId: string, currentStatus: boolean) => {
    setUpdatingTaskId(taskId);

    // Optimistic update - 즉시 UI 반영
    queryClient.setQueryData(["tasks", "project", projectId], (old: any) => {
      if (!old) return old;
      return old.map((task: any) =>
        task.id === taskId
          ? { ...task, done: !currentStatus, updatedAt: new Date() }
          : task
      );
    });

    // taskCounts도 optimistic update
    queryClient.setQueryData(["taskCounts", projectId], (old: any) => {
      if (!old) return old;
      const newCompletedTasks = currentStatus
        ? old.completedTasks - 1
        : old.completedTasks + 1;
      return {
        ...old,
        completedTasks: newCompletedTasks,
      };
    });

    updateTaskMutation.mutate(
      {
        taskId,
        taskData: { done: !currentStatus },
      },
      {
        onSuccess: () => {
          setHasChanges(true); // 변경 사항 플래그 설정만
          // 태스크 변경 시 먼슬리 태스크 카운트 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
          queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });
        },
        onError: (error, variables, context) => {
          // 오류 시 이전 데이터로 복원
          queryClient.invalidateQueries({
            queryKey: ["tasks", "project", projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["taskCounts", projectId],
          });
          // 태스크 변경 시 먼슬리 태스크 카운트 캐시 무효화
          queryClient.invalidateQueries({ queryKey: ["monthlyTaskCounts"] });
          queryClient.invalidateQueries({ queryKey: ["projectTaskCounts"] });
          toast({
            title: "태스크 상태 변경 실패",
            description: "태스크 상태 변경 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        },
        onSettled: () => {
          setUpdatingTaskId(null);
        },
      }
    );
  };

  // 태스크 삭제 핸들러
  const handleDeleteTask = (taskId: string) => {
    if (confirm("이 태스크를 삭제하시겠습니까?")) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  // 태스크 수정 모달 열기 핸들러
  const openEditTaskDialog = (task: any) => {
    setEditingTask(task);
    editTaskForm.setValue("title", task.title);
    editTaskForm.setValue("date", formatDateForInput(task.date));
    editTaskForm.setValue("duration", task.duration);
    setShowEditTaskDialog(true);
  };

  // 태스크 수정 제출 핸들러
  const onEditTaskSubmit = (data: TaskFormData) => {
    if (!editingTask) return;

    updateTaskMutation.mutate({
      taskId: editingTask.id,
      taskData: {
        title: data.title,
        date: new Date(data.date),
        duration: data.duration,
      },
    });

    setShowEditTaskDialog(false);
    setEditingTask(null);
    editTaskForm.reset();
  };

  const handleSaveRetrospective = async (data: any) => {
    try {
      // 프로젝트 회고 저장 로직
      const retrospectiveData = {
        userId: user?.uid || "",
        projectId: project?.id || "",
        ...data,
      };

      // 기존 회고가 있는지 확인
      const existingArchive = await fetchSingleArchive(
        user?.uid || "",
        project?.id || "",
        "project_retrospective"
      );

      if (existingArchive) {
        // 기존 아카이브 업데이트
        await updateUnifiedArchive(existingArchive.id, {
          title: data.title || project?.title || "",
          content: data.content || "",
          userRating: data.userRating,
          bookmarked: data.bookmarked,
          goalAchieved: data.goalAchieved,
          memorableTask: data.memorableTask,
          stuckPoints: data.stuckPoints,
          newLearnings: data.newLearnings,
          nextProjectImprovements: data.nextProjectImprovements,
        });
      } else {
        // 새 아카이브 생성
        const newArchive = await createUnifiedArchive({
          userId: user?.uid || "",
          type: "project_retrospective",
          parentId: project?.id || "",
          title: data.title || project?.title || "",
          content: data.content || "",
          userRating: data.userRating,
          bookmarked: data.bookmarked,
          goalAchieved: data.goalAchieved,
          memorableTask: data.memorableTask,
          stuckPoints: data.stuckPoints,
          newLearnings: data.newLearnings,
          nextProjectImprovements: data.nextProjectImprovements,
        });

        // 프로젝트에 회고 연결 (아카이브 ID 사용)
        await updateProject(project?.id || "", {
          retrospective: {
            id: newArchive.id,
            userId: newArchive.userId,
            projectId: newArchive.parentId,
            createdAt: newArchive.createdAt,
            updatedAt: newArchive.updatedAt,
            ...data,
          },
        });
      }

      toast({
        title: "회고 저장 완료",
        description: "회고가 성공적으로 저장되었습니다.",
      });
      setShowRetrospectiveDialog(false);
    } catch (error) {
      console.error("회고 저장 실패:", error);
      toast({
        title: "회고 저장 실패",
        description: "회고 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }

    const renderStarRating = (
      rating: number | undefined,
      setRating?: (rating: number) => void
    ) => {
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-7 w-7 transition-all duration-200 ${
                star <= (rating || 0)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              } ${setRating ? "cursor-pointer hover:scale-110" : ""}`}
              onClick={() => {
                if (setRating) {
                  setRating(star);
                }
              }}
            />
          ))}
          {rating && (
            <span className="ml-2 text-sm text-gray-600">{rating}점</span>
          )}
        </div>
      );
    };

    const getMonthlyTitle = (monthlyId: string) => {
      // TODO: 실제 먼슬리 데이터를 가져와서 사용
      return monthlyId;
    };

    const getMonthlyPeriod = (monthlyId: string) => {
      // TODO: 실제 먼슬리 데이터를 가져와서 사용
      return "";
    };

    return (
      <div
        className={`container max-w-md px-4 py-6 pb-20 relative ${
          isNavigating ? "pointer-events-none" : ""
        }`}
      >
        {/* 로딩 오버레이 */}
        <LoadingOverlay
          isVisible={isNavigating}
          message={translate("loading.navigating")}
        />
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNavigateToEdit}
              disabled={isNavigating}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* 프로젝트 기본 정보 (상단) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{project.title}</h1>
            {area ? (
              <Badge
                variant={area.name === "미분류" ? "destructive" : "secondary"}
              >
                {area.name}
              </Badge>
            ) : project.areaId ? (
              <Badge variant="outline">
                {translate("paraProjectDetail.areaLoading")}
              </Badge>
            ) : (
              <Badge variant="destructive">
                {translate("paraProjectDetail.noArea")}
              </Badge>
            )}
          </div>

          <p className="text-muted-foreground mb-4">{project.description}</p>

          {/* 상태 및 진행률 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.duration")}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(project.startDate, currentLanguage)} ~{" "}
                  {formatDate(project.endDate, currentLanguage)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.status")}
              </span>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    getProjectStatus(project) === "scheduled"
                      ? "secondary"
                      : getProjectStatus(project) === "in_progress"
                      ? "default"
                      : "outline"
                  }
                >
                  {getProjectStatus(project) === "scheduled"
                    ? translate("paraProjectDetail.statusLabels.planned")
                    : getProjectStatus(project) === "in_progress"
                    ? translate("paraProjectDetail.statusLabels.inProgress")
                    : getProjectStatus(project) === "completed"
                    ? translate("paraProjectDetail.statusLabels.completed")
                    : translate("paraProjectDetail.statusLabels.overdue")}
                </Badge>
                {getProjectStatus(project) === "overdue" && (
                  <Badge variant="destructive" className="text-xs">
                    {translate("paraProjectDetail.overdue")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.target")}
              </span>
              <span className="text-sm text-muted-foreground">
                {project.target}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.target")}{" "}
                {project.category === "repetitive"
                  ? translate("paraProjectDetail.targetLabels.count")
                  : translate("paraProjectDetail.targetLabels.tasks")}
              </span>
              <span className="text-sm text-muted-foreground">
                {project.targetCount || 0}
                {project.category === "repetitive"
                  ? translate("paraProjectDetail.targetLabels.times")
                  : translate("paraProjectDetail.targetLabels.tasks")}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.progress")}
              </span>
              <span className="text-sm text-muted-foreground">
                {progressPercentage || 0}%
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-value"
                style={{
                  width: `${progressPercentage || 0}%`,
                }}
              ></div>
            </div>

            {/* 연결된 먼슬리 */}
            <div>
              <span className="text-sm font-medium">
                {translate("paraProjectDetail.connectedMonthlies")}
              </span>
              <div className="mt-2 space-y-2">
                {connectedMonthlies && connectedMonthlies.length > 0 ? (
                  connectedMonthlies.map((monthly) => (
                    <div
                      key={monthly.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <Link
                          href={`/monthly/${monthly.id}`}
                          className="flex items-center gap-2 group"
                        >
                          <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                            {monthly.objective}
                          </span>
                          <ExternalLink className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(monthly.startDate, currentLanguage)} ~{" "}
                            {formatDate(monthly.endDate, currentLanguage)}
                          </span>
                          <Badge
                            variant={
                              getMonthlyStatus(monthly) === "in_progress"
                                ? "default"
                                : getMonthlyStatus(monthly) === "ended"
                                ? "secondary"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {getMonthlyStatus(monthly) === "in_progress"
                              ? translate(
                                  "paraProjectDetail.statusLabels.inProgress"
                                )
                              : getMonthlyStatus(monthly) === "ended"
                              ? translate(
                                  "paraProjectDetail.statusLabels.completed"
                                )
                              : translate(
                                  "paraProjectDetail.statusLabels.planned"
                                )}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Card className="p-4 text-center">
                    <p className="text-muted-foreground">
                      {translate("paraProjectDetail.noConnectedMonthlies")}
                    </p>
                  </Card>
                )}
              </div>
            </div>
            {connectedMonthlies && connectedMonthlies.length > 0 && (
              <div className="space-y-3">
                {connectedMonthlies.length >= 3 &&
                  getProjectStatus(project) === "in_progress" && (
                    <CustomAlert variant="warning" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>
                        {translate("paraProjectDetail.longTermProject.title")}
                      </AlertTitle>
                      <AlertDescription>
                        {translate(
                          "paraProjectDetail.longTermProject.description"
                        ).replace(
                          "{count}",
                          connectedMonthlies.length.toString()
                        )}
                      </AlertDescription>
                    </CustomAlert>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* 탭 영역 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">
              {translate("paraProjectDetail.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="tasks">
              {translate("paraProjectDetail.tabs.tasks")}
            </TabsTrigger>
            <TabsTrigger value="retrospective">
              {translate("paraProjectDetail.tabs.retrospective")}
            </TabsTrigger>
            <TabsTrigger value="note">
              {translate("paraProjectDetail.tabs.note")}
            </TabsTrigger>
          </TabsList>

          {/* 개요 탭 */}
          <TabsContent value="overview" className="mt-4">
            <div className="space-y-4">
              {/* 세부 진행 상황 */}
              <Card className="p-4 mb-4">
                <h3 className="font-semibold mb-3">
                  {translate("paraProjectDetail.progressStatus")}
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.completed")}{" "}
                      {project.category === "repetitive"
                        ? translate("paraProjectDetail.targetLabels.count")
                        : translate("paraProjectDetail.targetLabels.tasks")}
                    </span>
                    <span className="font-medium">
                      {completedTasks || 0}
                      {project.category === "repetitive"
                        ? translate("paraProjectDetail.targetLabels.times")
                        : translate("paraProjectDetail.targetLabels.items")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.remaining")}{" "}
                      {project.category === "repetitive"
                        ? translate("paraProjectDetail.targetLabels.count")
                        : translate("paraProjectDetail.targetLabels.tasks")}
                    </span>
                    <span className="font-medium">
                      {project.category === "repetitive"
                        ? Math.max(0, targetCount - (completedTasks || 0))
                        : (totalTasks || 0) - (completedTasks || 0)}
                      {project.category === "repetitive"
                        ? translate("paraProjectDetail.targetLabels.times")
                        : translate("paraProjectDetail.targetLabels.items")}
                    </span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.completedTime")}
                    </span>
                    <span className="font-medium">
                      {timeStats?.completedTime || 0}
                      {translate("paraProjectDetail.hours")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.remainingTime")}
                    </span>
                    <span className="font-medium">
                      {timeStats?.remainingTime || 0}
                      {translate("paraProjectDetail.hours")}
                    </span>
                  </div>
                </div>
              </Card>

              {/* 최근 활동 */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">
                  {translate("paraProjectDetail.recentActivity")}
                </h3>
                <div className="space-y-2">
                  {tasks && tasks.length > 0 ? (
                    tasks
                      .filter((task) => task.updatedAt) // updatedAt이 있는 태스크만
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt!).getTime() -
                          new Date(a.updatedAt!).getTime()
                      ) // 최신순 정렬
                      .slice(0, 2) // 최근 2개만
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          {task.done ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <span
                            className={
                              task.done
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {task.title}
                          </span>
                          <span className="text-muted-foreground ml-auto">
                            {formatDate(task.updatedAt, currentLanguage)}
                          </span>
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {translate("paraProjectDetail.noActivity")}
                    </p>
                  )}
                </div>
              </Card>

              {/* 프로젝트 정보 */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">
                  {translate("paraProjectDetail.projectInfo")}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.projectType")}
                    </span>
                    <span>
                      {project.category === "repetitive"
                        ? translate(
                            "paraProjectDetail.projectTypeLabels.repetitive"
                          )
                        : translate("paraProjectDetail.projectTypeLabels.task")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.target")}{" "}
                      {project.category === "repetitive"
                        ? translate("paraProjectDetail.targetLabels.count")
                        : translate("paraProjectDetail.targetLabels.tasks")}
                    </span>
                    <span>
                      {project.category === "repetitive" && project.targetCount
                        ? `${project.target} ${project.targetCount}${translate(
                            "paraProjectDetail.targetLabels.times"
                          )}`
                        : project.target}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.connectedArea")}
                    </span>
                    <span>
                      {area
                        ? area.name
                        : project.areaId
                        ? translate("settings.loading.areaInfo")
                        : "연결된 Area 없음"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.createdAt")}
                    </span>
                    <span>
                      {formatDate(project.createdAt, currentLanguage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.updatedAt")}
                    </span>
                    <span>
                      {formatDate(project.updatedAt, currentLanguage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {translate("paraProjectDetail.connectedMonthlies")}
                    </span>
                    <span>
                      {connectedMonthlies && connectedMonthlies.length > 0
                        ? `${connectedMonthlies.length}개`
                        : translate("paraProjectDetail.noConnectedMonthlies")}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 태스크 탭 */}
          <TabsContent value="tasks" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  {translate("paraProjectDetail.taskList")}
                </h3>
                {project.category === "task_based" && (
                  <Button size="sm" variant="outline" onClick={openTaskDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    {translate("paraProjectDetail.add")}
                  </Button>
                )}
              </div>

              {project.category === "repetitive" && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
                    <Info className="h-4 w-4" />
                    <span className="font-medium">프로젝트 정보</span>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    프로젝트가 시작된 후에는 시작일을 변경할 수 없습니다.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {tasks
                  ?.sort((a, b) => {
                    // 1. 완료 여부를 최우선 기준으로 정렬 (완료되지 않은 것이 먼저)
                    if (a.done !== b.done) {
                      return a.done ? 1 : -1;
                    }
                    // 2. 완료 여부가 같으면 날짜순 정렬
                    return (
                      new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                  })
                  .map((task) => (
                    <Card
                      key={task.id}
                      className={`p-3 transition-all duration-200 hover:shadow-md ${
                        task.done ? "bg-green-50/50 dark:bg-green-900/20" : ""
                      } ${updatingTaskId === task.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* 인덱스 번호 */}
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                          <span className="text-xs font-medium text-muted-foreground">
                            {tasks.indexOf(task) + 1}
                          </span>
                        </div>

                        {/* 완료 상태 토글 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskToggle(task.id, task.done);
                          }}
                          className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                          disabled={updatingTaskId === task.id}
                        >
                          {updatingTaskId === task.id ? (
                            <div className="h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : task.done ? (
                            <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                          ) : (
                            <Circle className="h-3 w-3 text-muted-foreground hover:text-green-600 hover:fill-green-100" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p
                              className={`text-sm font-medium transition-all duration-200 ${
                                task.done
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {formatDate(task.date, currentLanguage)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>
                                {typeof task.duration === "string"
                                  ? parseFloat(task.duration)
                                  : task.duration}
                                시간
                              </span>
                            </div>
                          </div>
                        </div>
                        {project.category === "task_based" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTaskDialog(task)}
                              className="flex-shrink-0 h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="flex-shrink-0 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  )) || []}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {completedTasks || 0}/{totalTasks || 0} 태스크 완료 (
                {progressPercentage || 0}%)
              </div>
            </div>
          </TabsContent>

          {/* 회고 탭 */}
          <TabsContent value="retrospective" className="mt-0">
            <div className="space-y-4">
              {project.retrospective ? (
                <Card className="p-6 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <h3 className="font-bold">회고</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {project.retrospective.bookmarked && (
                        <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      )}
                      {renderStarRating(project.retrospective.userRating)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {project.retrospective.bestMoment && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          가장 기억에 남는 순간
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.bestMoment}
                        </p>
                      </div>
                    )}

                    {project.retrospective.routineAdherence && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          루틴 준수율
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.routineAdherence}
                        </p>
                      </div>
                    )}

                    {project.retrospective.unexpectedObstacles && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          예상치 못한 장애물
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.unexpectedObstacles}
                        </p>
                      </div>
                    )}

                    {project.retrospective.nextMonthlyApplication && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          다음 달 적용 사항
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.nextMonthlyApplication}
                        </p>
                      </div>
                    )}

                    {project.retrospective.stuckPoints && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          막힌 지점
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.stuckPoints}
                        </p>
                      </div>
                    )}

                    {project.retrospective.newLearnings && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          새로운 학습
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.newLearnings}
                        </p>
                      </div>
                    )}

                    {project.retrospective.nextProjectImprovements && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          다음 프로젝트 개선사항
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.nextProjectImprovements}
                        </p>
                      </div>
                    )}

                    {project.retrospective.memorableTask && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">
                          가장 기억에 남는 작업
                        </h4>
                        <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                          {project.retrospective.memorableTask}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRetrospectiveDialog(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {translate("paraProjectDetail.retrospective.editTitle")}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/para/archives/${project.retrospective.id}`}>
                        {translate(
                          "paraProjectDetail.retrospective.viewDetail"
                        )}
                      </Link>
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                  <div className="mb-4">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {translate("paraProjectDetail.retrospective.noContent")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {projectWithStatus?.status === "completed"
                      ? translate("paraProjectDetail.retrospective.description")
                      : translate(
                          "paraProjectDetail.retrospective.inProgressDescription"
                        )}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowRetrospectiveDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("paraProjectDetail.retrospective.writeTitle")}
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 노트 탭 */}
          <TabsContent value="note" className="mt-0">
            <div className="space-y-4">
              {project.notes && project.notes.length > 0 ? (
                <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    <h3 className="font-bold">노트</h3>
                    <span className="text-xs text-muted-foreground">
                      마지막 업데이트:{" "}
                      {project.notes[0].updatedAt
                        ? formatDate(
                            project.notes[0].updatedAt,
                            currentLanguage
                          )
                        : formatDate(
                            project.notes[0].createdAt,
                            currentLanguage
                          )}
                    </span>
                  </div>
                  <div className="p-4 bg-muted/40 dark:bg-muted/30 rounded-lg min-h-[120px]">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {project.notes[0].content}
                    </p>
                  </div>
                </Card>
              ) : (
                <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                  <div className="mb-4">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {translate("paraProjectDetail.note.noNote")}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {translate("paraProjectDetail.note.description")}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowAddNoteDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("paraProjectDetail.note.addButton")}
                  </Button>
                </Card>
              )}

              {project.notes && project.notes.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setShowAddNoteDialog(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {translate("paraProjectDetail.note.edit")}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="프로젝트 삭제"
          type="delete"
          description="이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={() => {
            toast({
              title: "프로젝트 삭제 완료",
              description: "프로젝트가 삭제되었습니다.",
            });
            router.push("/para?tab=projects");
          }}
        />

        {/* 회고 노트 추가/수정 다이얼로그 (프로젝트 노트용) */}
        {/* Dialog 관련 import는 회고/노트 다이얼로그에서만 사용 */}
        {/* 삭제 다이얼로그는 ConfirmDialog만 사용 */}

        {/* 노트 작성/수정 다이얼로그 */}
        {showAddNoteDialog && (
          <NoteForm
            type="project"
            parent={project}
            onClose={() => setShowAddNoteDialog(false)}
            onSave={() => {
              // 노트 저장 후 데이터 새로고침
              queryClient.invalidateQueries({
                queryKey: ["project", projectId],
              });
            }}
          />
        )}

        {/* 프로젝트 회고 작성 다이얼로그 */}
        {showRetrospectiveDialog && (
          <RetrospectiveForm
            type="project"
            title={project?.title || ""}
            keyResults={[]}
            onClose={() => setShowRetrospectiveDialog(false)}
            onSave={handleSaveRetrospective}
          />
        )}

        {/* 태스크 추가 모달 */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>새 태스크 추가</DialogTitle>
              <DialogDescription>
                프로젝트에 새로운 태스크를 추가하세요.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={taskForm.handleSubmit(onTaskSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="task-title">태스크 제목</Label>
                <Input
                  id="task-title"
                  placeholder="태스크 제목을 입력하세요"
                  {...taskForm.register("title")}
                />
                {taskForm.formState.errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {taskForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="task-date">날짜</Label>
                <Input
                  id="task-date"
                  type="date"
                  min={formatDateForInput(project.startDate)}
                  max={formatDateForInput(project.endDate)}
                  {...taskForm.register("date")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("paraProjectDetail.duration")}:{" "}
                  {formatDate(project.startDate, currentLanguage)} ~{" "}
                  {formatDate(project.endDate, currentLanguage)}
                </p>
                {taskForm.formState.errors.date && (
                  <p className="text-sm text-red-500 mt-1">
                    {taskForm.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="task-duration">
                  {translate("paraProjectDetail.taskForm.duration")}
                </Label>
                <Input
                  id="task-duration"
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  placeholder="1.0"
                  {...taskForm.register("duration", { valueAsNumber: true })}
                />
                {taskForm.formState.errors.duration && (
                  <p className="text-sm text-red-500 mt-1">
                    {taskForm.formState.errors.duration.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowTaskDialog(false)}
                >
                  {translate("paraProjectDetail.taskForm.cancel")}
                </Button>
                <Button type="submit" disabled={addTaskMutation.isPending}>
                  {addTaskMutation.isPending
                    ? translate("paraProjectDetail.taskForm.adding")
                    : translate("paraProjectDetail.taskForm.addTitle")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 태스크 수정 모달 */}
        <Dialog open={showEditTaskDialog} onOpenChange={setShowEditTaskDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {translate("paraProjectDetail.taskForm.editTitle")}
              </DialogTitle>
              <DialogDescription>
                {translate("paraProjectDetail.taskForm.editDescription")}
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={editTaskForm.handleSubmit(onEditTaskSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="edit-task-title">
                  {translate("paraProjectDetail.taskForm.title")}
                </Label>
                <Input
                  id="edit-task-title"
                  placeholder={translate(
                    "paraProjectDetail.taskForm.titlePlaceholder"
                  )}
                  {...editTaskForm.register("title")}
                />
                {editTaskForm.formState.errors.title && (
                  <p className="text-sm text-red-500 mt-1">
                    {editTaskForm.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-task-date">
                  {translate("paraProjectDetail.taskForm.date")}
                </Label>
                <Input
                  id="edit-task-date"
                  type="date"
                  min={formatDateForInput(project.startDate)}
                  max={formatDateForInput(project.endDate)}
                  {...editTaskForm.register("date")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("paraProjectDetail.duration")}:{" "}
                  {formatDate(project.startDate, currentLanguage)} ~{" "}
                  {formatDate(project.endDate, currentLanguage)}
                </p>
                {editTaskForm.formState.errors.date && (
                  <p className="text-sm text-red-500 mt-1">
                    {editTaskForm.formState.errors.date.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="edit-task-duration">
                  {translate("paraProjectDetail.taskForm.duration")}
                </Label>
                <Input
                  id="edit-task-duration"
                  type="number"
                  min="0.1"
                  max="24"
                  step="0.1"
                  placeholder="1.0"
                  {...editTaskForm.register("duration", {
                    valueAsNumber: true,
                  })}
                />
                {editTaskForm.formState.errors.duration && (
                  <p className="text-sm text-red-500 mt-1">
                    {editTaskForm.formState.errors.duration.message}
                  </p>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditTaskDialog(false);
                    setEditingTask(null);
                    editTaskForm.reset();
                  }}
                >
                  취소
                </Button>
                <Button type="submit" disabled={updateTaskMutation.isPending}>
                  {updateTaskMutation.isPending
                    ? translate("paraProjectDetail.taskForm.editing")
                    : translate("paraProjectDetail.taskForm.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="프로젝트 삭제"
          description="이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={() => {
            deleteProjectMutation.mutate();
            setShowDeleteDialog(false);
          }}
        />
      </div>
    );
  };
}
