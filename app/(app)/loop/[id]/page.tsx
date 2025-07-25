"use client";

import { useState, useEffect } from "react";
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
import type { OfficialRetrospective } from "@/types/retrospective";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoopDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false); // 회고 모달 상태
  const [noteContent, setNoteContent] = useState("");
  const [bestMoment, setBestMoment] = useState("");
  const [routineAdherence, setRoutineAdherence] = useState("");
  const [unexpectedObstacles, setUnexpectedObstacles] = useState("");
  const [nextLoopApplication, setNextLoopApplication] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [bookmarked, setBookmarked] = useState(false);

  // 샘플 데이터 - 실제로는 ID를 기반으로 데이터를 가져와야 함
  // ID가 '1'인 루프는 회고가 있는 완료된 루프, '2'인 루프는 회고가 없는 완료된 루프
  const loopData = [
    {
      id: "1",
      title: "6월 루프: 건강한 개발자 되기",
      reward: "새로운 기계식 키보드 구매",
      progress: 90,
      total: 100,
      startDate: "2025년 6월 1일",
      endDate: "2025년 6월 30일",
      areas: ["건강", "개발"],
      projects: [
        {
          id: 1,
          title: "매일 아침 30분 운동",
          progress: 28,
          total: 30,
          addedMidway: false,
        },
        {
          id: 2,
          title: "클린 코드 작성 연습",
          progress: 11,
          total: 12,
          addedMidway: false,
        },
        {
          id: 3,
          title: "주 2회 명상",
          progress: 19,
          total: 20,
          addedMidway: true,
        },
      ],
      completed: true,
      reflection: {
        id: "official-retro-1",
        loopId: "1",
        userId: "user-123",
        createdAt: "2025-07-01T09:00:00Z",
        bestMoment: "매일 아침 운동을 꾸준히 했던 순간",
        routineAdherence:
          "계획한 루틴의 90%를 지켰습니다. 특히 아침 운동은 꾸준히 했습니다.",
        unexpectedObstacles: "갑작스러운 출장으로 식단 관리가 어려웠습니다.",
        nextLoopApplication:
          "다음 루프에서는 출장 시에도 식단을 유지할 수 있는 계획을 세울 것입니다.",
        content:
          "전반적으로 만족스러운 루프였습니다. 건강이 많이 좋아진 것을 느낍니다.",
        userRating: 4,
        bookmarked: true,
        title: "6월 루프: 건강한 개발자 되기 회고",
        summary: "아침 운동 습관 성공, 출장 중 식단 관리 어려움",
      } as OfficialRetrospective,
      notes: [
        {
          id: 1,
          content: "오늘 아침 운동 성공! 상쾌하다.",
          createdAt: "2025-06-05T10:30:00Z",
        },
      ], // 단일 노트로 변경
    },
    {
      id: "2",
      title: "7월 루프: 독서 습관 만들기",
      reward: "새로운 책 5권 구매",
      progress: 0,
      total: 100,
      startDate: "2025년 7월 1일",
      endDate: "2025년 7월 31일",
      areas: ["자기계발", "지식"],
      projects: [
        {
          id: 4,
          title: "매일 30분 독서",
          progress: 0,
          total: 30,
          addedMidway: false,
        },
        {
          id: 5,
          title: "독서 노트 작성",
          progress: 0,
          total: 10,
          addedMidway: false,
        },
      ],
      completed: false, // 이 루프는 아직 진행 중
      reflection: null, // 이 루프는 아직 회고 없음
      notes: [], // 단일 노트로 변경
    },
  ];

  const loop = loopData.find((l) => l.id === params.id);

  // 프로젝트 추가 가능 여부 확인 (최대 5개)
  const canAddProject = loop ? loop.projects.length < 5 : false;

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

    // TODO: 여기서 노트 추가/수정 로직 구현 (실제 DB에 저장)
    toast({
      title: "노트 저장 성공",
      description: "노트가 성공적으로 저장되었습니다.",
    });
    setShowAddNoteDialog(false);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

    // TODO: 실제 DB 저장 로직 구현
    const newRetrospective: OfficialRetrospective = {
      id: loop?.reflection?.id || `new-retro-${Date.now()}`, // 새 ID 생성 또는 기존 ID 사용
      loopId: loop?.id || "",
      userId: "user-123", // 실제 사용자 ID로 대체
      createdAt: loop?.reflection?.createdAt || new Date().toISOString(), // 기존 날짜 또는 현재 날짜
      type: "loop",
      title: loop?.title || "", // 루프 제목을 회고 제목으로 사용
      summary:
        freeformContent.substring(0, 100) +
        (freeformContent.length > 100 ? "..." : ""), // 요약 생성
      bestMoment,
      routineAdherence,
      unexpectedObstacles,
      nextLoopApplication,
      content: freeformContent,
      userRating,
      bookmarked,
    };

    console.log("회고 저장:", newRetrospective);
    toast({
      title: "회고 저장 완료",
      description: "회고가 성공적으로 저장되었습니다.",
    });
    setShowRetrospectiveDialog(false); // 저장 후 모달 닫기
    // 실제 앱에서는 여기서 API 호출 후 loop 상태를 업데이트하여 반영해야 합니다.
  };

  const renderStarRating = (
    rating: number | undefined,
    setRating?: (rating: number) => void
  ) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= (rating || 0)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            } ${setRating ? "cursor-pointer" : ""}`}
            onClick={() => setRating && setRating(star)}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
    // 기존 회고 데이터가 있다면 불러와서 폼에 채우기
    if (loop?.reflection) {
      setBestMoment(loop.reflection.bestMoment || "");
      setRoutineAdherence(loop.reflection.routineAdherence || "");
      setUnexpectedObstacles(loop.reflection.unexpectedObstacles || "");
      setNextLoopApplication(loop.reflection.nextLoopApplication || "");
      setFreeformContent(loop.reflection.content || "");
      setUserRating(loop.reflection.userRating);
      setBookmarked(loop.reflection.bookmarked || false);
    } else {
      // 회고가 없으면 폼 초기화
      setBestMoment("");
      setRoutineAdherence("");
      setUnexpectedObstacles("");
      setNextLoopApplication("");
      setFreeformContent("");
      setUserRating(undefined);
      setBookmarked(false);
    }

    // 기존 노트 데이터가 있다면 불러와서 폼에 채우기
    if (loop?.notes && loop.notes.length > 0) {
      setNoteContent(loop.notes[0].content || "");
    } else {
      setNoteContent("");
    }
  }, [loop]);

  if (!loop) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20 text-center">
        <p className="text-muted-foreground">루프를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">루프 상세</h1>
      </div>

      {/* 루프 정보 요약 */}
      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-xl font-bold">{loop.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>보상: {loop.reward}</span>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {loop.progress}%</span>
            <span>
              {loop.progress}/{loop.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${loop.progress}%` }}
            ></div>
          </div>
          {loop.projects.length === 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="h-3 w-3" />
              <span>연결된 프로젝트가 없으면 달성률을 측정할 수 없어요</span>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {loop.startDate} ~ {loop.endDate}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-medium">중점 Areas</h3>
          <div className="flex flex-wrap gap-2">
            {loop.areas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* 연결된 프로젝트 리스트 */}
      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">프로젝트 ({loop.projects.length}/5)</h3>
          {!loop.completed && (
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

        {loop.projects.length === 0 ? (
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
            {loop.projects.map((project) => (
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
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 공식 회고 1개 */}
      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">월간 회고</h2>
        {loop.reflection ? (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">
                {loop.reflection.title || "회고 작성 완료"}
              </h3>
              <div className="flex items-center gap-2 text-lg font-bold text-primary">
                {loop.reflection.bookmarked && (
                  <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
                {renderStarRating(loop.reflection.userRating)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {loop.reflection.summary ||
                loop.reflection.content ||
                loop.reflection.bestMoment ||
                "작성된 회고 요약이 없습니다."}
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/para/archives/${loop.reflection.id}`}>
                  회고 상세 보기
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-4 text-center">
            <h3 className="font-medium mb-4">
              이번 루프를 회고하��, 다음 단계를 계획하세요.
            </h3>
            <Button onClick={() => setShowRetrospectiveDialog(true)}>
              회고 작성
            </Button>
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
            {loop.notes && loop.notes.length > 0 ? (
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

        {loop.notes && loop.notes.length > 0 ? (
          <Card className="p-3">
            <p className="text-sm mb-2">{loop.notes[0].content}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(loop.notes[0].createdAt)}
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

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/loop">돌아가기</Link>
        </Button>
      </div>
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
              <Link href="/para/projects/new?loopId=1&addedMidway=true">
                새 프로젝트 생성
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/loop/add-existing-project?loopId=1">
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
              루프 노트 {loop.notes && loop.notes.length > 0 ? "수정" : "작성"}
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>월간 회고 작성</DialogTitle>
            <DialogDescription>
              이번 루프를 돌아보고 다음 루프를 계획하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label
                htmlFor="bestMoment"
                className="block text-sm font-medium text-gray-700"
              >
                이번 루프에서 가장 좋았던 순간은?
              </label>
              <Input
                type="text"
                id="bestMoment"
                className="mt-1"
                value={bestMoment}
                onChange={(e) => setBestMoment(e.target.value)}
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
              />
            </div>
            <div>
              <label
                htmlFor="freeformContent"
                className="block text-sm font-medium text-gray-700"
              >
                자유 노트 (선택)
              </label>
              <Textarea
                id="freeformContent"
                className="mt-1"
                rows={3}
                value={freeformContent}
                onChange={(e) => setFreeformContent(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                이 회고는 스스로에게 도움이 되었나요?
              </label>
              {renderStarRating(userRating, setUserRating)}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bookmarked"
                className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={bookmarked}
                onChange={(e) => setBookmarked(e.target.checked)}
              />
              <label htmlFor="bookmarked" className="text-gray-900">
                다시 읽고 싶은 회고로 표시
              </label>
            </div>
          </div>
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
