"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Clock,
  Trophy,
  MessageSquare,
  Target,
  FolderOpen,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Monthly, Project } from "@/lib/types";
import {
  updateMonthly,
  deleteMonthlyById,
  updateProjectConnectedMonthlies,
  getCompletedTasksByMonthlyPeriod,
} from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { MonthlyNoteForm } from "@/components/MonthlyNoteForm";
import { ProjectConnectionDialog } from "@/components/monthly/ProjectConnectionDialog";

interface MonthlyDetailContentProps {
  monthly: Monthly & { connectedProjects?: Project[] };
  allAreas?: any[];
  showHeader?: boolean;
  showActions?: boolean;
  onDelete?: () => void;
}

export function MonthlyDetailContent({
  monthly,
  allAreas = [],
  showHeader = true,
  showActions = true,
  onDelete,
}: MonthlyDetailContentProps) {
  const router = useRouter();
  const { translate, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("key-results");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showProjectConnectionDialog, setShowProjectConnectionDialog] =
    useState(false);

  // Collapse 상태 관리 - 기본적으로 모든 프로젝트를 접힌 상태로 설정
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(
    new Set()
  );

  // 사용자 정보
  const [user] = useAuthState(auth);

  // 완료된 태스크 조회 (느슨한 관계 지원)
  const { data: completedTasks, isLoading: completedTasksLoading } = useQuery({
    queryKey: [
      "completedTasks",
      monthly.id,
      monthly.startDate,
      monthly.endDate,
    ],
    queryFn: () =>
      getCompletedTasksByMonthlyPeriod(
        user?.uid || "",
        new Date(monthly.startDate),
        new Date(monthly.endDate)
      ),
    enabled: !!user?.uid && !!monthly.id,
  });

  // completed tasks가 로드되면 모든 프로젝트를 기본적으로 접힌 상태로 설정
  useEffect(() => {
    if (completedTasks && completedTasks.length > 0) {
      const projectIds = [
        ...new Set(completedTasks.map((task) => task.projectId)),
      ];
      setCollapsedProjects(new Set(projectIds));
    }
  }, [completedTasks]);

  // 통계 계산
  const status = getMonthlyStatus(monthly);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(monthly.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const daysUntilStart = Math.max(
    0,
    Math.ceil(
      (new Date(monthly.startDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const keyResultsCompleted =
    monthly.keyResults?.filter((kr) => kr.isCompleted).length || 0;
  const keyResultsTotal = monthly.keyResults?.length || 0;
  const keyResultProgress =
    keyResultsTotal > 0
      ? Math.round((keyResultsCompleted / keyResultsTotal) * 100)
      : 0;

  // Key Result 업데이트 뮤테이션
  const updateKeyResultMutation = useMutation({
    mutationFn: async ({
      keyResultIndex,
      isCompleted,
    }: {
      keyResultIndex: number;
      isCompleted: boolean;
    }) => {
      const updatedKeyResults = [...monthly.keyResults];
      updatedKeyResults[keyResultIndex] = {
        ...updatedKeyResults[keyResultIndex],
        isCompleted,
      };

      await updateMonthly(monthly.id, {
        keyResults: updatedKeyResults,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlies"] });
      toast({
        title: translate("monthly.detail.keyResult.update.success.title"),
        description: translate(
          "monthly.detail.keyResult.update.success.description"
        ),
      });
    },
    onError: (error) => {
      console.error("Key Result 업데이트 실패:", error);
      toast({
        title: translate("monthly.detail.keyResult.update.error.title"),
        description: translate(
          "monthly.detail.keyResult.update.error.description"
        ),
        variant: "destructive",
      });
    },
  });

  // 먼슬리 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => deleteMonthlyById(monthly.id),
    onSuccess: () => {
      toast({
        title: translate("monthly.detail.delete.success.title"),
        description: translate("monthly.detail.delete.success.description"),
      });
      if (onDelete) {
        onDelete();
      }
    },
    onError: (error) => {
      console.error("먼슬리 삭제 실패:", error);
      toast({
        title: translate("monthly.detail.delete.error.title"),
        description: translate("monthly.detail.delete.error.description"),
        variant: "destructive",
      });
    },
  });

  // 프로젝트 연결 업데이트 뮤테이션
  const updateProjectConnectionsMutation = useMutation({
    mutationFn: async (projectIds: string[]) => {
      // 기존 연결된 프로젝트들의 connectedMonthlies에서 현재 monthly 제거
      const existingProjectIds =
        monthly.connectedProjects?.map((p) => p.id) || [];
      const projectsToRemove = existingProjectIds.filter(
        (id) => !projectIds.includes(id)
      );

      for (const projectId of projectsToRemove) {
        await updateProjectConnectedMonthlies(projectId, monthly.id, false);
      }

      // 새로 연결할 프로젝트들의 connectedMonthlies에 현재 monthly 추가
      const projectsToAdd = projectIds.filter(
        (id) => !existingProjectIds.includes(id)
      );

      for (const projectId of projectsToAdd) {
        await updateProjectConnectedMonthlies(projectId, monthly.id, true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["monthly-projects", monthly.id],
      });
      queryClient.invalidateQueries({ queryKey: ["monthly", monthly.id] });
      toast({
        title: "프로젝트 연결 완료",
        description: "프로젝트 연결이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error) => {
      console.error("프로젝트 연결 업데이트 실패:", error);
      toast({
        title: "프로젝트 연결 실패",
        description: "프로젝트 연결 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const toggleKeyResultCompletion = (keyResultIndex: number) => {
    // 완료된 먼슬리에서는 토글 불가
    if (isPastMonthly) {
      return;
    }

    const keyResult = monthly.keyResults[keyResultIndex];
    updateKeyResultMutation.mutate({
      keyResultIndex,
      isCompleted: !keyResult.isCompleted,
    });
  };

  const handleRetrospectiveSave = (data: any) => {
    // TODO: 회고 데이터를 저장하는 로직 구현
    console.log("회고 데이터:", data);
    toast({
      title: "회고 저장 완료",
      description: "회고가 성공적으로 저장되었습니다.",
    });
  };

  const title = `${monthly.objective}`;

  // 과거 먼슬리인지 확인
  const isPastMonthly = status === "ended";

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="mb-6 flex items-center justify-end">
          {showActions && !isPastMonthly && (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/monthly/edit/${monthly.id}`}>
                  <Edit className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Monthly Info Card */}
      <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/15 border-primary/30 dark:from-primary/20 dark:to-primary/25 dark:border-primary/40">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="text-sm font-medium px-2 py-1 bg-background/80 dark:bg-background/60"
              >
                {monthly.startDate instanceof Date
                  ? monthly.startDate.getMonth() + 1
                  : (monthly.startDate as any).toDate().getMonth() + 1}
                월
              </Badge>
              <h1 className="text-xl font-bold">{title}</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(monthly.startDate, currentLanguage)} -{" "}
              {formatDate(monthly.endDate, currentLanguage)}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              className={
                status === "planned"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40"
                  : status === "ended"
                  ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/40"
                  : "bg-primary hover:bg-primary/90 text-white"
              }
            >
              {status === "planned"
                ? "예정"
                : status === "ended"
                ? "완료"
                : "진행중"}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {status === "planned"
                  ? `${daysUntilStart}일 후 시작`
                  : status === "ended"
                  ? "완료됨"
                  : `${daysLeft}일 남음`}
              </span>
            </div>
          </div>

          {/* Key Results 진행률 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Key Results 진행률</span>
              <span className="text-sm font-bold">{keyResultProgress}%</span>
            </div>
            <Progress value={keyResultProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {keyResultsCompleted}/{keyResultsTotal} 완료
            </p>
          </div>

          {/* 보상 */}
          {monthly.reward && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  목표 달성 보상
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {monthly.reward}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 중점 영역 및 연결된 프로젝트 */}
      <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="space-y-4">
          {/* 중점 영역 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium">중점 영역</span>
            </div>
            {(() => {
              const validAreas = monthly.focusAreas
                ? monthly.focusAreas
                    .map((areaId) => allAreas.find((a) => a.id === areaId))
                    .filter(Boolean)
                : [];

              return validAreas.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {validAreas.map((area) => (
                    <Badge
                      key={area.id}
                      variant="outline"
                      className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
                    >
                      {area.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground">
                    중점 영역이 없습니다
                  </p>
                </div>
              );
            })()}
          </div>

          {/* 연결된 프로젝트 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FolderOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium">
                {translate("monthly.detail.connectedProjects")}
              </span>
            </div>

            {monthly.connectedProjects &&
            monthly.connectedProjects.length > 0 ? (
              <div className="space-y-1">
                {monthly.connectedProjects.map((project) => (
                  <Link key={project.id} href={`/para/projects/${project.id}`}>
                    <div className="flex items-center gap-2 p-2 bg-muted/30 dark:bg-muted/20 rounded-md hover:bg-muted/50 dark:hover:bg-muted/40 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm flex-1">{project.title}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">
                  연결된 프로젝트가 없습니다
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="key-results" className="min-w-0 flex-1">
            {translate("monthly.detail.tabs.keyResults")}
          </TabsTrigger>
          <TabsTrigger value="completed-tasks" className="min-w-0 flex-1">
            {translate("monthly.detail.tabs.completedTasks")}
          </TabsTrigger>
          <TabsTrigger value="retrospective" className="min-w-0 flex-1">
            {translate("monthly.detail.tabs.retrospective")}
          </TabsTrigger>
          <TabsTrigger value="notes" className="min-w-0 flex-1">
            {translate("monthly.detail.tabs.note")}
          </TabsTrigger>
        </TabsList>

        {/* Key Results 탭 */}
        <TabsContent value="key-results" className="mt-0">
          <div className="space-y-4">
            {monthly.keyResults && monthly.keyResults.length > 0 ? (
              monthly.keyResults.map((keyResult, index) => (
                <Card
                  key={keyResult.id}
                  className={`p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40 ${
                    isPastMonthly ? "opacity-75" : ""
                  }`}
                >
                  <div
                    className={`flex items-center justify-between ${
                      isPastMonthly ? "" : "cursor-pointer"
                    }`}
                    onClick={() => toggleKeyResultCompletion(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full transition-colors flex-shrink-0 ${
                          keyResult.isCompleted
                            ? "bg-green-500"
                            : "border-2 border-gray-300 dark:border-gray-600"
                        }`}
                      ></div>
                      <div>
                        <h4
                          className={`font-medium ${
                            keyResult.isCompleted
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {keyResult.title}
                        </h4>
                        {keyResult.description && (
                          <p className="text-sm text-muted-foreground">
                            {keyResult.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          keyResult.isCompleted ? "default" : "secondary"
                        }
                        className={
                          keyResult.isCompleted
                            ? ""
                            : "bg-secondary/80 dark:bg-secondary/60"
                        }
                      >
                        {keyResult.isCompleted
                          ? translate(
                              "monthly.detail.keyResults.status.completed"
                            )
                          : status === "planned"
                          ? translate(
                              "monthly.detail.keyResults.status.planned"
                            )
                          : translate(
                              "monthly.detail.keyResults.status.inProgress"
                            )}
                      </Badge>
                      {!isPastMonthly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="mb-4">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-muted-foreground/30"></div>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {translate("monthly.detail.keyResults.noKeyResults")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {translate(
                    "monthly.detail.keyResults.noKeyResultsDescription"
                  )}
                </p>
                {!isPastMonthly && (
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("monthly.detail.keyResults.addKeyResult")}
                  </Button>
                )}
              </Card>
            )}

            {monthly.keyResults &&
              monthly.keyResults.length > 0 &&
              !isPastMonthly && (
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("monthly.detail.keyResults.addKeyResult")}
                </Button>
              )}
          </div>
        </TabsContent>

        {/* 완료된 할 일 탭 */}
        <TabsContent value="completed-tasks" className="mt-0">
          <div className="space-y-4">
            {completedTasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : completedTasks && completedTasks.length > 0 ? (
              <div className="space-y-4">
                {/* 프로젝트별로 그룹핑 */}
                {Object.entries(
                  completedTasks.reduce((acc, task) => {
                    if (!acc[task.projectId]) {
                      acc[task.projectId] = {
                        projectTitle: task.projectTitle,
                        areaName: task.areaName,
                        tasks: [],
                      };
                    }
                    acc[task.projectId].tasks.push(task);
                    return acc;
                  }, {} as Record<string, { projectTitle: string; areaName: string; tasks: any[] }>)
                ).map(([projectId, projectData]) => {
                  const isCollapsed = collapsedProjects.has(projectId);

                  return (
                    <Collapsible
                      key={projectId}
                      open={!isCollapsed}
                      onOpenChange={(open) => {
                        const newCollapsed = new Set(collapsedProjects);
                        if (open) {
                          newCollapsed.delete(projectId);
                        } else {
                          newCollapsed.add(projectId);
                        }
                        setCollapsedProjects(newCollapsed);
                      }}
                    >
                      <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between cursor-pointer hover:bg-background/50 rounded-lg p-2 -m-2 transition-colors">
                            <div className="flex items-center gap-2 flex-1">
                              {isCollapsed ? (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div className="flex-1">
                                <h4 className="font-medium">
                                  {projectData.projectTitle}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {projectData.areaName}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {projectData.tasks.length}개
                              </Badge>
                              <Link href={`/para/projects/${projectId}`}>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="space-y-2 mt-3 mb-0">
                            {projectData.tasks.map((task) => (
                              <div
                                key={task.taskId}
                                className="flex items-center justify-between p-2 bg-background/50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {task.taskTitle}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(task.date, currentLanguage)}
                                  </p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(
                                    task.completedAt,
                                    currentLanguage
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground text-center">
                              총 {projectData.tasks.length}개 태스크 완료
                            </p>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}

                <div className="text-center text-sm text-muted-foreground">
                  총 {completedTasks.length}개 태스크 완료
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="mb-4">
                  <div className="w-12 h-12 mx-auto rounded-full border-2 border-muted-foreground/30"></div>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {translate("monthly.detail.completedTasks.noTasks.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {translate(
                    "monthly.detail.completedTasks.noTasks.description"
                  )}
                  <br />
                  {translate("monthly.detail.completedTasks.noTasks.hint")}
                </p>

                <Button asChild className="w-full">
                  <Link href="/para/projects">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {translate("monthly.detail.viewProjects")}
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 회고 탭 */}
        <TabsContent value="retrospective" className="mt-0">
          <div className="space-y-4">
            {status === "planned" ? (
              <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="mb-4">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {translate("monthly.detail.retrospective.notStarted.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {translate(
                    "monthly.detail.retrospective.notStarted.description"
                  )}
                </p>
              </Card>
            ) : (
              <>
                {/* 회고 목록 */}
                <div className="space-y-4">
                  {/* 여기에 회고 목록이 표시됩니다 */}
                  <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                    <div className="mb-4">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      아직 작성된 회고가 없어요
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      이번 먼슬리에 대한 회고를 작성해보세요
                    </p>
                    {!isPastMonthly && (
                      <Button
                        variant="outline"
                        className="w-full bg-transparent"
                        onClick={() => setShowRetrospectiveModal(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        회고 작성하기
                      </Button>
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* 노트 탭 */}
        <TabsContent value="notes" className="mt-0">
          <div className="space-y-4">
            <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-bold">노트</h3>
                <span className="text-xs text-muted-foreground">
                  마지막 업데이트:{" "}
                  {monthly.updatedAt
                    ? formatDate(monthly.updatedAt, "ko")
                    : "없음"}
                </span>
              </div>
              <div className="p-4 bg-muted/40 dark:bg-muted/30 rounded-lg min-h-[120px]">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {typeof monthly.note === "string"
                    ? monthly.note
                    : "이번 먼슬리에 대한 메모를 작성해보세요"}
                </p>
              </div>
            </Card>

            {!isPastMonthly && (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowNoteForm(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                노트 편집하기
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 다이얼로그 */}
      {!isPastMonthly && (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={translate("monthly.detail.delete.title")}
          description={translate("monthly.detail.delete.description")}
          onConfirm={() => {
            deleteMutation.mutate();
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText={translate("monthly.detail.delete.confirm")}
          cancelText={translate("monthly.detail.delete.cancel")}
        />
      )}

      {/* 회고 작성 모달 */}
      {showRetrospectiveModal && !isPastMonthly && (
        <RetrospectiveForm
          monthlyTitle={monthly.objective}
          keyResults={monthly.keyResults || []}
          onClose={() => setShowRetrospectiveModal(false)}
          onSave={handleRetrospectiveSave}
        />
      )}

      {/* 노트 편집 모달 */}
      {showNoteForm && !isPastMonthly && (
        <MonthlyNoteForm
          monthly={monthly}
          onClose={() => setShowNoteForm(false)}
          onSave={() => {
            // 노트 저장 후 데이터 새로고침
            queryClient.invalidateQueries({
              queryKey: ["monthly", monthly.id],
            });
          }}
        />
      )}

      {/* 프로젝트 연결 다이얼로그 */}
      {!isPastMonthly && (
        <ProjectConnectionDialog
          open={showProjectConnectionDialog}
          onOpenChange={setShowProjectConnectionDialog}
          selectedProjects={
            monthly.connectedProjects?.map((project) => ({
              projectId: project.id,
              monthlyTargetCount: 1,
            })) || []
          }
          onProjectsChange={(projects) => {
            const projectIds = projects.map((p) => p.projectId);
            updateProjectConnectionsMutation.mutate(projectIds);
            setShowProjectConnectionDialog(false);
          }}
          monthlyStartDate={monthly.startDate}
          monthlyEndDate={monthly.endDate}
        />
      )}
    </div>
  );
}
