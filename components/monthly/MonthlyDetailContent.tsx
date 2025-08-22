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
  Bookmark,
  Compass,
  Heart,
  Brain,
  Briefcase,
  DollarSign,
  Users,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Utensils,
  CheckCircle2,
  Circle,
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
  getCompletedTasksByMonthlyPeriod,
  fetchSingleArchive,
  createUnifiedArchive,
  updateUnifiedArchive,
} from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";
import { RetrospectiveContent } from "@/components/monthly/RetrospectiveContent";

import { RatingDisplay } from "@/components/ui/rating-display";

// 아이콘 컴포넌트 가져오기 함수
const getIconComponent = (iconId: string) => {
  const iconMap: Record<string, any> = {
    compass: Compass,
    heart: Heart,
    brain: Brain,
    briefcase: Briefcase,
    dollarSign: DollarSign,
    users: Users,
    gamepad2: Gamepad2,
    dumbbell: Dumbbell,
    bookOpen: BookOpen,
    home: Home,
    car: Car,
    plane: Plane,
    camera: Camera,
    music: Music,
    palette: Palette,
    utensils: Utensils,
  };
  return iconMap[iconId] || Compass;
};

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

  // Collapse 상태 관리 - 기본적으로 모든 프로젝트를 접힌 상태로 설정
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(
    new Set()
  );

  // 사용자 정보
  const [user] = useAuthState(auth);

  // 완료된 태스크 조회 (느슨한 관계 지원) - 탭이 활성화될 때만 가져오기
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
    enabled: !!user?.uid && !!monthly.id && activeTab === "completed-tasks",
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
  });

  // 먼슬리 관련 아카이브 조회 (회고와 노트 각각 하나씩만) - 탭이 활성화될 때만 가져오기
  const { data: monthlyRetrospective, isLoading: retrospectiveLoading } =
    useQuery({
      queryKey: ["monthly-retrospective", monthly.id],
      queryFn: async () => {
        console.log("🔍 회고 조회 중:", {
          userId: user?.uid,
          monthlyId: monthly.id,
        });
        const result = await fetchSingleArchive(
          user?.uid || "",
          monthly.id,
          "monthly_retrospective"
        );
        console.log("📋 회고 조회 결과:", result);
        return result;
      },
      enabled: !!user?.uid && !!monthly.id && activeTab === "retrospective",
      staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
      gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    });

  const { data: monthlyNote, isLoading: noteLoading } = useQuery({
    queryKey: ["monthly-note", monthly.id],
    queryFn: async () => {
      console.log("🔍 노트 조회 중:", {
        userId: user?.uid,
        monthlyId: monthly.id,
      });
      const result = await fetchSingleArchive(
        user?.uid || "",
        monthly.id,
        "monthly_note"
      );
      console.log("📋 노트 조회 결과:", result);
      return result;
    },
    enabled: !!user?.uid && !!monthly.id && activeTab === "notes",
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
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

  // 회고/노트 수정 가능 여부: 진행중이거나 완료된 먼슬리에서만 가능
  const canEditRetrospectiveAndNote =
    status === "in_progress" || status === "ended";

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
    onMutate: async ({ keyResultIndex, isCompleted }) => {
      // 낙관적 업데이트: 서버 응답을 기다리지 않고 즉시 UI 업데이트
      await queryClient.cancelQueries({ queryKey: ["monthly", monthly.id] });

      const previousMonthly = queryClient.getQueryData(["monthly", monthly.id]);

      queryClient.setQueryData(["monthly", monthly.id], (old: any) => {
        if (!old) return old;
        const updatedKeyResults = [...old.keyResults];
        updatedKeyResults[keyResultIndex] = {
          ...updatedKeyResults[keyResultIndex],
          isCompleted,
        };
        return { ...old, keyResults: updatedKeyResults };
      });

      return { previousMonthly };
    },
    onError: (error, variables, context) => {
      // 에러 발생 시 이전 상태로 롤백
      if (context?.previousMonthly) {
        queryClient.setQueryData(
          ["monthly", monthly.id],
          context.previousMonthly
        );
      }
      console.error("Key Result 업데이트 실패:", error);
      toast({
        title: translate("monthlyDetail.keyResultUpdate.error.title"),
        description: translate(
          "monthlyDetail.keyResultUpdate.error.description"
        ),
        variant: "destructive",
      });
    },
    onSettled: () => {
      // 성공/실패 관계없이 쿼리 무효화하여 서버와 동기화
      queryClient.invalidateQueries({ queryKey: ["monthly", monthly.id] });
      queryClient.invalidateQueries({ queryKey: ["monthlies"] });
    },
  });

  // 먼슬리 삭제 뮤테이션
  const deleteMutation = useMutation({
    mutationFn: () => deleteMonthlyById(monthly.id),
    onSuccess: () => {
      toast({
        title: translate("monthlyDetail.delete.success.title"),
        description: translate("monthlyDetail.delete.success.description"),
      });
      if (onDelete) {
        onDelete();
      }
    },
    onError: (error) => {
      console.error("먼슬리 삭제 실패:", error);
      toast({
        title: translate("monthlyDetail.delete.error.title"),
        description: translate("monthlyDetail.delete.error.description"),
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

  // undefined 값을 정리하고 failedKeyResults 데이터를 최적화하는 함수
  const cleanFailedKeyResults = (failedKeyResults: any[]): any[] => {
    if (!Array.isArray(failedKeyResults)) return [];

    return failedKeyResults.map((item) => {
      const cleaned: any = {
        keyResultId: item.keyResultId,
        keyResultTitle: item.keyResultTitle,
        reason: item.reason,
      };

      // reason이 'other'이고 customReason이 비어있는 경우 reason을 'other'로 유지
      if (item.reason === "other") {
        if (item.customReason && item.customReason.trim()) {
          cleaned.customReason = item.customReason.trim();
        }
        // customReason이 비어있어도 reason: 'other'는 유지
      }

      return cleaned;
    });
  };

  // undefined 값을 null로 변환하는 함수 (다른 필드용)
  const cleanUndefinedValues = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefinedValues);
    }
    if (typeof obj === "object") {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  const handleRetrospectiveSave = async (data: any) => {
    try {
      console.log("회고 저장 시작:", {
        data,
        userId: user?.uid,
        monthlyId: monthly.id,
      });

      // 먼슬리 회고 저장 로직
      const retrospectiveData = {
        userId: user?.uid || "",
        monthlyId: monthly.id,
        ...data,
      };

      // 기존 회고가 있는지 확인
      const existingArchive = await fetchSingleArchive(
        user?.uid || "",
        monthly.id,
        "monthly_retrospective"
      );

      if (existingArchive) {
        // 기존 아카이브 업데이트
        await updateUnifiedArchive(existingArchive.id, {
          title: monthly.objective || "",
          content: data.freeformContent || "",
          userRating: data.userRating,
          bookmarked: data.bookmarked,
          bestMoment: data.bestMoment,
          keyResultsReview: data.keyResultsReview,
          completedKeyResults: data.completedKeyResults,
          failedKeyResults: cleanFailedKeyResults(data.failedKeyResults),
          unexpectedObstacles: data.unexpectedObstacles,
          nextMonthlyApplication: data.nextMonthlyApplication,
        });
      } else {
        // 새 아카이브 생성

        const archiveData = {
          userId: user?.uid || "",
          type: "monthly_retrospective" as const,
          parentId: monthly.id,
          title: monthly.objective || "",
          content: data.freeformContent || "",
          userRating: data.userRating,
          bookmarked: data.bookmarked,
          bestMoment: data.bestMoment,
          keyResultsReview: data.keyResultsReview,
          completedKeyResults: data.completedKeyResults,
          failedKeyResults: cleanFailedKeyResults(data.failedKeyResults),
          unexpectedObstacles: data.unexpectedObstacles,
          nextMonthlyApplication: data.nextMonthlyApplication,
        };

        console.log("새 아카이브 생성 시도:", archiveData);
        await createUnifiedArchive(archiveData);
      }

      console.log("회고 데이터:", data);
      // 회고 저장 후 아카이브 데이터 새로고침
      queryClient.invalidateQueries({
        queryKey: ["monthly-retrospective", monthly.id],
      });
      toast({
        title: translate("monthlyDetail.retrospective.saveSuccess"),
        description: translate(
          "monthlyDetail.retrospective.saveSuccessDescription"
        ),
      });
    } catch (error) {
      console.error("회고 저장 실패:", error);
      toast({
        title: "회고 저장 실패",
        description: "회고 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const title = `${monthly.objective}`;

  // 과거 먼슬리인지 확인
  const isPastMonthly = status === "ended";

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-end">
          {showActions && (
            <div className="flex gap-2">
              {!isPastMonthly ? (
                <>
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
                </>
              ) : (
                monthly.retrospective && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/para/archives/${monthly.retrospective.id}`}>
                      <FolderOpen className="h-5 w-5" />
                    </Link>
                  </Button>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Monthly Info Card */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/15 border-primary/30 dark:from-primary/20 dark:to-primary/25 dark:border-primary/40">
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
      <Card className="p-3 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="space-y-3">
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
                <div className="grid grid-cols-3 gap-1.5">
                  {validAreas.map((area) => {
                    const IconComponent = getIconComponent(
                      area.icon || "compass"
                    );
                    return (
                      <div
                        key={area.id}
                        className="flex flex-col items-center justify-center rounded-lg border border-blue-200 dark:border-blue-700 p-2 bg-blue-50 dark:bg-blue-900/20"
                      >
                        <div
                          className="mb-1 rounded-full p-1"
                          style={{
                            backgroundColor: `${area.color}20`,
                          }}
                        >
                          <IconComponent
                            className="h-2.5 w-2.5"
                            style={{ color: area.color }}
                          />
                        </div>
                        <span className="text-xs text-center font-medium text-blue-700 dark:text-blue-300 leading-tight">
                          {area.name}
                        </span>
                      </div>
                    );
                  })}
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
                {translate("monthlyDetail.connectedProjects")}
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
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="key-results" className="min-w-0 flex-1">
            {translate("monthlyDetail.tabs.keyResults")}
          </TabsTrigger>
          <TabsTrigger value="completed-tasks" className="min-w-0 flex-1">
            {translate("monthlyDetail.tabs.completedTasks")}
          </TabsTrigger>
          <TabsTrigger value="retrospective" className="min-w-0 flex-1">
            {translate("monthlyDetail.tabs.retrospective")}
          </TabsTrigger>
          <TabsTrigger value="notes" className="min-w-0 flex-1">
            {translate("monthlyDetail.tabs.note")}
          </TabsTrigger>
        </TabsList>

        {/* Key Results 탭 */}
        <TabsContent value="key-results" className="mt-0">
          <div className="space-y-3">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleKeyResultCompletion(index);
                        }}
                        className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                      >
                        {keyResult.isCompleted ? (
                          <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground hover:text-green-600 hover:fill-green-100" />
                        )}
                      </button>
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
                              "monthlyDetail.keyResults.status.completed"
                            )
                          : status === "planned"
                          ? translate("monthlyDetail.keyResults.status.planned")
                          : translate(
                              "monthlyDetail.keyResults.status.inProgress"
                            )}
                      </Badge>
                      {/* 수정 버튼 - 기능 미구현으로 주석 처리 */}
                      {/* {!isPastMonthly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )} */}
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
                  {translate("monthlyDetail.keyResults.noKeyResults")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {translate(
                    "monthlyDetail.keyResults.noKeyResultsDescription"
                  )}
                </p>
                {!isPastMonthly && (
                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("monthlyDetail.keyResults.addKeyResult")}
                  </Button>
                )}
              </Card>
            )}

            {monthly.keyResults &&
              monthly.keyResults.length > 0 &&
              !isPastMonthly && (
                <Button variant="outline" className="w-full bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("monthlyDetail.keyResults.addKeyResult")}
                </Button>
              )}
          </div>
        </TabsContent>

        {/* 완료된 할 일 탭 */}
        <TabsContent value="completed-tasks" className="mt-0">
          <div className="space-y-3">
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
                  {translate("monthlyDetail.completedTasks.noTasks.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {translate(
                    "monthlyDetail.completedTasks.noTasks.description"
                  )}
                  <br />
                  {translate("monthlyDetail.completedTasks.noTasks.hint")}
                </p>

                <Button asChild className="w-full">
                  <Link href="/para/projects">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    {translate("monthlyDetail.viewProjects")}
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* 회고 탭 */}
        <TabsContent value="retrospective" className="mt-0">
          <div className="space-y-4">
            {retrospectiveLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">
                  회고 데이터를 불러오는 중...
                </p>
              </div>
            ) : status === "planned" ? (
              <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="mb-4">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {translate("monthlyDetail.retrospective.notStarted.title")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {translate(
                    "monthlyDetail.retrospective.notStarted.description"
                  )}
                </p>
              </Card>
            ) : (
              <>
                {/* 회고 목록 */}
                <div className="space-y-4">
                  <RetrospectiveContent
                    retrospective={monthlyRetrospective}
                    canEdit={false}
                    onEdit={() => setShowRetrospectiveModal(true)}
                    onWrite={() => setShowRetrospectiveModal(true)}
                    isPast={isPastMonthly}
                    type="monthly"
                  />

                  {/* 회고 수정 버튼 */}
                  {canEditRetrospectiveAndNote && monthlyRetrospective && (
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      onClick={() => setShowRetrospectiveModal(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {translate("monthlyDetail.retrospective.editTitle")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* 노트 탭 */}
        <TabsContent value="notes" className="mt-0">
          <div className="space-y-4">
            {monthlyNote ? (
              <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  <h3 className="font-bold">노트</h3>
                  <span className="text-xs text-muted-foreground">
                    마지막 업데이트:{" "}
                    {monthlyNote.updatedAt
                      ? formatDate(monthlyNote.updatedAt, "ko")
                      : "없음"}
                  </span>
                </div>
                <div className="p-4 bg-muted/40 dark:bg-muted/30 rounded-lg min-h-[120px]">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {monthlyNote.content}
                  </p>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
                <div className="mb-4">
                  <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {translate("monthlyDetail.note.noNote")}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {translate("monthlyDetail.note.noNoteDescription")}
                </p>
                {canEditRetrospectiveAndNote && (
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => setShowNoteForm(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("monthlyDetail.note.writeNote")}
                  </Button>
                )}
              </Card>
            )}

            {canEditRetrospectiveAndNote && monthlyNote && (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setShowNoteForm(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {translate("monthlyDetail.note.editNote")}
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
          title={translate("monthlyDetail.delete.title")}
          description={translate("monthlyDetail.delete.description")}
          onConfirm={() => {
            deleteMutation.mutate();
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
          confirmText={translate("monthlyDetail.delete.confirm")}
          cancelText={translate("monthlyDetail.delete.cancel")}
        />
      )}

      {/* 회고 작성 모달 */}
      {showRetrospectiveModal && canEditRetrospectiveAndNote && (
        <RetrospectiveForm
          type="monthly"
          title={monthly.objective}
          keyResults={monthly.keyResults || []}
          onClose={() => setShowRetrospectiveModal(false)}
          onSave={handleRetrospectiveSave}
        />
      )}

      {/* 노트 편집 모달 */}
      {showNoteForm && canEditRetrospectiveAndNote && (
        <NoteForm
          type="monthly"
          parent={monthly}
          onClose={() => setShowNoteForm(false)}
          onSave={() => {
            // 노트 저장 후 데이터 새로고침
            queryClient.invalidateQueries({
              queryKey: ["monthly-note", monthly.id],
            });
          }}
        />
      )}
    </div>
  );
}
