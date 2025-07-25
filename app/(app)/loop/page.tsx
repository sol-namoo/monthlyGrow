"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  Star,
  Target,
  CalendarDays,
  Edit,
  Calendar,
  Sparkles,
  Zap,
  ChevronRight,
  BookOpen,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { OfficialRetrospective } from "@/types/retrospective";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoopPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "current";

  const [showNewMonthDialog, setShowNewMonthDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sortBy, setSortBy] = useState<"latest" | "userRating">("latest");

  const [currentLoop, setCurrentLoop] = useState(null);
  const [nextLoop, setNextLoop] = useState(null);
  const [pastLoops, setPastLoops] = useState([
    {
      id: 101,
      title: "5월 루프: 독서 습관 만들기",
      type: "loop",
      date: "2025.05.31",
      summary: "매일 30분 독서 목표 달성, 지식 확장 및 스트레스 해소에 도움",
      userRating: 5,
      bookmarked: true,
      createdAt: "2025-05-31T00:00:00Z",
      completionRate: 95,
      projectCount: 3,
      areas: ["자기계발", "지식"],
      reward: "새로운 책 5권 구매",
      startDate: "2025년 5월 1일",
      endDate: "2025년 5월 31일",
    },
    {
      id: 102,
      title: "4월 루프: 운동 루틴 정착",
      type: "loop",
      date: "2025.04.30",
      summary: "주 3회 운동 목표 달성, 체력 향상 및 활력 증진",
      userRating: 4,
      bookmarked: false,
      createdAt: "2025-04-30T00:00:00Z",
      completionRate: 80,
      projectCount: 2,
      areas: ["건강"],
      reward: "새 운동복 구매",
      startDate: "2025년 4월 1일",
      endDate: "2025년 4월 30일",
    },
    {
      id: 103,
      title: "3월 루프: 재테크 공부",
      type: "loop",
      date: "2025.03.31",
      summary: "기본 개념 학습 성공, 투자 계획 수립 시작",
      userRating: 3,
      bookmarked: true,
      createdAt: "2025-03-31T00:00:00Z",
      completionRate: 70,
      projectCount: 4,
      areas: ["재정"],
      reward: "주식 투자 시드머니",
      startDate: "2025년 3월 1일",
      endDate: "2025년 3월 31일",
    },
    {
      id: 104,
      title: "2월 루프: 글쓰기 연습",
      type: "loop",
      date: "2025.02.28",
      summary: "주 1회 블로그 글 작성 목표 미달성, 꾸준함 부족",
      userRating: 2,
      bookmarked: false,
      createdAt: "2025-02-28T00:00:00Z",
      completionRate: 40,
      projectCount: 1,
      areas: ["커리어"],
      reward: "새 노트북",
      startDate: "2025년 2월 1일",
      endDate: "2025년 2월 28일",
    },
  ]);

  const [sortedPastLoops, setSortedPastLoops] = useState([]);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "current");
  }, [searchParams]);

  useEffect(() => {
    setSortedPastLoops(
      [...pastLoops].sort((a, b) => {
        if (sortBy === "latest") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (sortBy === "userRating") {
          return (b.userRating || 0) - (a.userRating || 0);
        }
        return 0;
      })
    );
  }, [sortBy, pastLoops]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/loop?tab=${value}`, { scroll: false });
  };

  // 현재 날짜 정보
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const isFirstDayOfMonth = currentDate.getDate() === 1;

  // 다음 달 정보 계산
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthName = new Date(nextMonthYear, nextMonth, 1).toLocaleString(
    "ko-KR",
    { month: "long" }
  );
  const currentMonthName = currentDate.toLocaleString("ko-KR", {
    month: "long",
  });

  // 샘플 데이터 - 현재 월 루프는 완료된 상태, 다음 월 루프는 계획 중인 상태
  // currentLoop를 null로 설정하여 "이번 달 루프 시작하기" 버튼이 보이도록 테스트 가능
  const sampleCurrentLoop = {
    id: 1,
    title: `${currentMonthName} 루프: 건강한 개발자 되기`,
    reward: "새로운 기계식 키보드 구매",
    progress: 90, // 완료된 루프이므로 높은 진행률
    total: 100,
    startDate: `${currentYear}년 ${currentMonth + 1}월 1일`,
    endDate: `${currentYear}년 ${currentMonth + 1}월 30일`,
    daysLeft: 0, // 완료되었으므로 0
    areas: ["건강", "개발", "마음"],
    projects: [
      { id: 1, title: "매일 아침 30분 운동", progress: 28, total: 30 },
      { id: 2, title: "클린 코드 작성 연습", progress: 11, total: 12 },
      { id: 3, title: "주 2회 명상", progress: 19, total: 20 },
    ],
    completed: true, // 현재 루프는 완료된 상태
    reflection: {
      id: "loop-retro-current",
      loopId: "1",
      userId: "user-123",
      createdAt: new Date().toISOString(),
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
      title: `${currentMonthName} 루프: 건강한 개발자 되기 회고`,
      summary: "아침 운동 습관 성공, 출장 중 식단 관리 어려움",
    } as OfficialRetrospective,
    notes: [],
  };

  // nextLoop를 null로 설정하여 "다음 루프 미리 만들기" 버튼이 보이도록 테스트 가능
  const sampleNextLoop = null;
  // const sampleNextLoop = {
  //   id: 4,
  //   title: `${nextMonthName} 루프: 독서 습관`,
  //   reward: "새로운 책 5권 구매",
  //   progress: 0,
  //   total: 100,
  //   startDate: `${nextMonthYear}년 ${nextMonth + 1}월 1일`,
  //   endDate: `${nextMonthYear}년 ${nextMonth + 1}월 31일`,
  //   areas: ["자기계발", "지식"],
  //   projects: [
  //     { id: 4, title: "매일 30분 독서", progress: 0, total: 30 },
  //     { id: 5, title: "독서 노트 작성", progress: 0, total: 10 },
  //   ],
  //   completed: false, // 다음 루프는 아직 진행 중
  //   reflection: null, // 다음 루프는 아직 회고 없음
  //   notes: [],
  // }

  useEffect(() => {
    // 현재 루프가 없거나, 현재 루프가 있지만 아직 회고가 없는 경우에만 팝업 띄우기
    if (isFirstDayOfMonth && (!currentLoop || !currentLoop.reflection)) {
      const lastShown = localStorage.getItem("loopReminderLastShown");
      const today = currentDate.toISOString().split("T")[0];

      if (lastShown !== today) {
        setShowNewMonthDialog(true);
        localStorage.setItem("loopReminderLastShown", today);
      }
    }
  }, [isFirstDayOfMonth, currentDate]);

  // 루프 생성 핸들러 (Area 유무 확인 로직은 임시 제거, 실제 앱에서는 필요)
  const handleCreateLoop = (monthOffset: number) => {
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      1
    );
    const startDate = `${targetDate.getFullYear()}-${String(
      targetDate.getMonth() + 1
    ).padStart(2, "0")}-01`;
    router.push(`/loop/new?startDate=${startDate}`);
  };

  const renderStars = (rating: number | undefined) => {
    if (rating === undefined) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">월간 루프</h1>
        {/* 상단 '새 루프' 버튼 제거 */}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">현재 & 다음</TabsTrigger>
          <TabsTrigger value="past" className="relative">
            지난 루프
            {pastLoops.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs">
                {pastLoops.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6 space-y-6">
          {/* 현재 루프 섹션 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">현재 루프</h2>
              {currentLoop && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{currentLoop.completed ? "완료됨" : "진행 중"}</span>
                </div>
              )}
            </div>
            {currentLoop ? (
              <Card className="border-2 border-primary/20 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{currentLoop.title}</h3>
                  <div className="flex items-center gap-2">
                    {currentLoop.completed ? (
                      <Badge variant="default">완료</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/10">
                        D-{currentLoop.daysLeft}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/loop/edit/${currentLoop.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">루프 수정</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>보상: {currentLoop.reward}</span>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>달성률: {currentLoop.progress}%</span>
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
                  <h4 className="mb-2 font-medium">
                    프로젝트 ({currentLoop.projects.length}개)
                  </h4>
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
                  <Button variant="default" asChild>
                    <Link href={`/loop/${currentLoop.id}`}>상세 보기</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-primary/30 p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10 mb-6">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/20 p-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-primary">
                  이번 달 루프를 시작해보세요!
                </h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                  {currentMonthName} 루프를 통해 목표를 설정하고 꾸준히
                  실천해보세요. 매월 새로운 도전이 기다리고 있어요.
                </p>
                <Button onClick={() => handleCreateLoop(0)} className="mb-2">
                  <Sparkles className="mr-2 h-4 w-4" />
                  {currentMonthName} 루프 시작하기
                </Button>
                <p className="text-xs text-muted-foreground">
                  언제든지 시작할 수 있어요
                </p>
              </Card>
            )}
          </section>

          {/* 다음 루프 섹션 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">다음 루프</h2>
              {nextLoop && (
                <div className="flex items-center gap-1 text-sm text-purple-600">
                  <Calendar className="h-4 w-4" />
                  <span>예약됨</span>
                </div>
              )}
            </div>
            {nextLoop ? (
              <Card className="border-2 border-purple-200 bg-purple-50/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{nextLoop.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 border-purple-200"
                    >
                      예약됨
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 w-8 p-0"
                    >
                      <Link href={`/loop/edit/${nextLoop.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">루프 수정</span>
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span>🎁 보상: {nextLoop.reward}</span>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    📅 시작 예정: {nextLoop.startDate} ~ {nextLoop.endDate}
                  </span>
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
                  <h4 className="mb-2 font-medium">
                    프로젝트 ({nextLoop.projects.length}개)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    🔗 프로젝트 {nextLoop.projects.length}개 연결됨
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="default" asChild>
                    <Link href={`/loop/${nextLoop.id}`}>상세 보기</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-purple-300 p-8 text-center bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-purple-200 p-4">
                    <CalendarDays className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold text-purple-900">
                  다음 달을 미리 준비해보세요
                </h3>
                <p className="mb-6 text-sm text-purple-700 max-w-sm mx-auto">
                  {nextMonthName} 루프를 미리 계획하면 더 체계적이고 연속적인
                  성장을 만들어갈 수 있어요.
                </p>
                <Button
                  onClick={() => handleCreateLoop(1)}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent mb-2"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {nextMonthName} 루프 미리 만들기
                </Button>
                <p className="text-xs text-purple-600">
                  {nextMonthName} 1일에 자동으로 시작됩니다
                </p>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">지난 루프</h2>
              <span className="text-sm text-muted-foreground">
                {pastLoops.length}개
              </span>
            </div>

            {pastLoops.length > 0 ? (
              <>
                <div className="flex justify-end mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        정렬: {sortBy === "latest" ? "최신순" : "별점순"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("latest")}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        최신순
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("userRating")}>
                        <Star className="mr-2 h-4 w-4" />
                        별점순
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-3">
                  {sortedPastLoops.map((loop) => (
                    <Card
                      key={loop.id}
                      className={`p-4 ${
                        loop.completionRate >= 80
                          ? "border-green-200 bg-green-50/30"
                          : "border-red-200 bg-red-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{loop.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>보상: {loop.reward || "없음"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {loop.startDate} ~ {loop.endDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge
                            variant={
                              loop.completionRate >= 80
                                ? "default"
                                : "destructive"
                            }
                            className="mb-1"
                          >
                            {loop.completionRate >= 80 ? "완료" : "미완료"}
                          </Badge>
                          <span className="text-sm font-medium">
                            {loop.completionRate}%
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>달성률: {loop.completionRate}%</span>
                          <span>프로젝트 {loop.projectCount}개</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-value ${
                              loop.completionRate >= 80
                                ? "bg-green-500"
                                : "bg-red-400"
                            }`}
                            style={{ width: `${loop.completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {loop.areas.map((area) => (
                            <span
                              key={area}
                              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>

                      {loop.summary && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          회고 요약: {loop.summary}
                        </p>
                      )}

                      <div className="flex justify-end">
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
              </>
            ) : (
              <Card className="border-dashed p-8 text-center text-muted-foreground">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-muted/50 p-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  아직 완료된 루프가 없습니다
                </h3>
                <p className="text-sm mb-4">
                  첫 루프를 완료하면 여기에 회고와 함께 기록됩니다.
                </p>
                <div className="space-y-2 text-xs">
                  <p>💡 루프를 완료하면 성장 기록을 확인할 수 있어요</p>
                  <p>📊 달성률과 회고를 통해 지속적인 개선이 가능해요</p>
                </div>
              </Card>
            )}
          </section>
        </TabsContent>
      </Tabs>
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
            <Button onClick={() => handleCreateLoop(0)} className="sm:order-2">
              지금 만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
