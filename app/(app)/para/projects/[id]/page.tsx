"use client";

import { useState, useEffect, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Edit,
  Plus,
  Target,
  Clock,
  RotateCcw,
  Star,
  Bookmark,
  Trash2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProjectStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchProjectById,
  deleteProjectById,
  fetchAllTasksByProjectId,
  getTaskCountsByProjectId,
  getTaskTimeStatsByProjectId,
  addTaskToProject,
  updateTaskInProject,
  deleteTaskFromProject,
} from "@/lib/firebase";
import { formatDate, formatDateForInput } from "@/lib/utils";
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

// 태스크 폼 스키마 정의
const taskFormSchema = z.object({
  title: z.string().min(1, "태스크 제목을 입력해주세요"),
  date: z.string().min(1, "날짜를 선택해주세요"),
  duration: z
    .number()
    .min(0, "소요 시간은 0 이상이어야 합니다")
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);

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

  // 프로젝트 삭제 mutation
  const deleteProjectMutation = useMutation({
    mutationFn: () => deleteProjectById(projectId),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({
        title: "프로젝트 삭제 완료",
        description: "프로젝트가 성공적으로 삭제되었습니다.",
      });
      router.push("/para?tab=projects");
    },
    onError: (error: Error) => {
      console.error("프로젝트 삭제 실패:", error);
      toast({
        title: "삭제 실패",
        description: "프로젝트 삭제에 실패했습니다.",
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
      return addTaskToProject(projectId, newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      toast({
        title: "태스크 추가 완료",
        description: "새 태스크가 성공적으로 추가되었습니다.",
      });
      setShowTaskDialog(false);
      taskForm.reset();
    },
    onError: (error) => {
      toast({
        title: "태스크 추가 실패",
        description: "태스크 추가 중 오류가 발생했습니다.",
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
      return updateTaskInProject(taskId, taskData);
    },
    onSuccess: () => {
      // 성공 시 쿼리 무효화하여 최신 데이터 확보
      queryClient.invalidateQueries({
        queryKey: ["tasks", "project", projectId],
      });
      queryClient.invalidateQueries({ queryKey: ["taskCounts", projectId] });
    },
    onError: (error) => {
      toast({
        title: "태스크 수정 실패",
        description: "태스크 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 태스크 삭제 mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      return deleteTaskFromProject(taskId);
    },
    onMutate: async (taskId) => {
      // 진행 중인 쿼리 취소
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });

      // 이전 데이터 백업
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);

      // Optimistic update - 태스크 제거
      queryClient.setQueryData(["tasks", projectId], (old: any) => {
        if (!old) return old;
        return old.filter((task: any) => task.id !== taskId);
      });

      return { previousTasks };
    },
    onError: (error, taskId, context) => {
      // 오류 시 이전 데이터로 복원
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks", projectId], context.previousTasks);
      }
      toast({
        title: "태스크 삭제 실패",
        description: "태스크 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "태스크 삭제 완료",
        description: "태스크가 성공적으로 삭제되었습니다.",
      });
    },
    onSettled: () => {
      // 성공/실패와 관계없이 쿼리 무효화하여 최신 데이터 확보
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  // 모든 useState들을 useQuery 전에 호출
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false); // 회고 모달 상태
  const [noteContent, setNoteContent] = useState("");
  const [goalAchieved, setGoalAchieved] = useState("");
  const [memorableTask, setMemorableTask] = useState("");
  const [stuckPoints, setStuckPoints] = useState("");
  const [newLearnings, setNewLearnings] = useState("");
  const [nextProjectImprovements, setNextProjectImprovements] = useState("");
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [bookmarked, setBookmarked] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);

  // 스마트 회고 상태
  const [planningNeedsImprovement, setPlanningNeedsImprovement] =
    useState(false);
  const [executionNeedsImprovement, setExecutionNeedsImprovement] =
    useState(false);
  const [otherReason, setOtherReason] = useState("");

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

  // 태스크 개수만 가져오기 (성능 최적화용) - 우선 로드
  const { data: taskCounts, isLoading: isTaskCountsLoading } = useQuery({
    queryKey: ["taskCounts", projectId],
    queryFn: () => getTaskCountsByProjectId(projectId),
    enabled: !!projectId,
  });

  console.log("🔍 TaskCounts Query Status:", {
    projectId,
    isTaskCountsLoading,
    taskCounts,
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

  // 회고 모달 상태 변경 시 데이터 로드/초기화
  useEffect(() => {
    if (showRetrospectiveDialog && project?.retrospective) {
      // 기존 회고 데이터가 있으면 폼에 로드
      setGoalAchieved(project.retrospective.goalAchieved || "");
      setMemorableTask(project.retrospective.memorableTask || "");
      setStuckPoints(project.retrospective.stuckPoints || "");
      setNewLearnings(project.retrospective.newLearnings || "");
      setNextProjectImprovements(
        project.retrospective.nextProjectImprovements || ""
      );
      setUserRating(project.retrospective.userRating);
      setBookmarked(project.retrospective.bookmarked || false);

      // 스마트 회고 데이터 로드
      if (project.retrospective.incompleteAnalysis) {
        setPlanningNeedsImprovement(
          project.retrospective.incompleteAnalysis.planningNeedsImprovement ||
            false
        );
        setExecutionNeedsImprovement(
          project.retrospective.incompleteAnalysis.executionNeedsImprovement ||
            false
        );
        setOtherReason(
          project.retrospective.incompleteAnalysis.otherReason || ""
        );
      }
    } else if (!showRetrospectiveDialog) {
      // 모달이 닫힐 때 폼 초기화
      setGoalAchieved("");
      setMemorableTask("");
      setStuckPoints("");
      setNewLearnings("");
      setNextProjectImprovements("");
      setUserRating(undefined);
      setBookmarked(false);
      setHoverRating(undefined);

      // 스마트 회고 상태 초기화
      setPlanningNeedsImprovement(false);
      setExecutionNeedsImprovement(false);
      setOtherReason("");
    }
  }, [showRetrospectiveDialog, project?.retrospective]);

  // 노트 모달 상태 변경 시 데이터 로드/초기화
  useEffect(() => {
    if (showAddNoteDialog && project?.notes && project.notes.length > 0) {
      // 기존 노트가 있으면 폼에 로드
      setNoteContent(project.notes[0].content || "");
    } else if (!showAddNoteDialog) {
      // 모달이 닫힐 때 폼 초기화
      setNoteContent("");
    }
  }, [showAddNoteDialog, project?.notes]);

  // useEffect를 조건부 return 이전으로 이동
  useEffect(() => {
    // 기존 회고 데이터가 있다면 불러와서 폼에 채우기
    if (project && project.retrospective) {
      setGoalAchieved(project.retrospective.goalAchieved || "");
      setMemorableTask(project.retrospective.memorableTask || "");
      setStuckPoints(project.retrospective.stuckPoints || "");
      setNewLearnings(project.retrospective.newLearnings || "");
      setNextProjectImprovements(
        project.retrospective.nextProjectImprovements || ""
      );
      setUserRating(project.retrospective.userRating);
      setBookmarked(project.retrospective.bookmarked || false);
    } else {
      // 회고가 없으면 폼 초기화
      setGoalAchieved("");
      setMemorableTask("");
      setStuckPoints("");
      setNewLearnings("");
      setNextProjectImprovements("");
      setUserRating(undefined);
      setBookmarked(false);
    }

    // 기존 노트 데이터가 있다면 불러와서 폼에 채우기
    if (project?.notes && project.notes.length > 0) {
      setNoteContent(project.notes[0].content || "");
    } else {
      setNoteContent("");
    }
  }, [project]);

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
    taskCounts?.completedTasks ??
    tasks?.filter((task: any) => task.done).length ??
    0;
  const totalTasks = taskCounts?.totalTasks ?? tasks?.length ?? 0;

  // 반복형 프로젝트의 경우 목표 횟수가 없으면 완료된 태스크 수를 목표로 설정
  const targetCount =
    project?.target ||
    (project?.category === "repetitive" ? completedTasks : 0);

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 디버깅용 로그
  console.log("🔍 Project Detail - Task Counts:", {
    projectId,
    taskCounts,
    completedTasks,
    totalTasks,
    progressPercentage,
    tasksLength: tasks?.length,
    projectTarget: project?.target,
    projectCategory: project?.category,
    projectData: project,
  });

  // 추가 디버깅 로그
  console.log("🔍 Project Display Values:", {
    projectTitle: project?.title,
    projectTarget: project?.target,
    projectCategory: project?.category,
    completedTasks,
    totalTasks,
    calculatedRemaining:
      project?.category === "repetitive"
        ? Math.max(0, (project?.target || 0) - (completedTasks || 0))
        : (totalTasks || 0) - (completedTasks || 0),
  });

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
    setShowTaskDialog(true);
  };

  // 태스크 완료 상태 토글 핸들러
  const toggleTaskCompletion = (taskId: string, currentStatus: boolean) => {
    updateTaskMutation.mutate({
      taskId,
      taskData: { done: !currentStatus },
    });
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

    updateTaskMutation.mutate(
      {
        taskId,
        taskData: { done: !currentStatus },
      },
      {
        onSuccess: () => {
          // 성공 시 쿼리 무효화하여 최신 데이터 확보
          queryClient.invalidateQueries({
            queryKey: ["tasks", "project", projectId],
          });
          queryClient.invalidateQueries({
            queryKey: ["taskCounts", projectId],
          });
        },
        onError: (error, variables, context) => {
          // 오류 시 이전 데이터로 복원
          queryClient.invalidateQueries({
            queryKey: ["tasks", "project", projectId],
          });
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

  const handleSaveRetrospective = () => {
    if (!userRating) {
      toast({
        title: "회고 저장 실패",
        description: "스스로에게 도움이 되었는지 별점을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    // TODO: 실제 DB 저장 로직 구현
    const newRetrospective: Retrospective = {
      id: project.retrospective?.id || `new-project-retro-${Date.now()}`,
      projectId: project.id,
      userId: user?.uid || "",
      createdAt: project.retrospective?.createdAt || new Date(),
      updatedAt: new Date(),
      title: project.title,
      summary:
        goalAchieved.substring(0, 100) +
        (goalAchieved.length > 100 ? "..." : ""),
      goalAchieved,
      memorableTask,
      stuckPoints,
      newLearnings,
      nextProjectImprovements,
      content: `목표 달성: ${goalAchieved}\n\n기억에 남는 작업: ${memorableTask}\n\n막힌 부분: ${stuckPoints}\n\n새로운 배움: ${newLearnings}\n\n다음 프로젝트 개선점: ${nextProjectImprovements}`,
      userRating,
      bookmarked,
      // 스마트 회고 데이터 (완료율 90% 미만 시에만 포함)
      ...(shouldShowSmartRetrospective && {
        incompleteAnalysis: {
          planningNeedsImprovement,
          executionNeedsImprovement,
          otherReason: otherReason.trim() || undefined,
        },
      }),
    };

    console.log("프로젝트 회고 저장:", newRetrospective);
    toast({
      title: "프로젝트 회고 저장 완료",
      description: "프로젝트 회고가 성공적으로 저장되었습니다.",
    });
    setShowRetrospectiveDialog(false); // 저장 후 모달 닫기
  };

  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "노트 저장 실패",
        description: "노트 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    // TODO: 노트 추가/수정 로직 구현
    toast({
      title: "노트 저장 성공",
      description: "노트가 성공적으로 저장되었습니다.",
    });
    setNoteContent("");
    setShowAddNoteDialog(false);
  };

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
              star <= ((hoverRating ?? rating) || 0)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            } ${setRating ? "cursor-pointer hover:scale-110" : ""}`}
            onClick={() => {
              if (setRating) {
                console.log(`별점 클릭: ${star}점`);
                setRating(star);
              }
            }}
            onMouseEnter={() => setRating && setHoverRating(star)}
            onMouseLeave={() => setRating && setHoverRating(undefined)}
          />
        ))}
        {rating && (
          <span className="ml-2 text-sm text-gray-600">{rating}점</span>
        )}
      </div>
    );
  };

  const getLoopTitle = (loopId: string) => {
    // TODO: 실제 루프 데이터를 가져와서 사용
    return loopId;
  };

  const getLoopPeriod = (loopId: string) => {
    // TODO: 실제 루프 데이터를 가져와서 사용
    return "";
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/para/projects/edit/${projectId}`}>
              <Edit className="h-4 w-4" />
            </Link>
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
          <Badge variant="secondary">{project.area}</Badge>
        </div>

        <p className="text-muted-foreground mb-4">{project.description}</p>

        {/* 상태 및 진행률 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-sm font-medium">기간</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {formatDate(project.startDate)} ~ {formatDate(project.endDate)}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">진행 상태</span>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  projectWithStatus?.status === "planned"
                    ? "secondary"
                    : projectWithStatus?.status === "in_progress"
                    ? "default"
                    : "outline"
                }
              >
                {projectWithStatus?.status === "planned"
                  ? "예정"
                  : projectWithStatus?.status === "in_progress"
                  ? "진행 중"
                  : "완료됨"}
              </Badge>
              {projectWithStatus?.status === "in_progress" &&
                new Date(project.endDate) < new Date() && (
                  <Badge variant="destructive" className="text-xs">
                    기한 초과
                  </Badge>
                )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              목표 {project.category === "repetitive" ? "횟수" : "태스크 수"}
            </span>
            <span className="text-sm text-muted-foreground">
              {project.target || 0}
              {project.category === "repetitive" ? "회" : "개"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">진행률</span>
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

          {/* 연결된 루프 */}
          <div>
            <span className="text-sm font-medium">연결된 루프</span>
            <div className="mt-2 space-y-2">
              {project.connectedLoops && project.connectedLoops.length > 0 ? (
                project.connectedLoops.map((loop) => (
                  <div
                    key={loop.id}
                    className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <div className="flex flex-row justify-between flex-1 min-w-0">
                      <Link
                        href={`/loop/${loop.id}`}
                        className="flex items-center gap-2 group"
                      >
                        <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                          {loop.title}
                        </span>
                        <ExternalLink className="h-3 w-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <Card className="p-4 text-center">
                  <p className="text-muted-foreground">
                    아직 연결된 루프가 없습니다.
                  </p>
                </Card>
              )}
            </div>
          </div>
          {project.connectedLoops && project.connectedLoops.length > 0 && (
            <div className="space-y-3">
              {project.connectedLoops.length >= 3 &&
                projectWithStatus?.status === "in_progress" && (
                  <Alert variant="warning" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>장기 프로젝트 안내</AlertTitle>
                    <AlertDescription>
                      이 프로젝트는 {project.connectedLoops.length}개의 루프에
                      연결되어 있습니다. 정리하거나 회고를 작성해보는 건
                      어떨까요?
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          )}
        </div>
      </div>

      {/* 탭 영역 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="tasks">태스크</TabsTrigger>
          <TabsTrigger value="retrospective-notes">회고·노트</TabsTrigger>
        </TabsList>

        {/* 개요 탭 */}
        <TabsContent value="overview" className="mt-4">
          <div className="space-y-4">
            {/* 세부 진행 상황 */}
            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">진행 현황</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    완료된{" "}
                    {project.category === "repetitive" ? "횟수" : "태스크"}
                  </span>
                  <span className="font-medium">
                    {project.category === "repetitive"
                      ? completedTasks || 0
                      : completedTasks || 0}
                    {project.category === "repetitive" ? "회" : "개"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    남은 {project.category === "repetitive" ? "횟수" : "태스크"}
                  </span>
                  <span className="font-medium">
                    {project.category === "repetitive"
                      ? Math.max(0, targetCount - (completedTasks || 0))
                      : (totalTasks || 0) - (completedTasks || 0)}
                    {project.category === "repetitive" ? "회" : "개"}
                  </span>
                </div>
                <hr />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">완료된 시간</span>
                  <span className="font-medium">
                    {timeStats?.completedTime || 0}시간
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">남은 시간</span>
                  <span className="font-medium">
                    {timeStats?.remainingTime || 0}시간
                  </span>
                </div>
              </div>
            </Card>

            {/* 최근 활동 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">최근 활동</h3>
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
                          {formatDate(task.updatedAt)}
                        </span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    아직 활동이 없습니다.
                  </p>
                )}
              </div>
            </Card>

            {/* 프로젝트 정보 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">프로젝트 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">프로젝트 유형</span>
                  <span>
                    {project.category === "repetitive" ? "반복형" : "작업형"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    목표{" "}
                    {project.category === "repetitive" ? "횟수" : "태스크 수"}
                  </span>
                  <span>
                    {project.target || 0}
                    {project.category === "repetitive" ? "회" : "개"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">연결된 Area</span>
                  <span>{project.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">생성일</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수정일</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* 태스크 탭 */}
        <TabsContent value="tasks" className="mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">태스크 목록</h3>
              {project.category === "task_based" && (
                <Button size="sm" variant="outline" onClick={openTaskDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  추가
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
                ?.sort(
                  (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                )
                .map((task) => (
                  <Card
                    key={task.id}
                    className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      task.done ? "bg-green-50/50 dark:bg-green-900/20" : ""
                    } ${updatingTaskId === task.id ? "opacity-50" : ""}`}
                    onClick={() => handleTaskToggle(task.id, task.done)}
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
                        className="flex-shrink-0 hover:scale-110 transition-transform"
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
                          {task.done && (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200"
                            >
                              완료
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.date)}</span>
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
                            <Edit2 className="h-4 w-4" />
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

        {/* 회고·노트 탭  */}
        <TabsContent value="retrospective-notes" className="mt-4">
          <h2 className="mb-4 text-xl font-bold">프로젝트 회고</h2>
          {project.retrospective ? (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  {project.retrospective.title || "회고 작성 완료"}
                </h3>
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  {project.retrospective.bookmarked && (
                    <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  {renderStarRating(project.retrospective.userRating)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {project.retrospective.summary ||
                  project.retrospective.content ||
                  project.retrospective.goalAchieved ||
                  "작성된 회고 요약이 없습니다."}
              </p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/para/archives/${project.retrospective.id}`}>
                    회고 상세 보기
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 text-center mb-6">
              <h3 className="font-medium mb-4">
                {projectWithStatus?.status === "completed"
                  ? "이 프로젝트를 회고하고, 다음 단계를 계획하세요."
                  : "프로젝트가 완료되면 회고를 작성할 수 있습니다."}
              </h3>
              {projectWithStatus?.status === "completed" ? (
                <Button onClick={() => setShowRetrospectiveDialog(true)}>
                  회고 작성
                </Button>
              ) : (
                <div className="text-sm text-muted-foreground">
                  진행률: {progressPercentage}%
                </div>
              )}
            </Card>
          )}

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">노트</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddNoteDialog(true)}
              >
                {project.notes && project.notes.length > 0 ? (
                  <>
                    <Edit className="mr-1 h-4 w-4" />
                    노트 수정
                  </>
                ) : (
                  <>
                    <Plus className="mr-1 h-4 w-4" />
                    노트 작성
                  </>
                )}
              </Button>
            </div>

            {project.notes && project.notes.length > 0 ? (
              <Card className="p-4">
                <p className="text-sm mb-2">{project.notes[0].content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(project.notes[0].createdAt)}</span>
                </div>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  작성된 노트가 없습니다.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  프로젝트 진행 과정을 기록해보세요.
                </p>
                <Button onClick={() => setShowAddNoteDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  노트 작성하기
                </Button>
              </div>
            )}
          </section>
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
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              프로젝트 노트{" "}
              {project.notes && project.notes.length > 0 ? "수정" : "작성"}
            </DialogTitle>
            <DialogDescription>
              프로젝트 진행 중 느낀 점이나 배운 점을 자유롭게 기록하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="프로젝트 노트를 작성해보세요..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAddNoteDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveNote}>저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 프로젝트 회고 작성 다이얼로그 */}
      <Dialog
        open={showRetrospectiveDialog}
        onOpenChange={setShowRetrospectiveDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>프로젝트 회고 작성</DialogTitle>
            <DialogDescription>
              이 프로젝트를 돌아보고 다음 프로젝트에 적용할 점을 정리하세요.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div>
                <label
                  htmlFor="goalAchieved"
                  className="block text-sm font-medium text-gray-700"
                >
                  목표 달성 정도는?
                </label>
                <Textarea
                  id="goalAchieved"
                  className="mt-1"
                  rows={2}
                  value={goalAchieved}
                  onChange={(e) => setGoalAchieved(e.target.value)}
                  placeholder="예: 목표의 90%를 달성했습니다. 운동 습관화라는 목표를 성공적으로 이루었습니다."
                />
              </div>
              <div>
                <label
                  htmlFor="memorableTask"
                  className="block text-sm font-medium text-gray-700"
                >
                  가장 기억에 남는 작업은?
                </label>
                <Textarea
                  id="memorableTask"
                  className="mt-1"
                  rows={2}
                  value={memorableTask}
                  onChange={(e) => setMemorableTask(e.target.value)}
                  placeholder="예: 매일 아침 일찍 일어나 운동을 시작하는 것이 가장 기억에 남습니다."
                />
              </div>
              <div>
                <label
                  htmlFor="stuckPoints"
                  className="block text-sm font-medium text-gray-700"
                >
                  어떤 부분에서 막혔나요?
                </label>
                <Textarea
                  id="stuckPoints"
                  className="mt-1"
                  rows={2}
                  value={stuckPoints}
                  onChange={(e) => setStuckPoints(e.target.value)}
                  placeholder="예: 주말에 늦잠을 자서 운동을 거르는 경우가 있었습니다."
                />
              </div>
              <div>
                <label
                  htmlFor="newLearnings"
                  className="block text-sm font-medium text-gray-700"
                >
                  새롭게 배운 점은?
                </label>
                <Textarea
                  id="newLearnings"
                  className="mt-1"
                  rows={2}
                  value={newLearnings}
                  onChange={(e) => setNewLearnings(e.target.value)}
                  placeholder="예: 작은 습관이라도 꾸준히 하는 것이 중요하다는 것을 깨달았습니다."
                />
              </div>
              <div>
                <label
                  htmlFor="nextProjectImprovements"
                  className="block text-sm font-medium text-gray-700"
                >
                  다음 프로젝트에 적용할 점은?
                </label>
                <Textarea
                  id="nextProjectImprovements"
                  className="mt-1"
                  rows={2}
                  value={nextProjectImprovements}
                  onChange={(e) => setNextProjectImprovements(e.target.value)}
                  placeholder="예: 다음 프로젝트에서는 주말에도 루틴을 유지할 수 있는 방법을 찾아야겠습니다."
                />
              </div>

              {/* 스마트 회고 섹션 (완료율 90% 미만 시 표시) */}
              {shouldShowSmartRetrospective && (
                <div className="border-t pt-4 mt-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      계획한 태스크를 다 끝내지 못했는데
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      다음 중 어떤 부분에 개선이 필요한지 선택해주세요
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <Checkbox
                        id="planningNeedsImprovement"
                        checked={planningNeedsImprovement}
                        onCheckedChange={(checked) =>
                          setPlanningNeedsImprovement(checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="planningNeedsImprovement"
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                        >
                          계획에 개선이 필요한지
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          목표 설정이나 일정 계획이 현실적이지 않았을 수
                          있습니다
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                      <Checkbox
                        id="executionNeedsImprovement"
                        checked={executionNeedsImprovement}
                        onCheckedChange={(checked) =>
                          setExecutionNeedsImprovement(checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <label
                          htmlFor="executionNeedsImprovement"
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                        >
                          실행 방식에 개선이 필요한지
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          실제 실행 과정에서 효율성이나 지속성이 부족했을 수
                          있습니다
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        기타 이유
                      </label>
                      <Textarea
                        className="mt-1"
                        rows={2}
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        placeholder="다른 이유가 있다면 자유롭게 작성해주세요"
                      />
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  이 프로젝트는 나에게 도움이 되었나요?
                </label>
                {renderStarRating(userRating, setUserRating)}
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <Checkbox
                  id="bookmarked"
                  checked={bookmarked}
                  onCheckedChange={(checked) => {
                    console.log(`북마크 상태 변경: ${checked}`);
                    setBookmarked(checked as boolean);
                  }}
                />
                <div className="flex-1">
                  <label
                    htmlFor="bookmarked"
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    다시 읽고 싶은 회고로 표시
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    중요한 회고는 북마크하여 나중에 쉽게 찾을 수 있습니다
                  </p>
                </div>
                {bookmarked && (
                  <div className="text-yellow-500">
                    <Bookmark className="h-5 w-5 fill-current" />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowRetrospectiveDialog(false)}
            >
              취소
            </Button>
            <Button onClick={handleSaveRetrospective}>회고 저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                프로젝트 기간: {formatDate(project.startDate)} ~{" "}
                {formatDate(project.endDate)}
              </p>
              {taskForm.formState.errors.date && (
                <p className="text-sm text-red-500 mt-1">
                  {taskForm.formState.errors.date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="task-duration">소요 시간 (시간)</Label>
              <Input
                id="task-duration"
                type="number"
                min="1"
                max="24"
                placeholder="1"
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
                취소
              </Button>
              <Button type="submit" disabled={addTaskMutation.isPending}>
                {addTaskMutation.isPending ? "추가 중..." : "태스크 추가"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 태스크 수정 모달 */}
      <Dialog open={showEditTaskDialog} onOpenChange={setShowEditTaskDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>태스크 수정</DialogTitle>
            <DialogDescription>태스크 정보를 수정하세요.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={editTaskForm.handleSubmit(onEditTaskSubmit)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="edit-task-title">태스크 제목</Label>
              <Input
                id="edit-task-title"
                placeholder="태스크 제목을 입력하세요"
                {...editTaskForm.register("title")}
              />
              {editTaskForm.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {editTaskForm.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-task-date">날짜</Label>
              <Input
                id="edit-task-date"
                type="date"
                min={formatDateForInput(project.startDate)}
                max={formatDateForInput(project.endDate)}
                {...editTaskForm.register("date")}
              />
              <p className="text-xs text-muted-foreground mt-1">
                프로젝트 기간: {formatDate(project.startDate)} ~{" "}
                {formatDate(project.endDate)}
              </p>
              {editTaskForm.formState.errors.date && (
                <p className="text-sm text-red-500 mt-1">
                  {editTaskForm.formState.errors.date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-task-duration">소요 시간 (시간)</Label>
              <Input
                id="edit-task-duration"
                type="number"
                min="1"
                max="24"
                placeholder="1"
                {...editTaskForm.register("duration", { valueAsNumber: true })}
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
                {updateTaskMutation.isPending ? "수정 중..." : "태스크 수정"}
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
}
