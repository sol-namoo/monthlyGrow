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
import { fetchRetrospectiveById, fetchMonthlyById } from "@/lib/firebase/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { translate } = useLanguage();

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

  // 먼슬리 회고인 경우 먼슬리 정보를 가져오기
  const {
    data: monthly,
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useQuery({
    queryKey: ["monthly", retrospective?.monthlyId],
    queryFn: () => fetchMonthlyById(retrospective!.monthlyId!),
    enabled: !!retrospective?.monthlyId,
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
            {translate("para.archives.detail.error.loadError")}
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
          <AlertDescription>
            {translate("para.archives.detail.error.notFound")}
          </AlertDescription>
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
            <span>
              {translate("para.paraArchiveDetail.common.createdAt")}:{" "}
              {formatDate(retrospective.createdAt)}
            </span>
            {retrospective.userRating && (
              <div className="flex items-center gap-1">
                <span>
                  {translate("para.paraArchiveDetail.common.rating")}:
                </span>
                {renderStarRating(retrospective.userRating)}
              </div>
            )}
          </div>
        </div>

        {/* 연관된 먼슬리/프로젝트 링크 */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">
                  {retrospective.monthlyId
                    ? translate("para.paraArchiveDetail.relatedItem.monthly")
                    : translate("para.paraArchiveDetail.relatedItem.project")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {retrospective.monthlyId
                    ? translate(
                        "para.paraArchiveDetail.relatedItem.monthlyDescription"
                      )
                    : translate(
                        "para.paraArchiveDetail.relatedItem.projectDescription"
                      )}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={
                    retrospective.monthlyId
                      ? `/monthly/${retrospective.monthlyId}`
                      : `/para/projects/${retrospective.projectId}`
                  }
                >
                  {retrospective.monthlyId
                    ? translate(
                        "para.paraArchiveDetail.relatedItem.viewMonthly"
                      )
                    : translate(
                        "para.paraArchiveDetail.relatedItem.viewProject"
                      )}
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* 탭 컨텐츠 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="official">
              {translate("para.paraArchiveDetail.tabs.retrospective")}
            </TabsTrigger>
            <TabsTrigger value="freeform">
              {translate("para.paraArchiveDetail.tabs.note")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="official" className="space-y-4">
            {/* 먼슬리용 필드들 */}
            {retrospective.bestMoment && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.retrospective.bestMoment"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.bestMoment}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.routineAdherence && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.retrospective.routineAdherence"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.routineAdherence}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.unexpectedObstacles && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.retrospective.unexpectedObstacles"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.unexpectedObstacles}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.nextMonthlyApplication && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.retrospective.nextMonthlyApplication"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextMonthlyApplication}
                  </p>
                </div>
              </Card>
            )}

            {/* 프로젝트용 필드들 */}
            {retrospective.goalAchieved && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.projectRetrospective.goalAchieved"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.goalAchieved}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.memorableTask && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.projectRetrospective.memorableTask"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.memorableTask}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.stuckPoints && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.projectRetrospective.stuckPoints"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.stuckPoints}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.newLearnings && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.projectRetrospective.newLearnings"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.newLearnings}
                  </p>
                </div>
              </Card>
            )}

            {retrospective.nextProjectImprovements && (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate(
                      "para.paraArchiveDetail.projectRetrospective.nextProjectImprovements"
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {retrospective.nextProjectImprovements}
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="freeform">
            {monthlyLoading ? (
              <div className="text-center py-8">
                <Skeleton className="h-4 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ) : monthlyError ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {translate("para.paraArchiveDetail.common.error")}
                </p>
              </div>
            ) : monthly?.note ? (
              <Card>
                <div className="p-4">
                  <h3 className="font-medium mb-2">
                    {translate("para.paraArchiveDetail.retrospective.note")}
                  </h3>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {monthly.note}
                  </div>
                </div>
              </Card>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {translate("para.paraArchiveDetail.notes.noContent")}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  );
}
