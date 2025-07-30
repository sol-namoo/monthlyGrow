"use client";

import type React from "react";

import { useState, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// 로딩 스켈레톤 컴포넌트
function EditLoopSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Skeleton className="h-8 w-8 mr-2" />
        <Skeleton className="h-6 w-32" />
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function EditLoopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: loopId } = use(params);

  // 현재 날짜 정보
  const currentDate = new Date();

  // 샘플 데이터 - 실제로는 API에서 가져와야 함
  const [loop, setLoop] = useState({
    id: loopId,
    title: "5월 루프: 건강 관리",
    reward: "새 운동화 구매",
    startDate: "2025-05-01",
    endDate: "2025-05-31",
    areas: ["건강", "개발", "마음"],
    projects: [
      { id: 1, title: "아침 운동 습관화", progress: 18, total: 30 },
      { id: 2, title: "식단 관리 앱 개발", progress: 7, total: 12 },
      { id: 3, title: "명상 습관 만들기", progress: 10, total: 20 },
    ],
    createdAt: "2025-04-25T10:30:00Z", // 루프 생성 날짜
  });

  // 수정 가능한 필드 상태
  const [title, setTitle] = useState(loop.title);
  const [reward, setReward] = useState(loop.reward);

  // 루프 생성 후 3일 이내인지 확인
  const isWithinThreeDays = () => {
    const createdDate = new Date(loop.createdAt);
    const threeDaysAfter = new Date(createdDate);
    threeDaysAfter.setDate(createdDate.getDate() + 3);
    return currentDate <= threeDaysAfter;
  };

  // 루프 시작일이 지났는지 확인
  const hasLoopStarted = () => {
    const startDate = new Date(loop.startDate);
    return currentDate >= startDate;
  };

  // 수정 가능 여부 확인
  const canEditAreas = isWithinThreeDays() && hasLoopStarted();

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기서 데이터 처리 로직 구현
    router.push("/loop");
  };

  return (
    <Suspense fallback={<EditLoopSkeleton />}>
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">루프 수정</h1>
        </div>

        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>루프 수정 정책</AlertTitle>
          <AlertDescription>
            루프 제목과 보상은 언제든지 수정할 수 있습니다. 중점 Areas는 루프
            시작 후 3일 이내에만 수정 가능합니다. 시작일과 종료일은 수정할 수
            없습니다.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <Card className="mb-6 p-4">
            <div className="mb-4">
              <Label htmlFor="title">루프 제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="reward">달성 보상</Label>
              <Input
                id="reward"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="mt-1"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                루프를 완료했을 때 자신에게 줄 보상을 설정하세요.
              </p>
            </div>

            <div className="mb-4">
              <Label>루프 기간</Label>
              <div className="mt-1 flex items-center gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(loop.startDate).toLocaleDateString("ko-KR")} ~{" "}
                  {new Date(loop.endDate).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                루프 기간은 수정할 수 없습니다.
              </p>
            </div>
          </Card>

          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">중점 Areas</h2>
              {!canEditAreas && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800"
                >
                  수정 불가
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {loop.areas.map((area, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={!canEditAreas ? "opacity-70" : ""}
                >
                  {area}
                </Badge>
              ))}
            </div>

            {!canEditAreas && (
              <p className="mt-3 text-xs text-muted-foreground">
                중점 Areas는 루프 시작 후 3일 이내에만 수정할 수 있습니다.
              </p>
            )}
          </Card>

          <Card className="mb-6 p-4">
            <h2 className="mb-4 text-lg font-semibold">연결된 프로젝트</h2>

            <div className="space-y-2">
              {loop.projects.map((project) => (
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

            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full bg-transparent"
              >
                <Link href={`/loop/${loopId}/add-project`}>
                  프로젝트 추가/제거
                </Link>
              </Button>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1">
              변경사항 저장
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <Link href="/loop">취소</Link>
            </Button>
          </div>
        </form>
      </div>
    </Suspense>
  );
}
