"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  Clock,
  Star,
  Plus,
  Bookmark,
  Edit,
  Gift,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import type { Loop } from "@/lib/types";
import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";

export function LoopDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false);

  // 샘플 데이터 - 실제로는 ID를 기반으로 데이터를 가져와야 함
  // ID가 '1'인 루프는 회고가 있는 완료된 루프, '2'인 루프는 회고가 없는 완료된 루프
  const loopData: Loop[] = [
    {
      id: "1",
      userId: "user1",
      title: "6월 루프: 건강한 개발자 되기",
      startDate: new Date("2025-06-01"),
      endDate: new Date("2025-06-30"),
      status: "ended",
      focusAreas: ["area1", "area2"],
      projectIds: ["project1", "project2", "project3"],
      reward: "새로운 기계식 키보드 구매",
      createdAt: new Date("2025-06-01"),
      updatedAt: new Date("2025-06-30"),
      doneCount: 27,
      targetCount: 30,
      retrospective: {
        id: "retro-1",
        userId: "user1",
        createdAt: new Date("2025-07-01T09:00:00Z"),
        updatedAt: new Date("2025-07-01T09:00:00Z"),
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
      },
      note: {
        id: "note-1",
        userId: "user1",
        content: "오늘 아침 운동 성공! 상쾌하다.",
        createdAt: new Date("2025-06-05T10:30:00Z"),
        updatedAt: new Date("2025-06-05T10:30:00Z"),
      },
    },
    {
      id: "2",
      userId: "user1",
      title: "7월 루프: 독서 습관 만들기",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-07-31"),
      status: "in_progress",
      focusAreas: ["area3", "area4"],
      projectIds: ["project4", "project5"],
      reward: "새로운 책 5권 구매",
      createdAt: new Date("2025-07-01"),
      updatedAt: new Date("2025-07-01"),
      doneCount: 0,
      targetCount: 30,
      retrospective: undefined, // 이 루프는 아직 회고 없음
      note: undefined, // 이 루프는 아직 노트 없음
    },
  ];

  // 계산된 값들을 위한 헬퍼 함수들
  const getCompletionRate = (loop: Loop) => {
    return loop.targetCount > 0
      ? Math.round((loop.doneCount / loop.targetCount) * 100)
      : 0;
  };

  const getProjectCount = (loop: Loop) => {
    return loop.projectIds.length;
  };

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getFormattedDateShort = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleAddProject = () => {
    setShowAddProjectDialog(true);
  };

  const handleSaveNote = (data: any) => {
    // 노트 저장 로직
    console.log("노트 저장:", data);

    toast({
      title: "노트 저장 완료",
      description: "노트가 저장되었습니다.",
    });

    setShowAddNoteDialog(false);
  };

  const formatDate = (date: Date | string) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("ko-KR");
    }
    return date.toLocaleDateString("ko-KR");
  };

  const handleSaveRetrospective = (data: any) => {
    // 회고 저장 로직
    const retrospectiveData = {
      ...data,
      id: `retro-${Date.now()}`,
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
      title: `${loop?.title} 회고`,
      summary: `${data.bestMoment} - ${data.unexpectedObstacles}`,
    };

    console.log("회고 저장:", retrospectiveData);

    toast({
      title: "회고 저장 완료",
      description: "회고가 저장되었습니다.",
    });

    setShowRetrospectiveDialog(false);
  };

  const renderStarRating = (
    rating: number | undefined,
    setRating?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating?.(star)}
            className={`text-lg ${
              rating && star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  // 현재 루프 찾기
  const loop = loopData.find((l) => l.id === params.id);

  if (!loop) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">루프를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mt-2">
            요청하신 루프가 존재하지 않습니다.
          </p>
          <Button asChild className="mt-4">
            <Link href="/loop">루프 목록으로</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canAddProject = getProjectCount(loop) < 5;
  const canEdit = !loop.status.includes("ended");

  return (
    <div className="container max-w-md px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{loop.title}</h1>
        </div>
        {canEdit && (
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            편집
          </Button>
        )}
      </div>

      {/* 기본 정보 */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">기본 정보</h2>
          <Badge variant={loop.status === "ended" ? "secondary" : "default"}>
            {loop.status === "ended" ? "완료됨" : "진행 중"}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {getFormattedDate(loop.startDate)} ~{" "}
              {getFormattedDate(loop.endDate)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{loop.reward}</span>
          </div>

          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              진행률: {getCompletionRate(loop)}% ({loop.doneCount}/
              {loop.targetCount})
            </span>
          </div>
        </div>
      </Card>

      {/* 프로젝트 목록 */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">연결된 프로젝트</h2>
          {canAddProject && (
            <Button size="sm" onClick={handleAddProject}>
              <Plus className="mr-2 h-4 w-4" />
              프로젝트 추가
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {loop.projectIds.map((projectId) => (
            <div
              key={projectId}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <span className="text-sm">프로젝트 {projectId}</span>
              <Badge variant="outline">진행 중</Badge>
            </div>
          ))}
          {loop.projectIds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              연결된 프로젝트가 없습니다.
            </p>
          )}
        </div>
      </Card>

      {/* 회고 섹션 */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">회고</h2>
          {loop.status === "ended" && !loop.retrospective && (
            <Button size="sm" onClick={() => setShowRetrospectiveDialog(true)}>
              회고 작성
            </Button>
          )}
        </div>

        {loop.retrospective ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bookmark
                className={`h-4 w-4 ${
                  loop.retrospective.bookmarked
                    ? "text-yellow-500"
                    : "text-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium">
                {loop.retrospective.title}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">가장 좋았던 순간</h4>
                <p className="text-sm text-muted-foreground">
                  {loop.retrospective.bestMoment}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">루틴 준수율</h4>
                <p className="text-sm text-muted-foreground">
                  {loop.retrospective.routineAdherence}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">예상치 못한 장애물</h4>
                <p className="text-sm text-muted-foreground">
                  {loop.retrospective.unexpectedObstacles}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-1">
                  다음 루프 적용 방안
                </h4>
                <p className="text-sm text-muted-foreground">
                  {loop.retrospective.nextLoopApplication}
                </p>
              </div>

              {loop.retrospective.content && (
                <div>
                  <h4 className="text-sm font-medium mb-1">자유 회고</h4>
                  <p className="text-sm text-muted-foreground">
                    {loop.retrospective.content}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">평점</h4>
                  {renderStarRating(loop.retrospective.userRating)}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">요약</h4>
                  <p className="text-sm text-muted-foreground">
                    {loop.retrospective.summary}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            {loop.status === "ended"
              ? "회고를 작성해보세요."
              : "루프가 완료되면 회고를 작성할 수 있습니다."}
          </p>
        )}
      </Card>

      {/* 노트 섹션 */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">노트</h2>
          <Button size="sm" onClick={() => setShowAddNoteDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            노트 추가
          </Button>
        </div>

        {loop.note ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{loop.note.content}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(loop.note.createdAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            노트가 없습니다.
          </p>
        )}
      </Card>

      {/* 회고 작성 다이얼로그 */}
      {showRetrospectiveDialog && (
        <RetrospectiveForm
          loopTitle={loop?.title || ""}
          onClose={() => setShowRetrospectiveDialog(false)}
          onSave={handleSaveRetrospective}
        />
      )}

      {/* 노트 작성 다이얼로그 */}
      {showAddNoteDialog && (
        <NoteForm
          onClose={() => setShowAddNoteDialog(false)}
          onSave={handleSaveNote}
        />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <LoopDetailPage />
    </Suspense>
  );
}
