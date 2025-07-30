"use client";

import { useState } from "react";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressCard } from "@/components/widgets/progress-card";
import { StatsCard } from "@/components/widgets/stats-card";
import { AreaActivityChart } from "@/components/widgets/area-activity-chart";
import { LoopComparisonChart } from "@/components/widgets/loop-comparison-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Star,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  Target,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useQuery } from "@tanstack/react-query";
import {
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  fetchAllLoopsByUserId,
} from "@/lib/firebase";
import { getLoopStatus } from "@/lib/utils";

export default function HomePage() {
  const [user, loading] = useAuthState(auth);
  const [showAllProjects, setShowAllProjects] = useState(false);

  // Firestore에서 직접 데이터 가져오기
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => (user ? fetchAllAreasByUserId(user.uid) : []),
    enabled: !!user,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => (user ? fetchAllProjectsByUserId(user.uid) : []),
    enabled: !!user,
  });

  const { data: loops = [], isLoading: loopsLoading } = useQuery({
    queryKey: ["loops", user?.uid],
    queryFn: () => (user ? fetchAllLoopsByUserId(user.uid) : []),
    enabled: !!user,
  });

  const isLoading = loading || projectsLoading || loopsLoading;

  if (loading || isLoading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인이 필요합니다.</div>;

  // 현재 진행 중인 루프를 날짜 기반으로 선택
  const currentLoop =
    loops && loops.length > 0
      ? loops.find((loop) => getLoopStatus(loop) === "in_progress") || null
      : null;
  // 현재 루프에 연결된 프로젝트만 필터링
  const currentLoopProjects =
    currentLoop && projects
      ? projects.filter((p) => currentLoop.projectIds?.includes(p.id))
      : [];

  // progress, total, daysLeft, changeRate 등 계산
  const progress =
    currentLoop && currentLoop.targetCount > 0
      ? Math.round((currentLoop.doneCount / currentLoop.targetCount) * 100)
      : 0;
  const total = currentLoop?.targetCount || 0;
  const startDate = currentLoop?.startDate
    ? new Date(currentLoop.startDate).toLocaleDateString()
    : "-";
  const endDate = currentLoop?.endDate
    ? new Date(currentLoop.endDate).toLocaleDateString()
    : "-";
  const today = new Date();
  const daysLeft = currentLoop?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(currentLoop.endDate).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;
  const changeRate = 0; // 추후 통계 fetch로 대체

  // stats, areaActivityData, loopComparisonData 등은 추후 Firestore 통계 데이터 fetch로 대체 가능

  // 프로젝트 표시 개수 제한 (정책: 3개 이하면 모두 표시, 4개 이상이면 3개만 표시 + 더보기 버튼)
  const displayedProjects = showAllProjects
    ? currentLoopProjects
    : currentLoopProjects.slice(0, 3);
  const hasMoreProjects = currentLoopProjects.length > 3;

  // areaId → area명 매핑 함수
  const getAreaName = (areaId?: string) =>
    areaId ? areas.find((a) => a.id === areaId)?.name || "-" : "-";

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <CharacterAvatar level={5} />
        <div>
          <h1 className="text-2xl font-bold">
            안녕하세요,{" "}
            {user?.displayName || user?.email?.split("@")[0] || "루퍼"}님!
          </h1>
          <p className="text-muted-foreground">오늘도 성장하는 하루 되세요.</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>전월 대비 {changeRate}% 향상</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="summary" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">요약 보기</TabsTrigger>
          <TabsTrigger value="dashboard">활동 대시보드</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-6">
          <section>
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">현재 루프</h2>
            </div>

            <Card className="relative overflow-hidden border-2 border-primary/20 p-4">
              <div className="absolute right-0 top-0 rounded-bl-lg bg-primary/10 px-2 py-1 text-xs">
                D-{daysLeft}
              </div>
              <h3 className="mb-2 text-lg font-bold">
                {currentLoop?.title || "루프 없음"}
              </h3>
              <div className="mb-4 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>🎁 보상: {currentLoop?.reward || "없음"}</span>
              </div>
              <div className="mb-1 flex justify-between text-sm">
                <span>진행률: {progress}%</span>
                <span>
                  {currentLoop?.doneCount || 0}/{total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {startDate} ~ {endDate}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>전월 대비 {changeRate}% 향상</span>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">현재 루프 프로젝트</h2>
            </div>

            <div className="space-y-3">
              {currentLoopProjects.length === 0 ? (
                <Card className="p-4 border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-muted-foreground">
                      프로젝트 없음
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {currentLoop ? "루프 연결됨" : "루프 없음"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {currentLoop
                      ? "현재 루프에 연결된 프로젝트가 없습니다."
                      : "현재 진행 중인 루프가 없습니다."}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Area: -</span>
                      <span>•</span>
                      <span>-</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ) : (
                <>
                  {displayedProjects.map((project) => (
                    <ProgressCard
                      key={project.id}
                      title={project.title}
                      progress={project.progress}
                      total={project.total}
                    >
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Area: {getAreaName(project.areaId)}
                        </span>
                        {project.addedMidway ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 text-xs"
                          >
                            🔥 루프 중 추가됨
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-primary/10 text-xs"
                          >
                            현재 루프 연결됨
                          </Badge>
                        )}
                      </div>
                    </ProgressCard>
                  ))}

                  {!showAllProjects && hasMoreProjects && (
                    <Button
                      variant="outline"
                      className="mt-2 w-full"
                      onClick={() => setShowAllProjects(true)}
                    >
                      더보기 ({currentLoopProjects.length - 3}개)
                    </Button>
                  )}
                </>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
          <div className="rounded-lg border bg-muted/20 p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">📊 연간 활동 통계</h2>
            <p className="text-sm text-muted-foreground">
              올해 설정한 목표와 달성한 성과를 확인하세요.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="집중 시간"
              value={`0시간`}
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>0% ↑</span>
                </div>
              }
              icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="완료율"
              value={`0%`}
              description={
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span>0% ↑</span>
                </div>
              }
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <StatsCard
              title="누적 루프"
              value={0}
              description="완료한 루프 수"
              icon={<Target className="h-4 w-4 text-muted-foreground" />}
            />
            <StatsCard
              title="받은 보상"
              value={0}
              description="달성한 보상 수"
              icon={<Award className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">Area 활동 비중</h3>
            <div className="h-64">
              <AreaActivityChart data={[]} />
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="mb-4 font-bold">루프 비교</h3>
            <div className="h-64">
              <LoopComparisonChart data={[]} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
