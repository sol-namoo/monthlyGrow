"use client";

import { useState, use, Suspense, lazy, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Edit, Trash2, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getProjectStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchProjectById,
  fetchAllTasksByProjectId,
  getTaskCountsByProjectId,
  getTaskTimeStatsByProjectId,
  fetchAreaById,
  fetchMonthliesByIds,
  updateProject,
} from "@/lib/firebase/index";
import {
  fetchSingleArchive,
  createUnifiedArchive,
  updateUnifiedArchive,
} from "@/lib/firebase/unified-archives";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";
// Lazy load tab components
const OverviewTab = lazy(() =>
  import("./components/OverviewTab").then((module) => ({
    default: module.OverviewTab,
  }))
);
const TasksTab = lazy(() =>
  import("./components/TasksTab").then((module) => ({
    default: module.TasksTab,
  }))
);
const RetrospectiveTab = lazy(() =>
  import("./components/RetrospectiveTab").then((module) => ({
    default: module.RetrospectiveTab,
  }))
);
const NoteTab = lazy(() =>
  import("./components/NoteTab").then((module) => ({ default: module.NoteTab }))
);

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
  const resolvedParams = use(params as unknown as Promise<{ id: string }>);
  const { id: projectId } = resolvedParams;
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showEditTaskDialog, setShowEditTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const queryClient = useQueryClient();

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

  // 태스크 개수만 가져오기
  const { data: taskCounts, isLoading: isTaskCountsLoading } = useQuery({
    queryKey: ["taskCounts", projectId],
    queryFn: () => getTaskCountsByProjectId(projectId),
    enabled: !!projectId,
  });

  // 시간 통계 가져오기
  const { data: timeStats, isLoading: isTimeStatsLoading } = useQuery({
    queryKey: ["timeStats", projectId],
    queryFn: () => getTaskTimeStatsByProjectId(projectId),
    enabled: !!projectId && activeTab === "overview",
  });

  // 프로젝트 회고 데이터 가져오기
  const { data: projectRetrospective } = useQuery({
    queryKey: ["projectRetrospective", projectId],
    queryFn: () =>
      fetchSingleArchive(user?.uid || "", projectId, "project_retrospective"),
    enabled: !!user?.uid && !!projectId,
  });

  // 프로젝트의 모든 tasks 가져오기
  const {
    data: tasks,
    isLoading: isTasksLoading,
    error: tasksError,
  } = useQuery({
    queryKey: ["tasks", "project", projectId],
    queryFn: () => fetchAllTasksByProjectId(projectId),
    enabled: !!projectId && activeTab === "tasks",
  });

  // 로딩 상태
  if (isLoading || isTasksLoading) {
    return <ProjectDetailSkeleton />;
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

  // 최적화된 태스크 개수 사용
  const completedTasks =
    (taskCounts?.completed ?? 0) ||
    (tasks?.filter((task: any) => task.done).length ?? 0);
  const totalTasks = (taskCounts?.total ?? 0) || (tasks?.length ?? 0);

  // 반복형 프로젝트의 경우 targetCount 사용, 작업형의 경우 tasks 개수 사용
  const targetCount =
    project?.targetCount ||
    (project?.category === "repetitive" ? completedTasks : totalTasks);

  // 진행률 계산
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

  return (
    <div className="container max-w-md px-4 py-6 pb-20 relative">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/para/projects/edit/${projectId}`)}
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

      {/* 프로젝트 기본 정보 */}
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
          <Suspense
            fallback={
              <div className="p-4">
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <OverviewTab
              project={project}
              tasks={tasks || []}
              timeStats={timeStats}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              area={area}
            />
          </Suspense>
        </TabsContent>

        {/* 태스크 탭 */}
        <TabsContent value="tasks" className="mt-4">
          <Suspense
            fallback={
              <div className="p-4">
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <TasksTab
              project={project}
              tasks={tasks || []}
              completedTasks={completedTasks}
              totalTasks={totalTasks}
              progressPercentage={progressPercentage}
              onAddTask={() => setShowTaskDialog(true)}
              onToggleTask={(taskId, currentStatus) => {
                // 태스크 토글 로직 - 나중에 구현
              }}
            />
          </Suspense>
        </TabsContent>

        {/* 회고 탭 */}
        <TabsContent value="retrospective" className="mt-0">
          <Suspense
            fallback={
              <div className="p-4">
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <RetrospectiveTab
              project={project}
              retrospective={projectRetrospective}
              onEditRetrospective={() => setShowRetrospectiveDialog(true)}
            />
          </Suspense>
        </TabsContent>

        {/* 노트 탭 */}
        <TabsContent value="note" className="mt-0">
          <Suspense
            fallback={
              <div className="p-4">
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <NoteTab
              project={project}
              onEditNote={() => setShowAddNoteDialog(true)}
            />
          </Suspense>
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

      {/* 노트 작성/수정 다이얼로그 */}
      {showAddNoteDialog && (
        <NoteForm
          type="project"
          parent={project}
          onClose={() => setShowAddNoteDialog(false)}
          onSave={() => {
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
          existingData={project?.retrospective}
          onClose={() => setShowRetrospectiveDialog(false)}
          onSave={async (data) => {
            try {
              if (projectRetrospective) {
                // 기존 회고가 있으면 업데이트
                await updateUnifiedArchive(projectRetrospective.id, {
                  bestMoment: data.bestMoment,
                  unexpectedObstacles: data.unexpectedObstacles,
                  nextProjectImprovements: data.nextMonthlyApplication,
                  userRating: data.userRating,
                  bookmarked: data.bookmarked,
                  content: data.freeformContent,
                });
              } else {
                // 새 회고 생성
                await createUnifiedArchive({
                  userId: user?.uid || "",
                  type: "project_retrospective",
                  parentId: projectId,
                  title: project?.title || "",
                  bestMoment: data.bestMoment,
                  unexpectedObstacles: data.unexpectedObstacles,
                  nextProjectImprovements: data.nextMonthlyApplication,
                  userRating: data.userRating,
                  bookmarked: data.bookmarked,
                  content: data.freeformContent,
                });
              }

              toast({
                title: "회고 저장 완료",
                description: "회고가 성공적으로 저장되었습니다.",
              });
              setShowRetrospectiveDialog(false);

              // 데이터 새로고침
              queryClient.invalidateQueries({
                queryKey: ["projectRetrospective", projectId],
              });
            } catch (error) {
              console.error("회고 저장 중 오류:", error);
              toast({
                title: "저장 실패",
                description: "회고 저장 중 오류가 발생했습니다.",
                variant: "destructive",
              });
            }
          }}
        />
      )}
    </div>
  );
}
