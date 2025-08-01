"use client";

import { useState, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Star, Bookmark, Edit } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Retrospective } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { fetchRetrospectiveById } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 로딩 스켈레톤 컴포넌트
function ArchiveDetailSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function ArchiveDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("official");

  // Next.js 15에서는 params가 Promise이므로 unwrap
  const resolvedParams = use(params as unknown as Promise<{ id: string }>);
  const { id } = resolvedParams;

  // Firestore에서 실제 데이터 가져오기
  const {
    data: retrospective,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["retrospective", id],
    queryFn: () => fetchRetrospectiveById(id),
    enabled: !!id,
  });

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            회고를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!retrospective) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Alert>
          <AlertDescription>해당 회고를 찾을 수 없습니다.</AlertDescription>
        </Alert>
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

  const formatDate = (date: Date | string) => {
    if (typeof date === "string") {
      return new Date(date).toLocaleDateString("ko-KR");
    }
    return date.toLocaleDateString("ko-KR");
  };

  return (
    <Suspense fallback={<ArchiveDetailSkeleton />}>
      <div className="container max-w-md px-4 py-6 pb-20">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/para/archives/edit/${id}`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 회고 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            {retrospective.bookmarked && (
              <Bookmark className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            )}
            <h1 className="text-xl font-semibold">
              {retrospective.title || "회고"}
            </h1>
          </div>
          {retrospective.summary && (
            <p className="text-sm text-muted-foreground mb-4">
              {retrospective.summary}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>작성일: {formatDate(retrospective.createdAt)}</span>
            {retrospective.userRating && (
              <div className="flex items-center gap-1">
                <span>평점:</span>
                {renderStarRating(retrospective.userRating)}
              </div>
            )}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="official">공식 회고</TabsTrigger>
            <TabsTrigger value="freeform">자유 회고</TabsTrigger>
          </TabsList>

          <TabsContent value="official" className="space-y-4">
            {/* 루프용 필드들 */}
            {retrospective.bestMoment && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">가장 좋았던 순간</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.bestMoment}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.routineAdherence && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">루틴 준수율</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.routineAdherence}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.unexpectedObstacles && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">예상치 못한 장애물</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.unexpectedObstacles}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.nextLoopApplication && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">다음 루프 적용 방안</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextLoopApplication}
                  </p>
                </div>
              </Card>
            )}

            {/* 프로젝트용 필드들 */}
            {retrospective.goalAchieved && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">목표 달성 여부</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.goalAchieved}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.memorableTask && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">가장 기억에 남는 작업</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.memorableTask}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.stuckPoints && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">막힌 지점</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.stuckPoints}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.newLearnings && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">새로운 학습</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.newLearnings}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.nextProjectImprovements && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">다음 프로젝트 개선사항</h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextProjectImprovements}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="freeform">
            {retrospective.content ? (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">자유 회고</h3>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {retrospective.content}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  자유 회고가 없습니다.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
