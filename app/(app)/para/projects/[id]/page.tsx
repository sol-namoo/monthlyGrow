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
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { fetchProjectById } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

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
  if (isLoading) {
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
            프로젝트 정보를 불러오는 중 오류가 발생했습니다.
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

  if (!project) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20 text-center">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 샘플 태스크 데이터
  const tasks = [
    { id: 1, title: "운동복 준비하기", completed: true, date: "2025.05.01" },
    { id: 2, title: "운동 계획 세우기", completed: true, date: "2025.05.02" },
    { id: 3, title: "첫 주 운동 완료", completed: true, date: "2025.05.07" },
    { id: 4, title: "둘째 주 운동 완료", completed: true, date: "2025.05.14" },
    { id: 5, title: "셋째 주 운동 완료", completed: false, date: "2025.05.21" },
    { id: 6, title: "넷째 주 운동 완료", completed: false, date: "2025.05.28" },
  ];

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
            <span className="text-sm font-medium">진행률</span>
            <span className="text-sm text-muted-foreground">
              {project.progress}/{project.total} (
              {Math.round((project.progress / project.total) * 100)}%)
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-value"
              style={{
                width: `${Math.round(
                  (project.progress / project.total) * 100
                )}%`,
              }}
            ></div>
          </div>

          {/* 연결된 루프 */}
          <div>
            <span className="text-sm font-medium">연결된 루프</span>
            <div className="mt-2 space-y-2">
              {project.connectedLoops && project.connectedLoops.length > 0 ? (
                project.connectedLoops.map((loop, index) => (
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
                  <Alert className="mb-4 bg-amber-50 border-amber-200">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">
                      장기 프로젝트 안내
                    </AlertTitle>
                    <AlertDescription className="text-amber-700">
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
            {/* 통계 카드 */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">목표</p>
                    <p className="font-semibold">{project.total}일</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">완료</p>
                    <p className="font-semibold">{project.progress}일</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 최근 활동 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">최근 활동</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>둘째 주 운동 완료</span>
                  <span className="text-muted-foreground ml-auto">
                    2025.05.14
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground" />
                  <span>셋째 주 운동 시작</span>
                  <span className="text-muted-foreground ml-auto">
                    2025.05.15
                  </span>
                </div>
              </div>
            </Card>

            {/* 프로젝트 정보 */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">프로젝트 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">생성일</span>
                  <span>{formatDate(project.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수정일</span>
                  <span>{formatDate(project.updatedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area</span>
                  <span>{project.area}</span>
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
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                추가
              </Button>
            </div>

            <div className="space-y-2">
              {tasks.map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-center gap-3">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm ${
                          task.completed
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {task.date}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {tasks.filter((task) => task.completed).length}/{tasks.length}{" "}
              태스크 완료
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
                  진행률: {Math.round((project.progress / project.total) * 100)}
                  %
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  이 프로젝트는 나에게 도움이 되었나요?
                </label>
                {renderStarRating(userRating, setUserRating)}
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
                    className="text-sm font-medium text-gray-900 cursor-pointer"
                  >
                    다시 읽고 싶은 회고로 표시
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
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
    </div>
  );
}
