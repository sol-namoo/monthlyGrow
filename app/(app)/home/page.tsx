"use client";

import { useState } from "react";
import { CharacterAvatar } from "@/components/character-avatar";
import { ProgressCard } from "@/components/progress-card";
import { StatsCard } from "@/components/stats-card";
import { AreaActivityChart } from "@/components/area-activity-chart";
import { LoopComparisonChart } from "@/components/loop-comparison-chart";
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
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  // 샘플 데이터
  const currentLoop = {
    title: "5월 루프: 건강 관리",
    reward: "새 운동화 구매",
    progress: 65,
    total: 100,
    endDate: "2025년 5월 31일",
    changeRate: 18,
    daysLeft: 12,
    startDate: "2025년 5월 1일",
  };

  const projects = [
    {
      id: 1,
      title: "아침 운동 습관화",
      progress: 18,
      total: 30,
      area: "건강",
      addedMidway: false,
    },
    {
      id: 2,
      title: "식단 관리 앱 개발",
      progress: 7,
      total: 12,
      area: "개발",
      addedMidway: false,
    },
    {
      id: 3,
      title: "명상 습관 만들기",
      progress: 10,
      total: 20,
      area: "마음",
      addedMidway: false,
    },
    {
      id: 4,
      title: "건강 블로그 작성",
      progress: 2,
      total: 8,
      area: "커리어",
      addedMidway: true,
    },
  ];

  const stats = {
    completionRate: 65,
    previousLoopCompletion: 55,
    changeRate: 18,
    totalLoops: 5,
    rewardsReceived: 4,
    totalFocusTime: 42,
    previousFocusTime: 35,
    focusTimeChange: 20,
  };

  const areaActivityData = [
    { name: "건강", value: 45 },
    { name: "개발", value: 30 },
    { name: "마음", value: 15 },
    { name: "기타", value: 10 },
  ];

  const loopComparisonData = [
    { name: "3월", completion: 40, focusHours: 25 },
    { name: "4월", completion: 55, focusHours: 35 },
    { name: "5월", completion: 65, focusHours: 42 },
  ];

  // 프로젝트 표시 개수 제한 (정책: 3개 이하면 모두 표시, 4개 이상이면 3개만 표시 + 더보기 버튼)
  const [showAllProjects, setShowAllProjects] = useState(false);
  const displayedProjects = showAllProjects ? projects : projects.slice(0, 3);
  const hasMoreProjects = projects.length > 3;

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center gap-4">
        <CharacterAvatar level={5} />
        <div>
          <h1 className="text-2xl font-bold">안녕하세요, 루퍼님!</h1>
          <p className="text-muted-foreground">오늘도 성장하는 하루 되세요.</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp className="h-3 w-3" />
            <span>전월 대비 {stats.changeRate}% 향상</span>
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
                D-{currentLoop.daysLeft}
              </div>
              <h3 className="mb-2 text-lg font-bold">{currentLoop.title}</h3>
              <div className="mb-4 flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>보상: {currentLoop.reward}</span>
              </div>
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
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {currentLoop.startDate} ~ {currentLoop.endDate}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                <TrendingUp className="h-3 w-3" />
                <span>전월 대비 {currentLoop.changeRate}% 향상</span>
              </div>
            </Card>
          </section>

          <section>
            <div className="mb-4 flex items-center">
              <h2 className="text-xl font-bold">현재 루프 프로젝트</h2>
            </div>

            <div className="space-y-3">
              {displayedProjects.map((project) => (
                <ProgressCard
                  key={project.id}
                  title={project.title}
                  progress={project.progress}
                  total={project.total}
                >
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Area: {project.area}
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
                  더보기 ({projects.length - 3}개)
                </Button>
              )}

              {/* 홈 화면에서는 프로젝트 생성 버튼 제거 (정책에 따라) */}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4 space-y-6">
        <div className="rounded-lg border bg-muted/20 p-4 mb-4">
            <h2 className="text-lg font-bold mb-2">📊 연간 활동 통계</h2>
            <p className="text-sm text-muted-foreground">올해 설정한 목표와 달성한 성과를 확인하세요.</p>
          </div>
         
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
