"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Star, Bookmark } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OfficialRetrospective } from "@/types/retrospective";

export default function ArchiveDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState("official");

  // 샘플 데이터 - 실제로는 ID를 기반으로 데이터를 가져와야 함
  const retrospectiveData: OfficialRetrospective[] = [
    {
      id: "official-retro-1",
      loopId: "1",
      userId: "user-123",
      createdAt: "2025-07-01T09:00:00Z",
      type: "loop",
      title: "6월 루프: 건강한 개발자 되기 회고",
      summary: "아침 운동 습관 성공, 출장 중 식단 관리 어려움",
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
    },
    {
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
    },
  ];

  const retrospective = retrospectiveData.find((r) => r.id === params.id);

  if (!retrospective) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20 text-center">
        <p className="text-muted-foreground">회고를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const renderStarRating = (rating: number | undefined) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-6 w-6 ${
              star <= (rating || 0)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/para">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">회고 상세</h1>
      </div>

      {/* 제목 + 요약 */}
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold">{retrospective.title}</h2>
          <div className="flex items-center gap-2 text-lg font-bold text-primary">
            {retrospective.bookmarked && (
              <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            )}
            {renderStarRating(retrospective.userRating)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {retrospective.summary}
        </p>
        <p className="text-xs text-muted-foreground">
          작성일:{" "}
          {new Date(retrospective.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </Card>

      {/* 탭 영역 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="official">공식 회고</TabsTrigger>
          <TabsTrigger value="freeform">자유 노트</TabsTrigger>
        </TabsList>

        {/* 공식 회고 탭 */}
        <TabsContent value="official" className="mt-4">
          <div className="space-y-4">
            {retrospective.type === "loop" && (
              <>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    이번 루프에서 가장 좋았던 순간은?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.bestMoment || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    계획한 루틴을 얼마나 지켰나요?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.routineAdherence || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    예기치 못한 방해 요소는 있었나요?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.unexpectedObstacles || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    다음 루프에 적용할 점은?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextLoopApplication || "내용 없음"}
                  </p>
                </Card>
              </>
            )}

            {retrospective.type === "project" && (
              <>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">목표를 달성했나요?</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.goalAchieved || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    가장 인상 깊었던 작업은?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.memorableTask || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    막혔던 지점은 있었나요?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.stuckPoints || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">새롭게 배운 점은?</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.newLearnings || "내용 없음"}
                  </p>
                </Card>
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">
                    다음 프로젝트에서 개선할 점은?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextProjectImprovements || "내용 없음"}
                  </p>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        {/* 자유 노트 탭 */}
        <TabsContent value="freeform" className="mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">자유 노트 내용</h3>
            <p className="text-sm text-muted-foreground">
              {retrospective.content || "작성된 자유 노트가 없습니다."}
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href="/para">돌아가기</Link>
        </Button>
      </div>
    </div>
  );
}
