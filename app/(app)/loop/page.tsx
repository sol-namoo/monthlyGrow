"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Clock,
  Star,
  Target,
  CalendarDays,
  Edit,
  Calendar,
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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function LoopPage() {
  const { toast } = useToast();
  const [showNewMonthDialog, setShowNewMonthDialog] = useState(false);

  // 현재 날짜 정보
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const isFirstDayOfMonth = currentDate.getDate() === 1;

  // 샘플 데이터 - 실제로는 API에서 가져와야 함
  const hasCurrentLoop = true; // 현재 루프 존재 여부
  const hasNextLoop = true; // 다음 루프 존재 여부

  // 다음 달 정보 계산
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthName = new Date(nextMonthYear, nextMonth, 1).toLocaleString(
    "ko-KR",
    { month: "long" }
  );

  // 현재 달 정보
  const currentMonthName = currentDate.toLocaleString("ko-KR", {
    month: "long",
  });

  // 자동 루프 생성 유도 팝업 표시 여부 확인
  useEffect(() => {
    // 오늘이 새 달의 1일이고, 현재 루프가 없는 경우 팝업 표시
    if (isFirstDayOfMonth && !hasCurrentLoop) {
      // 오늘 이미 표시했는지 확인 (localStorage 사용)
      const lastShown = localStorage.getItem("loopReminderLastShown");
      const today = currentDate.toISOString().split("T")[0];

      if (lastShown !== today) {
        setShowNewMonthDialog(true);
        // 오늘 날짜 저장 (하루에 한 번만 표시)
        localStorage.setItem("loopReminderLastShown", today);
      }
    }
  }, [isFirstDayOfMonth, hasCurrentLoop]);

  // 샘플 데이터
  const currentLoop = hasCurrentLoop
    ? {
        id: 1,
        title: "5월 루프: 건강 관리",
        reward: "새 운동화 구매",
        progress: 65,
        total: 100,
        startDate: "2025년 5월 1일",
        endDate: "2025년 5월 31일",
        areas: ["건강", "개발", "마음"],
        projects: [
          { id: 1, title: "아침 운동 습관화", progress: 18, total: 30 },
          { id: 2, title: "식단 관리 앱 개발", progress: 7, total: 12 },
          { id: 3, title: "명상 습관 만들기", progress: 10, total: 20 },
        ],
      }
    : null;

  // 다음 루프 샘플 데이터
  const nextLoop = hasNextLoop
    ? {
        id: 4,
        title: "6월 루프: 독서 습관",
        reward: "만화책 사기",
        startDate: "2025년 6월 1일",
        endDate: "2025년 6월 30일",
        areas: ["자기계발", "지식", "창의성"],
        projects: [
          { id: 10, title: "매일 30분 독서하기", progress: 0, total: 30 },
          { id: 11, title: "독서 노트 작성", progress: 0, total: 15 },
          { id: 12, title: "도서관 정기 방문", progress: 0, total: 4 },
        ],
      }
    : null;

  const pastLoops = [
    {
      id: 2,
      title: "4월 루프: 독서 습관",
      reward: "전자책 리더기",
      completed: true,
      date: "2025년 4월",
    },
    {
      id: 3,
      title: "3월 루프: 코딩 스킬",
      reward: "프로그래밍 강의",
      completed: false,
      date: "2025년 3월",
    },
  ];

  // 루프 생성 버튼 클릭 핸들러
  const handleCreateLoop = () => {
    if (hasCurrentLoop && hasNextLoop) {
      toast({
        title: "다음 루프가 이미 준비되어 있어요",
        description: "현재 진행 중인 루프와 다음 달 루프가 모두 존재합니다.",
      });
      return;
    }

    // 루프 생성 페이지로 이동
    // 현재 루프 존재 여부에 따라 다른 파라미터 전달
    const startDate = hasCurrentLoop
      ? `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-01` // 다음 달 1일
      : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`; // 현재 달 1일

    window.location.href = `/loop/new?startDate=${startDate}`;
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">월간 루프</h1>

        {/* 루프 생성 버튼 - 상태에 따라 다른 문구와 동작 */}
        {(!hasCurrentLoop || !hasNextLoop) && (
          <div className="flex flex-col items-end">
            <Button onClick={handleCreateLoop}>
              <Target className="mr-2 h-4 w-4" />
              {!hasCurrentLoop
                ? "이번 달 루프 시작하기"
                : "다음 루프 미리 만들기"}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              {!hasCurrentLoop
                ? "루프는 월 단위로 구성되며, 오늘부터 시작할 수 있어요."
                : `다음 달 루프는 ${nextMonthName} 1일에 시작됩니다.`}
            </p>
          </div>
        )}

        {/* 현재 루프와 다음 루프가 모두 있는 경우 버튼 대신 안내 메시지 */}
        {hasCurrentLoop && hasNextLoop && (
          <div className="flex items-center text-sm text-muted-foreground">
            <CalendarDays className="mr-1 h-4 w-4" />
            <span>다음 루프가 이미 준비되어 있어요</span>
          </div>
        )}
      </div>

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">
          {currentLoop ? "현재 루프" : "진행 중인 루프가 없습니다"}
        </h2>

        {currentLoop ? (
          <Card className="border-2 border-primary/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{currentLoop.title}</h3>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <Link href={`/loop/edit/${currentLoop.id}`}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">루프 수정</span>
                </Link>
              </Button>
            </div>
            <div className="mb-4 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>보상: {currentLoop.reward}</span>
            </div>

            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm">
                <span>진행률: {currentLoop.progress}%</span>
                <span>
                  {currentLoop.progress}/{currentLoop.total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${currentLoop.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {currentLoop.startDate} ~ {currentLoop.endDate}
              </span>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 font-medium">중점 Areas</h4>
              <div className="flex flex-wrap gap-2">
                {currentLoop.areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">프로젝트</h4>
              <div className="space-y-2">
                {currentLoop.projects.map((project) => (
                  <div
                    key={project.id}
                    className="rounded-lg bg-secondary p-3 text-sm"
                  >
                    <div className="mb-1 flex justify-between">
                      <span>{project.title}</span>
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
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/loop/summary">회고 작성</Link>
              </Button>
              <Button variant="default" asChild>
                <Link href={`/loop/${currentLoop.id}`}>상세 보기</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="border-2 border-dashed border-muted p-6 text-center">
            <div className="mb-3 flex justify-center">
              <Target className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">루프를 시작해보세요</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              월간 루프를 통해 목표를 설정하고 꾸준히 실천해보세요.
              <br />
              매월 새로운 도전을 시작할 수 있습니다.
            </p>
            <Button onClick={handleCreateLoop}>
              {currentMonthName} 루프 시작하기
            </Button>
          </Card>
        )}
      </section>

      {/* 다음 루프 카드 - 다음 루프가 있을 경우에만 표시 */}
      {nextLoop && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-bold">다음 루프</h2>
          <Card className="border-2 border-purple-200 bg-purple-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold">{nextLoop.title}</h3>
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 border-purple-200"
              >
                예약됨
              </Badge>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>🎁 보상: {nextLoop.reward}</span>
            </div>

            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>📅 시작 예정: {nextLoop.startDate}</span>
            </div>

            <div className="mb-4">
              <h4 className="mb-2 font-medium">중점 Areas</h4>
              <div className="flex flex-wrap gap-2">
                {nextLoop.areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full bg-purple-100 px-3 py-1 text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">프로젝트</h4>
              <p className="text-sm text-muted-foreground">
                🔗 프로젝트 {nextLoop.projects.length}개 연결됨
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link
                  href={`/loop/edit?month=${nextMonthYear}-${String(
                    nextMonth + 1
                  ).padStart(2, "0")}`}
                >
                  ✏️ 수정
                </Link>
              </Button>
              <Button variant="default" asChild>
                <Link href={`/loop/${nextLoop.id}`}>상세 보기</Link>
              </Button>
            </div>
          </Card>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">지난 루프</h2>
        {pastLoops.length > 0 ? (
          <div className="space-y-3">
            {pastLoops.map((loop) => (
              <Card
                key={loop.id}
                className={`p-4 ${
                  loop.completed ? "border-green-200" : "border-red-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{loop.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span>{loop.reward}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm text-muted-foreground">
                      {loop.date}
                    </span>
                    <span
                      className={`text-xs ${
                        loop.completed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {loop.completed ? "완료" : "미완료"}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/loop/${loop.id}`}>
                      상세 보기
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed p-6 text-center text-muted-foreground">
            아직 완료된 루프가 없습니다.
          </Card>
        )}
      </section>

      {/* 새 달 시작 시 자동 루프 생성 유도 다이얼로그 */}
      <Dialog open={showNewMonthDialog} onOpenChange={setShowNewMonthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새로운 달이 시작되었습니다!</DialogTitle>
            <DialogDescription>
              {currentMonthName} 루프를 생성하고 목표를 실행해 보세요.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowNewMonthDialog(false)}
              className="sm:order-1"
            >
              나중에
            </Button>
            <Button onClick={handleCreateLoop} className="sm:order-2">
              지금 만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
