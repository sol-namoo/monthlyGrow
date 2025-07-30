"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterAvatar } from "@/components/character-avatar";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { LoopComparisonChart } from "@/components/widgets/loop-comparison-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Award,
  Calendar,
  Clock,
  Target,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { fetchAllLoopsByUserId, fetchAllAreasByUserId } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoopStatus } from "@/lib/utils";

export default function DashboardPage() {
  const [user, userLoading] = useAuthState(auth);

  // Firestore에서 데이터 가져오기
  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => fetchAllLoopsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 로딩 상태
  if (userLoading || loopsLoading || areasLoading) {
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

  // 현재 루프와 과거 루프 분리 (날짜 기반)
  const currentLoop = loops.find(
    (loop) => getLoopStatus(loop) === "in_progress"
  );
  const pastLoops = loops.filter((loop) => getLoopStatus(loop) === "ended");

  // 계산된 데이터
  const completionRate = currentLoop
    ? Math.round((currentLoop.doneCount / currentLoop.targetCount) * 100)
    : 0;
  const previousLoopCompletion =
    pastLoops.length > 0
      ? Math.round((pastLoops[0].doneCount / pastLoops[0].targetCount) * 100)
      : 0;
  const totalFocusTime = loops.reduce(
    (total, loop) => total + (loop.doneCount || 0),
    0
  );
  const previousFocusTime =
    pastLoops.length > 0 ? pastLoops[0].doneCount || 0 : 0;

  const stats = {
    completionRate,
    previousLoopCompletion,
    changeRate:
      pastLoops.length > 0
        ? Math.round(
            ((completionRate - previousLoopCompletion) /
              previousLoopCompletion) *
              100
          )
        : 0,
    totalLoops: loops.length,
    rewardsReceived: pastLoops.filter((loop) => loop.reward).length,
    totalFocusTime,
    previousFocusTime,
    focusTimeChange:
      pastLoops.length > 0
        ? Math.round(
            ((totalFocusTime - previousFocusTime) / previousFocusTime) * 100
          )
        : 0,
  };

  const areaActivityData = areas.map((area) => ({
    name: area.name,
    value: Math.floor(Math.random() * 50) + 10, // 임시 데이터
  }));

  const loopComparisonData = pastLoops.slice(-3).map((loop, index) => ({
    name: `${loop.startDate.getMonth() + 1}월`,
    completion: Math.round((loop.doneCount / loop.targetCount) * 100),
    focusHours: loop.doneCount || 0,
  }));

  return (
    <div className="container max-w-md px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">대시보드</h1>

      <div className="mb-6 flex items-center gap-4 rounded-lg border bg-card p-4 shadow-sm">
        <CharacterAvatar level={5} />
        <div>
          <h2 className="text-lg font-bold">안녕하세요, 루퍼님!</h2>
          <p className="text-sm text-muted-foreground">
            이번 루프 달성률이{" "}
            <span className="font-medium text-primary">65%</span>에 도달했어요.
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>전월 대비 {stats.changeRate}% 향상</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">요약 보기</TabsTrigger>
          <TabsTrigger value="activity">활동 대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">
                {currentLoop?.title || "현재 루프 없음"}
              </h3>
              <Badge variant="outline">
                D-
                {currentLoop
                  ? Math.max(
                      0,
                      Math.ceil(
                        (currentLoop.endDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0}
              </Badge>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex justify-between text-sm">
                <span>달성률: {stats.completionRate}%</span>
                <span>
                  {currentLoop?.doneCount || 0}/{currentLoop?.targetCount || 0}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${stats.completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {currentLoop
                  ? `${currentLoop.startDate.toLocaleDateString(
                      "ko-KR"
                    )} ~ ${currentLoop.endDate.toLocaleDateString("ko-KR")}`
                  : "기간 없음"}
              </span>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/loop">
                  자세히 보기
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="누적 루프"
              value={stats.totalLoops}
              description="완료한 루프 수"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="받은 보상"
              value={stats.rewardsReceived}
              description="달성한 보상 수"
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-3 font-bold">다음 루프 준비</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">6월 루프 시작까지</p>
                <p className="text-xs text-muted-foreground">
                  예정 프로젝트 2개
                </p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium">
                D-
                {currentLoop
                  ? Math.max(
                      0,
                      Math.ceil(
                        (currentLoop.endDate.getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )
                  : 0}
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="outline" size="sm" asChild>
                <Link href="/loop/new">준비하기</Link>
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="집중 시간"
              value={`${stats.totalFocusTime}시간`}
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.focusTimeChange}% ↑</span>
                </div>
              }
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="완료율"
              value={`${stats.completionRate}%`}
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stats.changeRate}% ↑</span>
                </div>
              }
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">Area 활동 비중</h3>
            <div className="h-64">
              <AreaActivityChart data={areaActivityData} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">루프 비교</h3>
            <div className="h-64">
              <LoopComparisonChart data={loopComparisonData} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
