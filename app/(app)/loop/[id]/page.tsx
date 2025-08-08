"use client";

import { useState, useEffect, Suspense, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  Clock,
  Star,
  Plus,
  AlertCircle,
  Bookmark,
  Edit,
  Gift,
  Trash2,
  FileText,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLoopById,
  fetchAllTasksByProjectId,
  deleteLoopById,
  findIncompleteProjectsInLoop,
  moveProjectToLoop,
  fetchAllLoopsByUserId,
  fetchAllAreasByUserId,
  fetchProjectsByLoopId,
  getTaskCountsForMultipleProjects,
  createRetrospective,
  updateRetrospective,
  createNote,
  updateNote,
  updateLoop,
} from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { formatDate, getLoopStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";

// 로딩 스켈레톤 컴포넌트
function LoopDetailSkeleton() {
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

export function LoopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [user] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false);
  const [showProjectMigrationDialog, setShowProjectMigrationDialog] =
    useState(false);
  const [incompleteProjects, setIncompleteProjects] = useState<any[]>([]);
  const [selectedTargetLoop, setSelectedTargetLoop] = useState<string>("");
  const [noteContent, setNoteContent] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [routineAdherence, setRoutineAdherence] = useState("");
  const [unexpectedObstacles, setUnexpectedObstacles] = useState("");
  const [nextLoopApplication, setNextLoopApplication] = useState("");
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [bookmarked, setBookmarked] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);

  const queryClient = useQueryClient();

  // 미완료 프로젝트 확인 (직전 달 루프에서만)
  const checkIncompleteProjects = async () => {
    if (!loop) return;

    // 현재 달과 직전 달만 체크 (2달 전부터는 제외)
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const loopStartDate = new Date(loop.startDate);

    // 루프가 현재 달이나 직전 달이 아니면 모달을 열지 않음
    if (loopStartDate < lastMonth) {
      return;
    }

    try {
      const incomplete = await findIncompleteProjectsInLoop(loop.id);
      if (incomplete.length > 0) {
        setIncompleteProjects(incomplete);
        setShowProjectMigrationDialog(true);
      }
    } catch (error) {
      console.error("미완료 프로젝트 확인 중 오류:", error);
    }
  };

  // 프로젝트 이동 처리
  const handleProjectMigration = async () => {
    if (!selectedTargetLoop || incompleteProjects.length === 0) return;

    try {
      // 모든 미완료 프로젝트를 선택된 루프로 이동
      for (const project of incompleteProjects) {
        await moveProjectToLoop(project.id, loop?.id || "", selectedTargetLoop);
      }

      toast({
        title: translate("loopDetail.projectMigration.success.title"),
        description: translate(
          "loopDetail.projectMigration.success.description"
        ).replace("{count}", incompleteProjects.length.toString()),
      });

      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["loops"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });

      setShowProjectMigrationDialog(false);
      setIncompleteProjects([]);
      setSelectedTargetLoop("");
    } catch (error) {
      console.error("프로젝트 이동 중 오류:", error);
      toast({
        title: translate("loopDetail.projectMigration.error.title"),
        description: translate("loopDetail.projectMigration.error.description"),
        variant: "destructive",
      });
    }
  };

  // 루프 삭제 mutation
  const deleteLoopMutation = useMutation({
    mutationFn: () => deleteLoopById(id),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["loops"] });
      toast({
        title: translate("loopDetail.delete.success.title"),
        description: translate("loopDetail.delete.success.description"),
      });
      router.push("/loop");
    },
    onError: (error: Error) => {
      console.error("루프 삭제 실패:", error);
      toast({
        title: translate("loopDetail.delete.error.title"),
        description: translate("loopDetail.delete.error.description"),
        variant: "destructive",
      });
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
    mutationFn: async (retrospectiveData: Retrospective) => {
      // undefined 값들을 필터링
      const filteredData = filterUndefinedValues({
        bestMoment: retrospectiveData.bestMoment,
        routineAdherence: retrospectiveData.routineAdherence,
        unexpectedObstacles: retrospectiveData.unexpectedObstacles,
        nextLoopApplication: retrospectiveData.nextLoopApplication,
        userRating: retrospectiveData.userRating,
        bookmarked: retrospectiveData.bookmarked,
        title: retrospectiveData.title,
        summary: retrospectiveData.summary,
        content: retrospectiveData.content,
      });

      if (loop?.retrospective?.id) {
        // 기존 회고가 있으면 업데이트
        await updateRetrospective(loop.retrospective.id, filteredData);
      } else {
        // 새 회고 생성 (루프 회고용 필드만 포함)
        const newRetrospective = await createRetrospective({
          userId: user?.uid || "",
          loopId: loop?.id || "",
          ...filteredData,
          // projectId는 루프 회고에서는 사용하지 않으므로 제외
        });

        // 루프에 회고 연결 (필요한 필드만 포함)
        await updateLoop(loop?.id || "", {
          retrospective: {
            id: newRetrospective.id,
            userId: newRetrospective.userId,
            loopId: newRetrospective.loopId,
            createdAt: newRetrospective.createdAt,
            updatedAt: newRetrospective.updatedAt,
            ...filteredData,
          },
        });
      }
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["loop", id] });
      queryClient.invalidateQueries({ queryKey: ["loops"] });
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
      if (loop?.note?.id) {
        // 기존 노트가 있으면 업데이트
        await updateNote(loop.note.id, {
          content: noteContent,
        });
      } else {
        // 새 노트 생성
        const newNote = await createNote({
          userId: user?.uid || "",
          content: noteContent,
        });

        // 루프에 노트 연결
        await updateLoop(loop?.id || "", {
          note: newNote,
        });
      }
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["loop", id] });
      queryClient.invalidateQueries({ queryKey: ["loops"] });
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

  // Firestore에서 실제 루프 데이터 가져오기
  const {
    data: loop,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["loop", id],
    queryFn: () => fetchLoopById(id),
    enabled: !!id,
  });

  // 사용자의 모든 루프 가져오기 (프로젝트 이동용)
  const { data: allLoops = [] } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 사용자의 모든 Area 가져오기 (Area 링크용)
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 루프가 완료되었을 때 미완료 프로젝트 확인
  useEffect(() => {
    if (loop && getLoopStatus(loop) === "ended") {
      checkIncompleteProjects();
    }
  }, [loop]);

  // 실제 프로젝트 데이터 가져오기
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", "loop", id],
    queryFn: () => fetchProjectsByLoopId(id, user?.uid),
    enabled: !!id && !!user?.uid,
  });

  // 프로젝트별 태스크 개수 가져오기
  const { data: projectTaskCounts = {} } = useQuery({
    queryKey: ["projectTaskCounts", "loop", id],
    queryFn: () => getTaskCountsForMultipleProjects(projects.map((p) => p.id)),
    enabled: !!projects && projects.length > 0,
  });

  // 노트 데이터
  const note = loop?.note;

  // useEffect는 모든 조건부 return 이전에 위치해야 함
  useEffect(() => {
    // 회고 모달이 열릴 때만 기존 회고 데이터 로드
    if (showRetrospectiveDialog && loop?.retrospective) {
      setBestMoment(loop.retrospective.bestMoment || "");
      setRoutineAdherence(loop.retrospective.routineAdherence || "");
      setUnexpectedObstacles(loop.retrospective.unexpectedObstacles || "");
      setNextLoopApplication(loop.retrospective.nextLoopApplication || "");
      setUserRating(loop.retrospective.userRating);
      setBookmarked(loop.retrospective.bookmarked || false);
    } else if (!showRetrospectiveDialog) {
      // 회고 모달이 닫힐 때 폼 초기화
      setBestMoment("");
      setRoutineAdherence("");
      setUnexpectedObstacles("");
      setNextLoopApplication("");
      setUserRating(undefined);
      setBookmarked(false);
      setHoverRating(undefined);
    }
  }, [showRetrospectiveDialog, loop?.retrospective]);

  // 노트 모달 상태 변경 시 데이터 로드/초기화
  useEffect(() => {
    if (showAddNoteDialog && note) {
      setNoteContent(note.content || "");
    } else if (!showAddNoteDialog) {
      setNoteContent("");
    }
  }, [showAddNoteDialog, note]);

  // 로딩 상태
  if (isLoading) {
    return <LoopDetailSkeleton />;
  }

  // 에러 상태
  if (error) {
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
            루프를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!loop) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20 text-center">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-muted-foreground">루프를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 루프 상태 계산
  const loopStatus = getLoopStatus(loop);
  const isCompleted = loopStatus === "ended";

  // 진행률 계산 (실제 프로젝트 데이터 기반)
  const completionRate = (() => {
    if (projectsLoading || projects.length === 0) return 0;

    const totalTasks = Object.values(projectTaskCounts).reduce(
      (sum, counts) => sum + counts.totalTasks,
      0
    );
    const completedTasks = Object.values(projectTaskCounts).reduce(
      (sum, counts) => sum + counts.completedTasks,
      0
    );

    return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  })();

  // 프로젝트 추가 가능 여부 확인 (최대 5개)
  const canAddProject = projects.length < 5;

  // 프로젝트 추가 처리 함수
  const handleAddProject = () => {
    if (!canAddProject) {
      toast({
        title: "프로젝트 추가 실패",
        description: "한 루프에는 최대 5개의 프로젝트만 등록할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    setShowAddProjectDialog(true);
  };

  // 노트 추가/수정 처리 함수
  const handleSaveNote = () => {
    if (!noteContent.trim()) {
      toast({
        title: "노트 저장 실패",
        description: "노트 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    saveNoteMutation.mutate(noteContent);
  };

  // 날짜 포맷팅 함수
  const formatDisplayDate = (date: Date) => {
    return formatDate(date, currentLanguage);
  };

  const handleSaveRetrospective = () => {
    // 유효성 검사 (최소한 별점은 선택해야 함)
    if (!userRating) {
      toast({
        title: "회고 저장 실패",
        description: "스스로에게 도움이 되었는지 별점을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const newRetrospective: Retrospective = {
      id: loop?.retrospective?.id || `new-retro-${Date.now()}`,
      loopId: loop?.id || "",
      userId: user?.uid || "",
      createdAt: loop?.retrospective?.createdAt || new Date(),
      updatedAt: new Date(),
      title: loop?.title || "",
      summary:
        bestMoment.substring(0, 100) + (bestMoment.length > 100 ? "..." : ""),
      bestMoment,
      routineAdherence,
      unexpectedObstacles,
      nextLoopApplication,
      // content 필드는 노트에서만 사용하므로 회고에서는 제외
      userRating,
      bookmarked,
      // projectId는 루프 회고에서는 사용하지 않으므로 제외
    };

    saveRetrospectiveMutation.mutate(newRetrospective);
  };

  // 프로젝트 상태 계산 함수
  const getProjectStatus = (project: any) => {
    const now = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (!startDate || !endDate)
      return {
        status: translate("loopDetail.project.status.undefined"),
        color: "text-gray-500",
      };

    if (now < startDate) {
      return {
        status: translate("loopDetail.project.status.planned"),
        color: "text-blue-500",
      };
    } else if (now >= startDate && now <= endDate) {
      return {
        status: translate("loopDetail.project.status.inProgress"),
        color: "text-green-500",
      };
    } else {
      return {
        status: translate("loopDetail.project.status.completed"),
        color: "text-purple-500",
      };
    }
  };

  // 프로젝트 기간 계산 함수
  const getProjectDuration = (project: any) => {
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (!startDate || !endDate)
      return translate("loopDetail.project.duration.undefined");

    const start = formatDate(startDate, currentLanguage);
    const end = formatDate(endDate, currentLanguage);

    if (start === end) {
      return start;
    }

    return `${start} ~ ${end}`;
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
                console.log(`루프 별점 클릭: ${star}점`);
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

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {translate("loopDetail.title")}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isCompleted && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/loop/edit/${loop.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                {translate("loopEdit.title")}
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 1. 📘 루프 개요 */}
      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-xl font-bold">{loop.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Gift className="h-4 w-4 text-purple-500" />
          <span>
            {translate("loopDetail.reward")}:{" "}
            {loop.reward || translate("loopDetail.noReward")}
          </span>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>
              {translate("loopDetail.completionRate")}: {completionRate}%
            </span>
            <span>
              {projectsLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                (() => {
                  const totalTasks = Object.values(projectTaskCounts).reduce(
                    (sum, counts) => sum + counts.totalTasks,
                    0
                  );
                  const completedTasks = Object.values(
                    projectTaskCounts
                  ).reduce((sum, counts) => sum + counts.completedTasks, 0);
                  return `${completedTasks}/${totalTasks}`;
                })()
              )}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          {projects.length === 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>{translate("loopDetail.noProjectsForCompletionRate")}</span>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {formatDate(loop.startDate)} ~ {formatDate(loop.endDate)}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-medium">
            {translate("loopDetail.focusAreas")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              // 디버깅: 현재 루프 데이터 구조 확인
              console.log("루프 데이터:", {
                focusAreas: loop?.focusAreas,
                areasCount: areas.length,
              });

              // focusAreas (ID 기반) 사용
              let focusAreas: any[] = [];

              if (loop?.focusAreas && loop.focusAreas.length > 0) {
                // ID 기반 필터링
                focusAreas = areas.filter((area) =>
                  loop.focusAreas.includes(area.id)
                );
              }

              if (focusAreas.length > 0) {
                return focusAreas.map((area) => (
                  <Link
                    key={area.id}
                    href={`/para/areas/${area.id}`}
                    className="rounded-full bg-secondary px-3 py-1 text-xs hover:bg-secondary/80 transition-colors"
                  >
                    {area.name}
                  </Link>
                ));
              } else if (loop?.focusAreas && loop.focusAreas.length > 0) {
                // Area ID는 있지만 해당 Area를 찾을 수 없는 경우
                const missingItems = loop.focusAreas || [];
                return missingItems.map((item: any, index: number) => (
                  <span
                    key={index}
                    className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
                  >
                    {typeof item === "string" ? item : `Area ${item}`}
                  </span>
                ));
              } else {
                return (
                  <span className="text-xs text-muted-foreground">
                    중점 영역이 설정되지 않았습니다.
                  </span>
                );
              }
            })()}
          </div>
        </div>
      </Card>

      {/* 2. 📂 연결된 프로젝트들 */}
      <section className="mb-6">
        <div className="mb-4">
          <h3 className="font-medium">연결된 프로젝트 ({projects.length}/5)</h3>
        </div>

        {projectsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-2 w-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-2">
              이 루프에 연결된 프로젝트가 없어요
            </p>
            <p className="text-xs text-muted-foreground">
              연결된 프로젝트가 없으면 달성률을 측정할 수 없어요
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              프로젝트를 연결하려면 상단의 "루프 수정" 버튼을 사용하세요
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => {
              const taskCounts = projectTaskCounts[project.id] || {
                totalTasks: 0,
                completedTasks: 0,
              };
              const progressPercentage =
                taskCounts.totalTasks > 0
                  ? Math.round(
                      (taskCounts.completedTasks / taskCounts.totalTasks) * 100
                    )
                  : 0;

              const projectStatus = getProjectStatus(project);
              const projectDuration = getProjectDuration(project);

              return (
                <Card
                  key={project.id}
                  className="cursor-pointer transition-all hover:shadow-md"
                  onClick={() => router.push(`/para/projects/${project.id}`)}
                >
                  <div className="p-3">
                    {/* 프로젝트 제목과 상태 */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{project.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${projectStatus.color}`}
                        >
                          {projectStatus.status}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">
                        {taskCounts.completedTasks}/{taskCounts.totalTasks}
                      </span>
                    </div>

                    {/* 진행률 바 */}
                    <div className="progress-bar mb-3">
                      <div
                        className="progress-value"
                        style={{
                          width: `${progressPercentage}%`,
                        }}
                      ></div>
                    </div>

                    {/* 프로젝트 정보 */}
                    <div className="space-y-1">
                      {/* 기간 정보 */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">기간:</span>
                        <span className="text-muted-foreground">
                          {projectDuration}
                        </span>
                      </div>

                      {/* 영역 정보 */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Area:</span>
                        <span className="text-muted-foreground">
                          {(() => {
                            if (project.areaId) {
                              const area = areas.find(
                                (a) => a.id === project.areaId
                              );
                              return area ? area.name : "미분류";
                            }
                            return "미분류";
                          })()}
                        </span>
                      </div>

                      {/* 루프 도중 추가 표시 */}
                      {project.addedMidway && (
                        <div className="flex justify-end">
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 text-xs"
                          >
                            💡 루프 도중 추가됨
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. 🧾 회고 / 노트 (탭 분리) */}
      <section className="mb-6">
        <Tabs defaultValue="retrospective" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="retrospective"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {translate("loopDetail.tabs.retrospective")}
            </TabsTrigger>
            <TabsTrigger value="note" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              {translate("loopDetail.tabs.note")}
            </TabsTrigger>
          </TabsList>

          {/* 회고 탭 */}
          <TabsContent value="retrospective" className="mt-4">
            {loop.retrospective ? (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    {loop.retrospective.title || "회고 작성 완료"}
                  </h4>
                  <div className="flex items-center gap-2">
                    {loop.retrospective.bookmarked && (
                      <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                    {renderStarRating(loop.retrospective.userRating)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {loop.retrospective.summary ||
                    loop.retrospective.content ||
                    loop.retrospective.bestMoment ||
                    "작성된 회고 요약이 없습니다."}
                </p>
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/para/archives/${loop.retrospective.id}`}>
                      회고 상세 보기
                    </Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  {translate("loopDetail.retrospective.noContent")}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {isCompleted
                    ? translate("loopDetail.retrospective.description")
                    : translate(
                        "loopDetail.retrospective.inProgressDescription"
                      )}
                </p>
                {isCompleted && (
                  <Button onClick={() => setShowRetrospectiveDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    {translate("loopDetail.retrospective.writeTitle")}
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* 노트 탭 */}
          <TabsContent value="note" className="mt-4">
            {note ? (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    {translate("loopDetail.note.title")}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNoteDialog(true)}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    {translate("loopDetail.note.edit")}
                  </Button>
                </div>
                <p className="text-sm mb-3">{note.content}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDisplayDate(note.createdAt)}
                </p>
              </Card>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-muted-foreground mb-2">
                  {translate("loopDetail.note.noNote")}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {translate("loopDetail.note.description")}
                </p>
                <Button onClick={() => setShowAddNoteDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("loopDetail.note.addButton")}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* 프로젝트 추가 다이얼로그 */}
      <Dialog
        open={showAddProjectDialog}
        onOpenChange={setShowAddProjectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프에 프로젝트 추가</DialogTitle>
            <DialogDescription>
              루프 중간에 추가된 프로젝트는 별도로 표시되며, 월말 리포트에서
              '후속 투입 항목'으로 집계됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <Button asChild>
              <Link
                href={`/para/projects/new?loopId=${loop.id}&addedMidway=true`}
              >
                새 프로젝트 생성
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/loop/add-existing-project?loopId=${loop.id}`}>
                기존 프로젝트 연결
              </Link>
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAddProjectDialog(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회고 노트 추가/수정 다이얼로그 */}
      <Dialog open={showAddNoteDialog} onOpenChange={setShowAddNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프 노트 {note ? "수정" : "작성"}</DialogTitle>
            <DialogDescription>
              루프 진행 중 느낀 점이나 배운 점을 자유롭게 기록하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="오늘의 노트를 작성해보세요..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAddNoteDialog(false)}
              disabled={saveNoteMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={saveNoteMutation.isPending}
            >
              {saveNoteMutation.isPending ? "저장 중..." : "저장하기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 회고 작성 다이얼로그 (모달) */}
      <Dialog
        open={showRetrospectiveDialog}
        onOpenChange={setShowRetrospectiveDialog}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {translate("loopDetail.retrospective.title")}
            </DialogTitle>
            <DialogDescription>
              {translate("loopDetail.retrospective.description")}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div>
                <label
                  htmlFor="bestMoment"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {translate("loopDetail.retrospective.bestMoment.label")}
                </label>
                <Textarea
                  id="bestMoment"
                  className="mt-1"
                  rows={2}
                  value={bestMoment}
                  onChange={(e) => setBestMoment(e.target.value)}
                  placeholder={translate(
                    "loopDetail.retrospective.bestMoment.placeholder"
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="routineAdherence"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {translate("loopDetail.retrospective.routineAdherence.label")}
                </label>
                <Textarea
                  id="routineAdherence"
                  className="mt-1"
                  rows={2}
                  value={routineAdherence}
                  onChange={(e) => setRoutineAdherence(e.target.value)}
                  placeholder={translate(
                    "loopDetail.retrospective.routineAdherence.placeholder"
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="unexpectedObstacles"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {translate(
                    "loopDetail.retrospective.unexpectedObstacles.label"
                  )}
                </label>
                <Textarea
                  id="unexpectedObstacles"
                  className="mt-1"
                  rows={2}
                  value={unexpectedObstacles}
                  onChange={(e) => setUnexpectedObstacles(e.target.value)}
                  placeholder={translate(
                    "loopDetail.retrospective.unexpectedObstacles.placeholder"
                  )}
                />
              </div>
              <div>
                <label
                  htmlFor="nextLoopApplication"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {translate(
                    "loopDetail.retrospective.nextLoopApplication.label"
                  )}
                </label>
                <Textarea
                  id="nextLoopApplication"
                  className="mt-1"
                  rows={2}
                  value={nextLoopApplication}
                  onChange={(e) => setNextLoopApplication(e.target.value)}
                  placeholder={translate(
                    "loopDetail.retrospective.nextLoopApplication.placeholder"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {translate("loopDetail.retrospective.helpful.label")}
                </label>
                {renderStarRating(userRating, setUserRating)}
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox
                  id="bookmarked"
                  checked={bookmarked}
                  onCheckedChange={(checked) => {
                    console.log(`루프 북마크 상태 변경: ${checked}`);
                    setBookmarked(checked as boolean);
                  }}
                />
                <div className="flex-1">
                  <label
                    htmlFor="bookmarked"
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    {translate("loopDetail.retrospective.bookmark.label")}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {translate("loopDetail.retrospective.bookmark.description")}
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
              disabled={saveRetrospectiveMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleSaveRetrospective}
              disabled={saveRetrospectiveMutation.isPending}
            >
              {saveRetrospectiveMutation.isPending
                ? "저장 중..."
                : translate("loopDetail.retrospective.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="루프 삭제"
        description="이 루프를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={() => {
          deleteLoopMutation.mutate();
          setShowDeleteDialog(false);
        }}
      />

      {/* 미완료 프로젝트 이동 대화상자 */}
      <Dialog
        open={showProjectMigrationDialog}
        onOpenChange={setShowProjectMigrationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>미완료 프로젝트 발견</DialogTitle>
            <DialogDescription>
              이 루프에 완료되지 않은 프로젝트가 있습니다. 다른 루프에
              추가하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 미완료 프로젝트 목록 */}
            <div>
              <h4 className="font-medium mb-2">
                미완료 프로젝트 ({incompleteProjects.length}개)
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {incompleteProjects.map((project) => (
                  <div key={project.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="font-medium">{project.title}</div>
                    <div className="text-sm text-muted-foreground">
                      진행률: {project.progress}/{project.total} (
                      {Math.round(
                        (project.progress / Math.max(project.total, 1)) * 100
                      )}
                      %)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 대상 루프 선택 */}
            <div>
              <h4 className="font-medium mb-2">이동할 루프 선택</h4>
              <Select
                value={selectedTargetLoop}
                onValueChange={setSelectedTargetLoop}
              >
                <SelectTrigger>
                  <SelectValue placeholder="루프를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {allLoops
                    .filter(
                      (targetLoop) =>
                        targetLoop.id !== loop?.id &&
                        (getLoopStatus(targetLoop) === "in_progress" ||
                          getLoopStatus(targetLoop) === "planned")
                    )
                    .map((targetLoop) => (
                      <SelectItem key={targetLoop.id} value={targetLoop.id}>
                        <div className="flex items-center gap-2">
                          <span>{targetLoop.title}</span>
                          <Badge
                            variant={
                              getLoopStatus(targetLoop) === "in_progress"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {getLoopStatus(targetLoop) === "in_progress"
                              ? "진행 중"
                              : "예정"}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {allLoops.filter(
                (targetLoop) =>
                  targetLoop.id !== loop?.id &&
                  (getLoopStatus(targetLoop) === "in_progress" ||
                    getLoopStatus(targetLoop) === "planned")
              ).length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  💡 현재 이동 가능한 루프가 없습니다. 새로운 루프를 먼저
                  생성해주세요.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProjectMigrationDialog(false);
                setIncompleteProjects([]);
                setSelectedTargetLoop("");
              }}
            >
              나중에 처리
            </Button>
            <Button
              onClick={handleProjectMigration}
              disabled={!selectedTargetLoop || incompleteProjects.length === 0}
            >
              프로젝트 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 루프 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="루프 삭제"
        description={
          getLoopStatus(loop) === "ended"
            ? "이 루프를 삭제하시겠습니까? 삭제해도 해당 월의 정보는 연간 통계에 여전히 반영됩니다."
            : "이 루프를 삭제하시겠습니까? 연결된 프로젝트와 태스크도 함께 삭제됩니다."
        }
        onConfirm={() => {
          deleteLoopMutation.mutate();
          setShowDeleteDialog(false);
        }}
        confirmText="삭제"
        cancelText="취소"
        destructive={true}
      />
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoopDetailSkeleton />}>
      <LoopDetailPage params={params} />
    </Suspense>
  );
}
