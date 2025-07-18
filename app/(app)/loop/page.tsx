"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useLoops from "../../../lib/query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Loop, Project } from "../../../lib/types";
import { fetchProjectsByLoopId } from "../../../lib/firebase";

export default function LoopPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { data: loops, isLoading, isError } = useLoops();
  const [showNewMonthDialog, setShowNewMonthDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("current");
  const [currentLoop, setCurrentLoop] = useState<Loop | null>(null);
  const [nextLoop, setNextLoop] = useState<Loop | null>(null);
  const [pastLoops, setPastLoops] = useState<Loop[]>([]);
  const [currentLoopProjects, setCurrentLoopProjects] = useState<Project[]>([]);
  const [nextLoopProjects, setNextLoopProjects] = useState<Project[]>([]);
  const [pastLoopsProjects, setPastLoopsProjects] = useState<{
    [loopId: string]: Project[];
  }>({});

  // 날짜 정보
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const isFirstDayOfMonth = currentDate.getDate() === 1;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthName = new Date(nextMonthYear, nextMonth, 1).toLocaleString(
    "ko-KR",
    { month: "long" }
  );
  const currentMonthName = currentDate.toLocaleString("ko-KR", {
    month: "long",
  });

  // 루프 데이터 분류 및 프로젝트 패칭
  useEffect(() => {
    if (loops) {
      const now = new Date();
      const current =
        loops.find(
          (loop) =>
            now.getTime() >= loop.startDate.getTime() &&
            now.getTime() <= loop.endDate.getTime()
        ) || null;
      const next =
        loops.find((loop) => now.getTime() < loop.startDate.getTime()) || null;
      const past =
        loops.filter((loop) => now.getTime() > loop.endDate.getTime()) || [];
      setCurrentLoop(current);
      setNextLoop(next);
      setPastLoops(past);

      // 프로젝트 패칭
      if (current) {
        fetchProjectsByLoopId(current.id).then(setCurrentLoopProjects);
      } else {
        setCurrentLoopProjects([]);
      }
      if (next) {
        fetchProjectsByLoopId(next.id).then(setNextLoopProjects);
      } else {
        setNextLoopProjects([]);
      }
      // 과거 루프별 프로젝트
      const fetchPast = async () => {
        const result: { [loopId: string]: Project[] } = {};
        for (const loop of past) {
          result[loop.id] = await fetchProjectsByLoopId(loop.id);
        }
        setPastLoopsProjects(result);
      };
      if (past.length > 0) fetchPast();
      else setPastLoopsProjects({});
    }
  }, [loops]);

  // 새 달 시작 시 자동 루프 생성 유도 팝업
  useEffect(() => {
    if (isFirstDayOfMonth && !currentLoop) {
      const lastShown = localStorage.getItem("loopReminderLastShown");
      const today = currentDate.toISOString().split("T")[0];
      if (lastShown !== today) {
        setShowNewMonthDialog(true);
        localStorage.setItem("loopReminderLastShown", today);
      }
    }
  }, [isFirstDayOfMonth, currentLoop, currentDate]);

  // 루프 생성 핸들러
  const handleCreateCurrentLoop = () => {
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-01`;
    router.push(`/loop/new?startDate=${startDate}`);
  };

  const handleCreateNextLoop = () => {
    const startDate = `${nextMonthYear}-${String(nextMonth + 1).padStart(
      2,
      "0"
    )}-01`;
    router.push(`/loop/new?startDate=${startDate}`);
  };

  // 현재 루프 렌더링
  const renderCurrentLoopSection = () => {
    if (currentLoop) {
      // daysLeft 계산
      const now = new Date();
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (currentLoop.endDate.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      // 진행률 계산
      const progress = currentLoop.targetCount
        ? Math.round((currentLoop.doneCount / currentLoop.targetCount) * 100)
        : 0;
      const total = currentLoop.targetCount;
      return (
        <Card className="border-2 border-primary/20 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{currentLoop.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                D-{daysLeft}
              </Badge>
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
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
              <span>진행률: {progress}%</span>
              <span>
                {currentLoop.doneCount}/{total}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-value"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              {currentLoop.startDate.toLocaleDateString()} ~{" "}
              {currentLoop.endDate.toLocaleDateString()}
            </span>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 font-medium">중점 Areas</h4>
            <div className="flex flex-wrap gap-2">
              {currentLoop.areas?.map((area) => (
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
              프로젝트 ({currentLoopProjects.length}개)
            </h4>
            <div className="space-y-2">
              {currentLoopProjects.map((project) => (
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
      );
    }

    return (
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
          {currentMonthName} 루프를 통해 목표를 설정하고 꾸준히 실천해보세요.
        </p>
        <Button onClick={handleCreateCurrentLoop} className="mb-2">
          <Sparkles className="mr-2 h-4 w-4" />
          {currentMonthName} 루프 시작하기
        </Button>
      </Card>
    );
  };

  // 다음 루프 렌더링
  const renderNextLoopSection = () => {
    if (nextLoop) {
      return (
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
              <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                <Link
                  href={`/loop/edit?month=${nextMonthYear}-${String(
                    nextMonth + 1
                  ).padStart(2, "0")}`}
                >
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
            <span>📅 시작 예정: {nextLoop.startDate.toLocaleDateString()}</span>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 font-medium">중점 Areas</h4>
            <div className="flex flex-wrap gap-2">
              {nextLoop.areas?.map((area) => (
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
              프로젝트 ({nextLoopProjects.length}개)
            </h4>
            <p className="text-sm text-muted-foreground">
              🔗 프로젝트 {nextLoopProjects.length}개 연결됨
            </p>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" asChild>
              <Link
                href={`/loop/edit?month=${nextMonthYear}-${String(
                  nextMonth + 1
                ).padStart(2, "0")}`}
              >
                수정
              </Link>
            </Button>
            <Button variant="default" asChild>
              <Link href={`/loop/${nextLoop.id}`}>상세 보기</Link>
            </Button>
          </div>
        </Card>
      );
    }

    return (
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
          {nextMonthName} 루프를 미리 계획하면 더 체계적인 성장을 만들어갈 수
          있어요.
        </p>
        <Button
          onClick={handleCreateNextLoop}
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
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error occurred.</div>;
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold mb-2">월간 루프</h1>
        <p className="text-muted-foreground">목표 달성을 위한 월간 계획</p>
      </div>

      <Tabs
        defaultValue="current"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">현재 & 다음</TabsTrigger>
          <TabsTrigger value="history">지난 루프</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6 space-y-6">
          {/* 현재 루프 섹션 */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">현재 루프</h2>
              {currentLoop && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>진행 중</span>
                </div>
              )}
            </div>
            {renderCurrentLoopSection()}
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
            {renderNextLoopSection()}
          </section>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">지난 루프</h2>
              <span className="text-sm text-muted-foreground">
                {pastLoops.length}개
              </span>
            </div>

            {pastLoops.length > 0 ? (
              <div className="space-y-3">
                {pastLoops.map((loop) => {
                  const projects = pastLoopsProjects[loop.id] || [];
                  const completionRate = loop.targetCount
                    ? Math.round((loop.doneCount / loop.targetCount) * 100)
                    : 0;
                  return (
                    <Card
                      key={loop.id}
                      className={`p-4 ${
                        loop.completed
                          ? "border-green-200 bg-green-50/30"
                          : "border-red-200 bg-red-50/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{loop.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>{loop.reward}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {loop.startDate.toLocaleDateString()} ~{" "}
                              {loop.endDate.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge
                            variant={loop.completed ? "default" : "destructive"}
                            className="mb-1"
                          >
                            {loop.completed ? "완료" : "미완료"}
                          </Badge>
                          <span className="text-sm font-medium">
                            {completionRate}%
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span>달성률: {completionRate}%</span>
                          <span>프로젝트 {projects.length}개</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className={`progress-value ${
                              loop.completed ? "bg-green-500" : "bg-red-400"
                            }`}
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {loop.areas?.map((area) => (
                            <span
                              key={area}
                              className="rounded-full bg-secondary px-2 py-0.5 text-xs"
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/loop/${loop.id}`}>
                            {loop.completed ? "회고 보기" : "상세 보기"}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed p-6 text-center text-muted-foreground">
                <div className="mb-2 flex justify-center">
                  <Target className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p>아직 완료된 루프가 없습니다.</p>
                <p className="text-xs mt-1">
                  첫 루프를 완료하면 여기에 표시됩니다.
                </p>
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
            <Button onClick={handleCreateCurrentLoop} className="sm:order-2">
              지금 만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
