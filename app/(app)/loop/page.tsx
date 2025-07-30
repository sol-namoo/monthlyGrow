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
  Plus,
  Archive,
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
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { Loop, Retrospective } from "@/lib/types";
import { fetchAllLoopsByUserId } from "@/lib/firebase";
import { formatDate, formatDateNumeric, getLoopStatus } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

function LoopPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "current";
  const [user, userLoading] = useAuthState(auth);

  const [showNewMonthDialog, setShowNewMonthDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "completionRate">(
    "latest"
  );

  // useEffect를 useQuery 전에 호출
  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "current");
  }, [searchParams]);

  // Firestore에서 데이터 가져오기
  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 로딩 상태
  if (userLoading || loopsLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // 현재 루프와 과거 루프 분리 (유틸리티 함수 사용)
  const currentLoop =
    loops.find((loop) => getLoopStatus(loop) === "in_progress") || null;
  const pastLoops = loops.filter((loop) => getLoopStatus(loop) === "ended");

  // 다음 루프 (미리 만들어둔 루프)
  const nextLoop =
    loops.find((loop) => getLoopStatus(loop) === "planned") || null;

  // 계산된 값들을 위한 헬퍼 함수들
  const getCompletionRate = (loop: Loop) => {
    return loop.targetCount > 0
      ? Math.round((loop.doneCount / loop.targetCount) * 100)
      : 0;
  };

  const getProjectCount = (loop: Loop) => {
    return loop.projectIds?.length || 0;
  };

  const handleTabChange = (value: string) => {
    router.push(`/loop?tab=${value}`, { scroll: false });
  };

  const handleCreateLoop = (monthOffset: number) => {
    // TODO: 실제 루프 생성 로직 구현
    setShowNewMonthDialog(false);
  };

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
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
                    {getLoopStatus(currentLoop) === "ended"
                      ? "완료됨"
                      : "진행 중"}
                  </span>
                </div>
              )}
            </div>
            {currentLoop ? (
              <Card className="border-2 border-primary/20 p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{currentLoop.title}</h3>
                  <div className="flex items-center gap-2">
                    {getLoopStatus(currentLoop) === "ended" ? (
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
                    {formatDateNumeric(currentLoop.startDate)} ~{" "}
                    {formatDateNumeric(currentLoop.endDate)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="mb-2 font-medium">중점 Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentLoop.focusAreas?.map((areaId) => (
                      <span
                        key={areaId}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs"
                      >
                        {areaId}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 font-medium">
                    프로젝트 ({getProjectCount(currentLoop)}개)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    🔗 프로젝트 {getProjectCount(currentLoop)}개 연결됨
                  </p>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="default" asChild>
                    <Link href={`/loop/${currentLoop.id}`}>상세 보기</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="mb-2 text-lg font-bold">현재 루프가 없어요</h3>
                <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
                  새로운 월간 루프를 만들어서 체계적인 성장을 시작해보세요.
                </p>
                <Button onClick={() => setShowNewMonthDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />새 루프 만들기
                </Button>
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
                    📅 시작 예정: {formatDateNumeric(nextLoop.startDate)} ~{" "}
                    {formatDateNumeric(nextLoop.endDate)}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="mb-2 font-medium">중점 Areas</h4>
                  <div className="flex flex-wrap gap-2">
                    {nextLoop.focusAreas?.map((areaId) => (
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
                    프로젝트 ({getProjectCount(nextLoop)}개)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    🔗 프로젝트 {getProjectCount(nextLoop)}개 연결됨
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
                  다음 달 루프를 미리 계획하면 더 체계적이고 연속적인 성장을
                  만들어갈 수 있어요.
                </p>
                <Button
                  onClick={() => handleCreateLoop(1)}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent mb-2"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  다음 달 루프 만들기
                </Button>
              </Card>
            )}
          </section>
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">지난 루프</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortBy === "latest" ? (
                    <CalendarDays className="mr-2 h-4 w-4" />
                  ) : sortBy === "oldest" ? (
                    <Clock className="mr-2 h-4 w-4" />
                  ) : (
                    <Target className="mr-2 h-4 w-4" />
                  )}
                  {sortBy === "latest"
                    ? "최신순"
                    : sortBy === "oldest"
                    ? "오래된순"
                    : "달성률순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("latest")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                  <Clock className="mr-2 h-4 w-4" />
                  오래된순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("completionRate")}>
                  <Target className="mr-2 h-4 w-4" />
                  달성률순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {pastLoops.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Archive className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">지난 루프가 없어요</h3>
              <p className="text-muted-foreground mb-4">
                완료된 루프들이 여기에 표시됩니다.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastLoops
                .sort((a, b) => {
                  if (sortBy === "latest") {
                    return b.endDate.getTime() - a.endDate.getTime();
                  } else if (sortBy === "oldest") {
                    return a.endDate.getTime() - b.endDate.getTime();
                  } else if (sortBy === "completionRate") {
                    return getCompletionRate(b) - getCompletionRate(a);
                  }
                  return 0;
                })
                .map((loop) => (
                  <Card key={loop.id} className="p-4">
                    <Link href={`/loop/${loop.id}`} className="block">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold">{loop.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            완료
                          </Badge>
                          {loop.retrospective?.bookmarked && (
                            <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-sm">
                          <span>달성률: {getCompletionRate(loop)}%</span>
                          <span>
                            {loop.doneCount}/{loop.targetCount}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-value"
                            style={{ width: `${getCompletionRate(loop)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatDateNumeric(loop.startDate)} ~{" "}
                          {formatDateNumeric(loop.endDate)}
                        </span>
                      </div>

                      {loop.retrospective && (
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {loop.retrospective.summary}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            {renderStars(loop.retrospective.userRating)}
                            <span className="text-xs text-muted-foreground">
                              {loop.retrospective.userRating}/5
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>프로젝트 {getProjectCount(loop)}개</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 새 루프 만들기 다이얼로그 */}
      <Dialog open={showNewMonthDialog} onOpenChange={setShowNewMonthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 루프 만들기</DialogTitle>
            <DialogDescription>
              새로운 월간 루프를 만들어보세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => handleCreateLoop(1)}
              className="w-full justify-start"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              다음 달 루프 만들기
            </Button>
            <Button
              onClick={() => handleCreateLoop(2)}
              className="w-full justify-start"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              다다음 달 루프 만들기
            </Button>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewMonthDialog(false)}
            >
              취소
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
