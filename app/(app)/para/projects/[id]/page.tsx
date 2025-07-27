"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Edit,
  MoreVertical,
  Plus,
  Target,
  Clock,
  RotateCcw,
  Star,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import type { OfficialRetrospective } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;
  const { toast } = useToast();

  // 샘플 프로젝트 데이터
  const projectData = [
    {
      id: "1",
      title: "아침 운동 습관화",
      description:
        "매일 아침 30분씩 운동하는 습관을 만들어 건강한 라이프스타일을 구축하기",
      area: "건강",
      status: "completed" as const, // 완료된 프로젝트로 가정
      progress: 30,
      total: 30,
      startDate: "2025.05.01",
      endDate: "2025.05.31",
      loopConnection: "5월 루프: 건강 관리",
      createdAt: "2025.05.01",
      updatedAt: "2025.05.31",
      reflection: {
        id: "project-retro-1",
        projectId: "1",
        userId: "user-123",
        createdAt: "2025-05-31T09:00:00Z",
        type: "project",
        title: "아침 운동 습관화 프로젝트 회고",
        summary: "운동 습관 성공, 꾸준함의 중요성 깨달음",
        goalAchieved: "네, 아침 운동 습관화 목표를 100% 달성했습니다.",
        memorableTask:
          "매일 아침 일찍 일어나 운동을 시작하는 것이 가장 기억에 남습니다.",
        stuckPoints: "주말에 늦잠을 자서 운동을 거르는 경우가 있었습니다.",
        newLearnings:
          "작은 습관이라도 꾸준히 하는 것이 중요하다는 것을 깨달았습니다.",
        nextProjectImprovements:
          "다음 프로젝트에서는 주말에도 루틴을 유지할 수 있는 방법을 찾아야겠습니다.",
        content:
          "전반적으로 만족스러운 프로젝트였습니다. 건강이 많이 좋아진 것을 느낍니다.",
        userRating: 4,
        bookmarked: true,
      } as OfficialRetrospective,
      notes: [
        {
          id: 1,
          content:
            "첫 주는 적응하는 시간이었다. 아침에 일어나는 것이 가장 어려웠음.",
          createdAt: "2025-05-07T10:00:00Z",
        },
      ], // 단일 노트로 변경
    },
    {
      id: "2",
      title: "식단 관리 앱 개발",
      description: "개인 맞춤형 식단 추천 및 기록 앱 개발",
      area: "개발",
      status: "in_progress" as const, // 진행 중인 프로젝트로 가정
      progress: 7,
      total: 12,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: "6월 루프: 건강한 개발자 되기",
      createdAt: "2025.06.01",
      updatedAt: "2025.06.10",
      reflection: null, // 이 프로젝트는 회고가 없는 상태
      notes: [], // 단일 노트로 변경
    },
  ];

  const project = projectData.find((p) => p.id === projectId);

  const [activeTab, setActiveTab] = useState("overview");
  const [showAddNoteDialog, setShowAddNoteDialog] = useState(false);
  const [showRetrospectiveDialog, setShowRetrospectiveDialog] = useState(false); // 회고 모달 상태
  const [noteContent, setNoteContent] = useState("");
  const [goalAchieved, setGoalAchieved] = useState("");
  const [memorableTask, setMemorableTask] = useState("");
  const [stuckPoints, setStuckPoints] = useState("");
  const [newLearnings, setNewLearnings] = useState("");
  const [nextProjectImprovements, setNextProjectImprovements] = useState("");
  const [freeformContent, setFreeformContent] = useState("");
  const [userRating, setUserRating] = useState<number | undefined>(undefined);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // 기존 회고 데이터가 있다면 불러와서 폼에 채우기
    if (project && project.reflection) {
      setGoalAchieved(project.reflection.goalAchieved || "");
      setMemorableTask(project.reflection.memorableTask || "");
      setStuckPoints(project.reflection.stuckPoints || "");
      setNewLearnings(project.reflection.newLearnings || "");
      setNextProjectImprovements(
        project.reflection.nextProjectImprovements || ""
      );
      setFreeformContent(project.reflection.content || "");
      setUserRating(project.reflection.userRating);
      setBookmarked(project.reflection.bookmarked || false);
    } else {
      // 회고가 없으면 폼 초기화
      setGoalAchieved("");
      setMemorableTask("");
      setStuckPoints("");
      setNewLearnings("");
      setNextProjectImprovements("");
      setFreeformContent("");
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
    const newRetrospective: OfficialRetrospective = {
      id: project.reflection?.id || `new-project-retro-${Date.now()}`,
      projectId: project.id,
      userId: "user-123",
      createdAt: project.reflection?.createdAt || new Date().toISOString(),
      type: "project",
      title: project.title,
      summary:
        freeformContent.substring(0, 100) +
        (freeformContent.length > 100 ? "..." : ""),
      goalAchieved,
      memorableTask,
      stuckPoints,
      newLearnings,
      nextProjectImprovements,
      content: freeformContent,
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

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/para/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            프로젝트 목록
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/para/projects/${projectId}/edit`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {/* 프로젝트 기본 정보 (상단) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold">{project.title}</h1>
          <Badge className="bg-primary/10 text-primary">{project.area}</Badge>
        </div>

        <p className="text-muted-foreground mb-4">{project.description}</p>

        {/* 상태 및 진행률 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">진행 상태</span>
            <Badge className="bg-green-100 text-green-800">
              {project.status === "in_progress" ? "실행 중" : "완료됨"}
            </Badge>
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

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {project.startDate} ~ {project.endDate}
              </span>
            </div>
          </div>

          {project.loopConnection && (
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                {project.loopConnection}
              </span>
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
                  <span>{project.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">수정일</span>
                  <span>{project.updatedAt}</span>
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
          {project.reflection ? (
            <Card className="p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">
                  {project.reflection.title || "회고 작성 완료"}
                </h3>
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                  {project.reflection.bookmarked && (
                    <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  {renderStarRating(project.reflection.userRating)}
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {project.reflection.summary ||
                  project.reflection.content ||
                  project.reflection.goalAchieved ||
                  "작성된 회고 요약이 없습니다."}
              </p>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/para/archives/${project.reflection.id}`}>
                    회고 상세 보기
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 text-center mb-6">
              <h3 className="font-medium mb-4">
                이 프로젝트를 회고하고, 다음 단계를 계획하세요.
              </h3>
              <Button onClick={() => setShowRetrospectiveDialog(true)}>
                회고 작성
              </Button>
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

      {/* 회고 노트 추가/수정 다이얼로그 (프로젝트 노트용) */}
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

      {/* 프로젝트 회고 작성 다이얼로그 (모달) */}
      <Dialog
        open={showRetrospectiveDialog}
        onOpenChange={setShowRetrospectiveDialog}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>프로젝트 회고 작성</DialogTitle>
            <DialogDescription>
              이 프로젝트를 돌아보고 다음 단계를 계획하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label
                htmlFor="goalAchieved"
                className="block text-sm font-medium text-gray-700"
              >
                목표를 달성했나요?
              </label>
              <Input
                type="text"
                id="goalAchieved"
                className="mt-1"
                value={goalAchieved}
                onChange={(e) => setGoalAchieved(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="memorableTask"
                className="block text-sm font-medium text-gray-700"
              >
                가장 인상 깊었던 작업은?
              </label>
              <Textarea
                id="memorableTask"
                className="mt-1"
                rows={2}
                value={memorableTask}
                onChange={(e) => setMemorableTask(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="stuckPoints"
                className="block text-sm font-medium text-gray-700"
              >
                막혔던 지점은 있었나요?
              </label>
              <Textarea
                id="stuckPoints"
                className="mt-1"
                rows={2}
                value={stuckPoints}
                onChange={(e) => setStuckPoints(e.target.value)}
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
              />
            </div>
            <div>
              <label
                htmlFor="nextProjectImprovements"
                className="block text-sm font-medium text-gray-700"
              >
                다음 프로젝트에서 개선할 점은?
              </label>
              <Textarea
                id="nextProjectImprovements"
                className="mt-1"
                rows={2}
                value={nextProjectImprovements}
                onChange={(e) => setNextProjectImprovements(e.target.value)}
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
