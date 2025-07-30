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
import { useQuery } from "@tanstack/react-query";
import { fetchLoopById, fetchAllTasksByProjectId } from "@/lib/firebase";
import { formatDate, getLoopStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [routineAdherence, setRoutineAdherence] = useState("");
  const [unexpectedObstacles, setUnexpectedObstacles] = useState("");
  const [nextLoopApplication, setNextLoopApplication] = useState("");
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [bookmarked, setBookmarked] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | undefined>(undefined);

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

  // 가상의 프로젝트 데이터 (실제로는 loop.projectIds를 통해 가져와야 함)
  const projects =
    loop?.projectIds?.map((projectId, index) => ({
      id: projectId,
      title: `프로젝트 ${index + 1}`,
      progress: Math.floor(Math.random() * 30),
      total: 30,
      addedMidway: index > 0,
    })) || [];

  // 가상의 노트 데이터
  const notes = loop?.note
    ? [
        {
          id: 1,
          content: loop.note.content || "루프 진행 중 작성된 노트입니다.",
          createdAt: new Date(),
        },
      ]
    : [];

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
    if (showAddNoteDialog && notes && notes.length > 0) {
      setNoteContent(notes[0].content || "");
    } else if (!showAddNoteDialog) {
      setNoteContent("");
    }
  }, [showAddNoteDialog, notes]);

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

  // 진행률 계산 (실제 데이터 기반)
  const completionRate =
    loop.targetCount > 0
      ? Math.round((loop.doneCount / loop.targetCount) * 100)
      : 0;

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

    toast({
      title: "노트 저장 성공",
      description: "노트가 성공적으로 저장되었습니다.",
    });
    setShowAddNoteDialog(false);
  };

  // 날짜 포맷팅 함수
  const formatDisplayDate = (date: Date) => {
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
      userId: "user-123",
      createdAt: loop?.retrospective?.createdAt || new Date(),
      updatedAt: new Date(),
      title: loop?.title || "",
      summary:
        bestMoment.substring(0, 100) + (bestMoment.length > 100 ? "..." : ""),
      bestMoment,
      routineAdherence,
      unexpectedObstacles,
      nextLoopApplication,
      content: `가장 좋았던 순간: ${bestMoment}\n\n루틴 준수도: ${routineAdherence}\n\n방해 요소: ${unexpectedObstacles}\n\n다음 루프 적용점: ${nextLoopApplication}`,
      userRating,
      bookmarked,
    };

    console.log("회고 저장:", newRetrospective);
    toast({
      title: "회고 저장 완료",
      description: "회고가 성공적으로 저장되었습니다.",
    });
    setShowRetrospectiveDialog(false);
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 상세</h1>
        </div>
        {!isCompleted && (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/loop/edit/${loop.id}`}>
              <Edit className="mr-2 h-4 w-4" />
              루프 수정
            </Link>
          </Button>
        )}
      </div>

      {/* 루프 정보 요약 */}
      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-xl font-bold">{loop.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Gift className="h-4 w-4 text-purple-500" />
          <span>보상: {loop.reward || "보상 없음"}</span>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {completionRate}%</span>
            <span>
              {loop.doneCount}/{loop.targetCount}
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
              <span>연결된 프로젝트가 없으면 달성률을 측정할 수 없어요</span>
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
          <h3 className="mb-2 font-medium">중점 Areas</h3>
          <div className="flex flex-wrap gap-2">
            {loop.focusAreas?.map((area) => (
              <span
                key={area}
                className="rounded-full bg-secondary px-3 py-1 text-xs"
              >
                {area}
              </span>
            )) || (
              <span className="text-xs text-muted-foreground">
                중점 영역이 설정되지 않았습니다.
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* 연결된 프로젝트 리스트 */}
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">프로젝트 ({projects.length}/5)</h3>
          {!isCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddProject}
              disabled={!canAddProject}
            >
              <Plus className="mr-1 h-4 w-4" />
              프로젝트 추가
            </Button>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-2">
              이 루프에 연결된 프로젝트가 없어요
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              연결된 프로젝트가 없으면 달성률을 측정할 수 없어요
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={handleAddProject}>
                <Plus className="mr-2 h-4 w-4" />
                프로젝트 연결하기
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/loop/edit/${loop.id}`}>루프 편집</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-lg bg-secondary p-3 text-sm"
              >
                <div className="mb-1 flex justify-between">
                  <div className="flex items-center gap-2">
                    <span>{project.title}</span>
                    {project.addedMidway && (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 text-xs"
                      >
                        🔥 루프 중 추가됨
                      </Badge>
                    )}
                  </div>
                  <span>
                    {project.progress}/{project.total}
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
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Area: 미분류
                  </span>
                  {project.addedMidway ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-800 text-xs"
                    >
                      💡 루프 도중 추가됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-primary/10 text-xs">
                      현재 루프 연결됨
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 공식 회고 1개 */}
      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">월간 회고</h2>
        {loop.retrospective ? (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                {loop.retrospective.title || "회고 작성 완료"}
              </h3>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
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
          <Card className="p-4 text-center">
            <h3 className="font-medium mb-4">
              이번 루프를 회고하고, 다음 단계를 계획하세요.
            </h3>
            {isCompleted ? (
              <Button onClick={() => setShowRetrospectiveDialog(true)}>
                회고 작성
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                진행률: {completionRate}%
              </div>
            )}
          </Card>
        )}
      </section>

      {/* 노트 (단일 노트) */}
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">노트</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddNoteDialog(true)}
          >
            {notes && notes.length > 0 ? (
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

        {notes && notes.length > 0 ? (
          <Card className="p-3">
            <p className="text-sm mb-2">{notes[0].content}</p>
            <p className="text-xs text-muted-foreground">
              {formatDisplayDate(notes[0].createdAt)}
            </p>
          </Card>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground mb-2">작성된 노트가 없어요</p>
            <p className="text-sm text-muted-foreground mb-4">
              이번 루프에서 느낀 점을 기록해 보세요
            </p>
            <Button onClick={() => setShowAddNoteDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              노트 작성하기
            </Button>
          </div>
        )}
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
            <DialogTitle>
              루프 노트 {notes && notes.length > 0 ? "수정" : "작성"}
            </DialogTitle>
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
            >
              취소
            </Button>
            <Button onClick={handleSaveNote}>저장하기</Button>
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
            <DialogTitle>월간 회고 작성</DialogTitle>
            <DialogDescription>
              이번 루프를 돌아보고 다음 루프를 계획하세요.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              <div>
                <label
                  htmlFor="bestMoment"
                  className="block text-sm font-medium text-gray-700"
                >
                  이번 루프에서 가장 좋았던 순간은?
                </label>
                <Textarea
                  id="bestMoment"
                  className="mt-1"
                  rows={2}
                  value={bestMoment}
                  onChange={(e) => setBestMoment(e.target.value)}
                  placeholder="예: 운동 후 기분이 좋아지는 것을 느낀 순간"
                />
              </div>
              <div>
                <label
                  htmlFor="routineAdherence"
                  className="block text-sm font-medium text-gray-700"
                >
                  계획한 루틴을 얼마나 지켰나요?
                </label>
                <Textarea
                  id="routineAdherence"
                  className="mt-1"
                  rows={2}
                  value={routineAdherence}
                  onChange={(e) => setRoutineAdherence(e.target.value)}
                  placeholder="예: 평일 80%, 주말 60% 정도로 유지"
                />
              </div>
              <div>
                <label
                  htmlFor="unexpectedObstacles"
                  className="block text-sm font-medium text-gray-700"
                >
                  예기치 못한 방해 요소는 있었나요?
                </label>
                <Textarea
                  id="unexpectedObstacles"
                  className="mt-1"
                  rows={2}
                  value={unexpectedObstacles}
                  onChange={(e) => setUnexpectedObstacles(e.target.value)}
                  placeholder="예: 주말에 늦잠을 자는 습관"
                />
              </div>
              <div>
                <label
                  htmlFor="nextLoopApplication"
                  className="block text-sm font-medium text-gray-700"
                >
                  다음 루프에 적용할 점은?
                </label>
                <Textarea
                  id="nextLoopApplication"
                  className="mt-1"
                  rows={2}
                  value={nextLoopApplication}
                  onChange={(e) => setNextLoopApplication(e.target.value)}
                  placeholder="예: 다음 루프에서는 주말 루틴도 포함해서 계획"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  이 회고는 스스로에게 도움이 되었나요?
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

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<LoopDetailSkeleton />}>
      <LoopDetailPage params={params} />
    </Suspense>
  );
}
