"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Star,
  Bookmark,
  Clock,
  CalendarDays,
  Target,
  AlertCircle,
  Calendar,
  Zap,
  Gift,
  Edit,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/feedback/Loading";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loop, Retrospective } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function LoopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "current";

  const [showNewMonthDialog, setShowNewMonthDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "completionRate">(
    "latest"
  );

  const [currentLoop, setCurrentLoop] = useState<Loop | null>(null);
  const [nextLoop, setNextLoop] = useState<Loop | null>(null);
  const [pastLoops, setPastLoops] = useState<Loop[]>([
    {
      id: "101",
      userId: "user1",
      title: "5월 루프: 독서 습관 만들기",
      startDate: new Date("2025-05-01"),
      endDate: new Date("2025-05-31"),
      status: "ended",
      focusAreas: ["area1", "area2"],
      projectIds: ["project1", "project2", "project3"],
      reward: "새로운 책 5권 구매",
      createdAt: new Date("2025-05-01"),
      updatedAt: new Date("2025-05-31"),
      doneCount: 28,
      targetCount: 30,
      retrospective: {
        id: "retro1",
        userId: "user1",
        createdAt: new Date("2025-05-31"),
        updatedAt: new Date("2025-05-31"),
        content: "매일 30분 독서 목표 달성, 지식 확장 및 스트레스 해소에 도움",
        userRating: 5,
        bookmarked: true,
        title: "5월 루프: 독서 습관 만들기",
        summary: "매일 30분 독서 목표 달성, 지식 확장 및 스트레스 해소에 도움",
      },
    },
    {
      id: "102",
      userId: "user1",
      title: "4월 루프: 운동 루틴 정착",
      startDate: new Date("2025-04-01"),
      endDate: new Date("2025-04-30"),
      status: "ended",
      focusAreas: ["area3"],
      projectIds: ["project4", "project5"],
      reward: "새 운동복 구매",
      createdAt: new Date("2025-04-01"),
      updatedAt: new Date("2025-04-30"),
      doneCount: 12,
      targetCount: 15,
      retrospective: {
        id: "retro2",
        userId: "user1",
        createdAt: new Date("2025-04-30"),
        updatedAt: new Date("2025-04-30"),
        content: "주 3회 운동 목표 달성, 체력 향상 및 활력 증진",
        userRating: 4,
        bookmarked: false,
        title: "4월 루프: 운동 루틴 정착",
        summary: "주 3회 운동 목표 달성, 체력 향상 및 활력 증진",
      },
    },
    {
      id: "103",
      userId: "user1",
      title: "3월 루프: 재테크 공부",
      startDate: new Date("2025-03-01"),
      endDate: new Date("2025-03-31"),
      status: "ended",
      focusAreas: ["area4"],
      projectIds: ["project6", "project7", "project8", "project9"],
      reward: "주식 투자 시드머니",
      createdAt: new Date("2025-03-01"),
      updatedAt: new Date("2025-03-31"),
      doneCount: 21,
      targetCount: 30,
      retrospective: {
        id: "retro3",
        userId: "user1",
        createdAt: new Date("2025-03-31"),
        updatedAt: new Date("2025-03-31"),
        content: "기본 개념 학습 성공, 투자 계획 수립 시작",
        userRating: 3,
        bookmarked: true,
        title: "3월 루프: 재테크 공부",
        summary: "기본 개념 학습 성공, 투자 계획 수립 시작",
      },
    },
    {
      id: "104",
      userId: "user1",
      title: "2월 루프: 글쓰기 연습",
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-02-28"),
      status: "ended",
      focusAreas: ["area5"],
      projectIds: ["project10"],
      reward: "새 노트북",
      createdAt: new Date("2025-02-01"),
      updatedAt: new Date("2025-02-28"),
      doneCount: 4,
      targetCount: 10,
      retrospective: {
        id: "retro4",
        userId: "user1",
        createdAt: new Date("2025-02-28"),
        updatedAt: new Date("2025-02-28"),
        content: "주 1회 블로그 글 작성 목표 미달성, 꾸준함 부족",
        userRating: 2,
        bookmarked: false,
        title: "2월 루프: 글쓰기 연습",
        summary: "주 1회 블로그 글 작성 목표 미달성, 꾸준함 부족",
      },
    },
    {
      id: "105",
      userId: "user1",
      title: "1월 루프: 새해 다짐",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-31"),
      status: "ended",
      focusAreas: ["area1"],
      projectIds: ["project11", "project12"],
      reward: "새 다이어리",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-31"),
      doneCount: 18,
      targetCount: 30,
      retrospective: {
        id: "retro5",
        userId: "user1",
        createdAt: new Date("2025-01-31"),
        updatedAt: new Date("2025-01-31"),
        content: "새해 계획 수립 및 목표 설정",
        userRating: 3,
        bookmarked: false,
        title: "1월 루프: 새해 다짐",
        summary: "새해 계획 수립 및 목표 설정",
      },
    },
    {
      id: "106",
      userId: "user1",
      title: "12월 루프: 연말 정리",
      startDate: new Date("2024-12-01"),
      endDate: new Date("2024-12-31"),
      status: "ended",
      focusAreas: ["area1", "area6"],
      projectIds: ["project13", "project14", "project15"],
      reward: "연말 여행",
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-31"),
      doneCount: 25,
      targetCount: 30,
      retrospective: {
        id: "retro6",
        userId: "user1",
        createdAt: new Date("2024-12-31"),
        updatedAt: new Date("2024-12-31"),
        content: "한 해 마무리 및 다음 해 계획",
        userRating: 4,
        bookmarked: true,
        title: "12월 루프: 연말 정리",
        summary: "한 해 마무리 및 다음 해 계획",
      },
    },
  ]);

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

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "current");
  }, [searchParams]);

  // TanStack Query를 사용한 무한 스크롤
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["pastLoops", sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      // 실제 구현에서는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 시뮬레이션

      const sortedLoops = [...pastLoops].sort((a, b) => {
        if (sortBy === "latest") {
          return b.endDate.getTime() - a.endDate.getTime();
        } else if (sortBy === "oldest") {
          return a.endDate.getTime() - b.endDate.getTime();
        } else if (sortBy === "completionRate") {
          return getCompletionRate(b) - getCompletionRate(a);
        }
        return 0;
      });

      const pageSize = 10;
      const start = pageParam * pageSize;
      const end = start + pageSize;
      const pageData = sortedLoops.slice(start, end);

      return {
        data: pageData,
        nextPage: end < sortedLoops.length ? pageParam + 1 : undefined,
        hasNextPage: end < sortedLoops.length,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });

  // 모든 페이지의 데이터를 평탄화
  const allPastLoops = infiniteData?.pages.flatMap((page) => page.data) || [];

  // Intersection Observer 설정 (TanStack Query와 함께)
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

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
  const sampleCurrentLoop: Loop | null = null;
  // const sampleCurrentLoop: Loop = {
  //   id: "current-1",
  //   userId: "user1",
  //   title: `${currentMonthName} 루프: 건강한 개발자 되기`,
  //   startDate: new Date(currentYear, currentMonth, 1),
  //   endDate: new Date(currentYear, currentMonth, 30),
  //   status: "ended",
  //   focusAreas: ["area1", "area2", "area3"],
  //   projectIds: ["project1", "project2", "project3"],
  //   reward: "새로운 기계식 키보드 구매",
  //   createdAt: new Date(currentYear, currentMonth, 1),
  //   updatedAt: new Date(currentYear, currentMonth, 30),
  //   doneCount: 27,
  //   targetCount: 30,
  //   retrospective: {
  //     id: "retro-current",
  //     userId: "user1",
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //     content: "전반적으로 만족스러운 루프였습니다. 건강이 많이 좋아진 것을 느낍니다.",
  //     bestMoment: "매일 아침 운동을 꾸준히 했던 순간",
  //     routineAdherence: "계획한 루틴의 90%를 지켰습니다. 특히 아침 운동은 꾸준히 했습니다.",
  //     unexpectedObstacles: "갑작스러운 출장으로 식단 관리가 어려웠습니다.",
  //     nextLoopApplication: "다음 루프에서는 출장 시에도 식단을 유지할 수 있는 계획을 세울 것입니다.",
  //     userRating: 4,
  //     bookmarked: true,
  //     title: `${currentMonthName} 루프: 건강한 개발자 되기 회고`,
  //     summary: "아침 운동 습관 성공, 출장 중 식단 관리 어려움",
  //   },
  // };

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
    if (isFirstDayOfMonth && (!currentLoop || !currentLoop.retrospective)) {
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
                  <span>
                    {currentLoop.status === "ended" ? "완료됨" : "진행 중"}
                  </span>
                </div>
              )}
            </div>
            {currentLoop ? (
              <Card className="border-2 border-primary/20 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{currentLoop.title}</h3>
                  <div className="flex items-center gap-2">
                    {currentLoop.status === "ended" ? (
                      <Badge variant="default">완료</Badge>
                    ) : (
                      <Badge variant="secondary">
                        D-
                        {Math.max(
                          0,
                          Math.ceil(
                            (currentLoop.endDate.getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}
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
                  <Gift className="h-4 w-4 text-purple-500" />
                  <span>보상: {currentLoop.reward}</span>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex justify-between text-sm">
                    <span>달성률: {getCompletionRate(currentLoop)}%</span>
                    <span>
                      {currentLoop.doneCount}/{currentLoop.targetCount}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-value"
                      style={{ width: `${getCompletionRate(currentLoop)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {getFormattedDateShort(currentLoop.startDate)} ~{" "}
                    {getFormattedDateShort(currentLoop.endDate)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="mb-2 font-medium">중점 Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentLoop.focusAreas.map((areaId) => (
                      <span
                        key={areaId}
                        className="rounded-full bg-secondary px-3 py-1 text-xs"
                      >
                        {areaId}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">
                    프로젝트 ({currentLoop.projectIds.length}개)
                  </h4>
                  <div className="space-y-2">
                    {currentLoop.projectIds.map((projectId) => (
                      <div
                        key={projectId}
                        className="rounded-lg bg-secondary p-3 text-sm"
                      >
                        <div className="mb-1 flex justify-between">
                          <span>프로젝트 {projectId}</span>
                          <span>진행 중</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{
                              width: `60%`,
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
                    📅 시작 예정: {getFormattedDateShort(nextLoop.startDate)} ~{" "}
                    {getFormattedDateShort(nextLoop.endDate)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="mb-2 font-medium">중점 Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {nextLoop.focusAreas.map((areaId) => (
                      <span
                        key={areaId}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs"
                      >
                        {areaId}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">
                    프로젝트 ({nextLoop.projectIds.length}개)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    🔗 프로젝트 {nextLoop.projectIds.length}개 연결됨
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

            {allPastLoops.length > 0 ? (
              <>
                <div className="flex justify-end mb-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        {sortBy === "latest" ? (
                          <CalendarDays className="mr-2 h-4 w-4" />
                        ) : sortBy === "oldest" ? (
                          <Calendar className="mr-2 h-4 w-4" />
                        ) : (
                          <Target className="mr-2 h-4 w-4" />
                        )}
                        {sortBy === "latest"
                          ? "최신순"
                          : sortBy === "oldest"
                          ? "생성순"
                          : "달성률순"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy("latest")}>
                        <CalendarDays className="mr-2 h-4 w-4" />
                        최신순
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                        <Calendar className="mr-2 h-4 w-4" />
                        생성순
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("completionRate")}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        달성률순
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-3">
                  {allPastLoops.map((loop) => (
                    <Card
                      key={loop.id}
                      className={`p-4 ${
                        getCompletionRate(loop) >= 80
                          ? "border-green-200 bg-green-50/30"
                          : "border-red-200 bg-red-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{loop.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Gift className="h-3 w-3 text-purple-500" />
                            <span>보상: {loop.reward || "없음"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {getFormattedDateShort(loop.startDate)} ~{" "}
                              {getFormattedDateShort(loop.endDate)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              getCompletionRate(loop) >= 80
                                ? "border-green-300 text-green-700"
                                : "border-red-300 text-red-700"
                            }`}
                          >
                            {getCompletionRate(loop)}%
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <Link href={`/loop/${loop.id}`}>
                              <ChevronRight className="h-4 w-4" />
                              <span className="sr-only">루프 상세 보기</span>
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {loop.retrospective?.summary || "회고가 없습니다."}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {renderStars(loop.retrospective?.userRating)}
                            <span className="text-xs text-muted-foreground">
                              {loop.retrospective?.userRating || 0}/5
                            </span>
                          </div>
                          {loop.retrospective?.bookmarked && (
                            <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>프로젝트 {getProjectCount(loop)}개</span>
                          <span>•</span>
                          <span>{getFormattedDateShort(loop.endDate)}</span>
                        </div>
                      </div>
                    </Card>
                  ))}

                  {/* 무한 스크롤 로딩 상태 */}
                  {isLoading && (
                    <div className="text-center py-6">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm text-muted-foreground">
                          더 많은 루프를 불러오는 중...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 무한 스크롤 트리거 */}
                  {hasNextPage && <div ref={loadMoreRef} className="h-4" />}

                  {/* 더 이상 로드할 데이터가 없을 때 */}
                  {!hasNextPage && allPastLoops.length > 0 && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground">
                        모든 루프를 불러왔습니다.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-6 text-center border-dashed">
                <p className="text-muted-foreground">
                  아직 지난 루프가 없어요.
                </p>
              </Card>
            )}
          </section>
        </TabsContent>
      </Tabs>
      {/* 새 달 시작 시 자동 루프 생성 유도 다이얼로그 */}
      <Dialog open={showNewMonthDialog} onOpenChange={setShowNewMonthDialog}>
        <DialogContent className="w-full max-w-none max-h-none rounded-none border-0 m-0 p-2 sm:max-w-lg sm:max-h-[90vh] sm:rounded-lg sm:border sm:mx-2 sm:my-4">
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

export default function LoopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <LoopPageContent />
    </Suspense>
  );
}
