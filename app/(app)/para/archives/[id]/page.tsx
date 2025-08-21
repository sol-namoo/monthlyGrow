"use client";

import { useState, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Star, Bookmark, Edit } from "lucide-react";
import { RatingDisplay } from "@/components/ui/rating-display";
import Link from "next/link";
import type { Retrospective } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUnifiedArchiveById,
  fetchMonthlyById,
  fetchProjectById,
  updateUnifiedArchive,
  createUnifiedArchive,
  fetchSingleArchive,
} from "@/lib/firebase/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, generateNoteTitle, getMonthlyStatus } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";

import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";

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
  const { translate } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user] = useAuthState(auth);

  // 모달 상태
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // Next.js 15에서는 params가 Promise이므로 unwrap
  const resolvedParams = use(params as unknown as Promise<{ id: string }>);
  const { id } = resolvedParams;

  // Firestore에서 통합 아카이브 데이터 가져오기
  const {
    data: archive,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["unified-archive", id],
    queryFn: () => fetchUnifiedArchiveById(id),
    enabled: !!id,
  });

  // 먼슬리 관련 아카이브인 경우 먼슬리 정보를 가져오기
  const {
    data: monthly,
    isLoading: monthlyLoading,
    error: monthlyError,
  } = useQuery({
    queryKey: ["monthly", archive?.parentId],
    queryFn: () => fetchMonthlyById(archive!.parentId!),
    enabled:
      !!archive?.parentId &&
      (archive.type === "monthly_retrospective" ||
        archive.type === "monthly_note"),
  });

  // 먼슬리 상태 확인 (회고/노트 수정 가능 여부 판단용)
  const monthlyStatus = monthly ? getMonthlyStatus(monthly) : null;
  const canEditRetrospectiveAndNote =
    monthlyStatus === "in_progress" || monthlyStatus === "ended";

  // 프로젝트 관련 아카이브인 경우 프로젝트 정보를 가져오기
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
  } = useQuery({
    queryKey: ["project", archive?.parentId],
    queryFn: () => fetchProjectById(archive!.parentId!),
    enabled:
      !!archive?.parentId &&
      (archive.type === "project_retrospective" ||
        archive.type === "project_note"),
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
  if (!archive) {
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
            {/* 먼슬리 관련 아카이브이고 수정 가능한 경우에만 수정 버튼 표시 */}
            {archive?.type.includes("monthly") &&
              canEditRetrospectiveAndNote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (archive.type.includes("retrospective")) {
                      setShowRetrospectiveModal(true);
                    } else if (archive.type.includes("note")) {
                      setShowNoteForm(true);
                    }
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            {/* 프로젝트 관련 아카이브는 항상 수정 가능 (프로젝트 상태와 무관) */}
            {archive?.type.includes("project") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (archive.type.includes("retrospective")) {
                    setShowRetrospectiveModal(true);
                  } else if (archive.type.includes("note")) {
                    setShowNoteForm(true);
                  }
                }}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 아카이브 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-xl font-semibold">
              {archive.title ||
                (archive.type.includes("retrospective") ? "회고" : "노트")}
            </h1>
            <RatingDisplay
              rating={archive.userRating || 0}
              bookmarked={archive.bookmarked}
              size="md"
              showBookmark={true}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {translate("para.paraArchiveDetail.common.createdAt")}:{" "}
              {formatDate(archive.createdAt)}
            </span>
          </div>
        </div>

        {/* 연관된 먼슬리/프로젝트 링크 */}
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">
                  {archive.type.includes("monthly")
                    ? translate("para.paraArchiveDetail.relatedItem.monthly")
                    : translate("para.paraArchiveDetail.relatedItem.project")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {archive.type.includes("monthly")
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
                    archive.type.includes("monthly")
                      ? `/monthly/${archive.parentId}`
                      : `/para/projects/${archive.parentId}`
                  }
                >
                  {archive.type.includes("monthly")
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

        {/* 아카이브 컨텐츠 */}
        <div className="space-y-4">
          {/* 회고 내용 */}
          {archive.type.includes("retrospective") && (
            <>
              {/* 먼슬리용 필드들 */}
              {archive.bestMoment && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.retrospective.bestMoment"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.bestMoment}
                    </p>
                  </div>
                </Card>
              )}

              {archive.routineAdherence && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.retrospective.routineAdherence"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.routineAdherence}
                    </p>
                  </div>
                </Card>
              )}

              {archive.unexpectedObstacles && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.retrospective.unexpectedObstacles"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.unexpectedObstacles}
                    </p>
                  </div>
                </Card>
              )}

              {archive.nextMonthlyApplication && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.retrospective.nextMonthlyApplication"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.nextMonthlyApplication}
                    </p>
                  </div>
                </Card>
              )}

              {/* 프로젝트용 필드들 */}
              {archive.goalAchieved && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.projectRetrospective.goalAchieved"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.goalAchieved}
                    </p>
                  </div>
                </Card>
              )}

              {archive.memorableTask && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.projectRetrospective.memorableTask"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.memorableTask}
                    </p>
                  </div>
                </Card>
              )}

              {archive.stuckPoints && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.projectRetrospective.stuckPoints"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.stuckPoints}
                    </p>
                  </div>
                </Card>
              )}

              {archive.newLearnings && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.projectRetrospective.newLearnings"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.newLearnings}
                    </p>
                  </div>
                </Card>
              )}

              {archive.nextProjectImprovements && (
                <Card>
                  <div className="p-4">
                    <h3 className="font-medium mb-2">
                      {translate(
                        "para.paraArchiveDetail.projectRetrospective.nextProjectImprovements"
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {archive.nextProjectImprovements}
                    </p>
                  </div>
                </Card>
              )}

              {/* 먼슬리 회고에서 작성한 Key Results 실패 이유 */}
              {archive.type.includes("monthly_retrospective") &&
                archive.keyResultsReview?.failedKeyResults &&
                archive.keyResultsReview.failedKeyResults.length > 0 && (
                  <Card>
                    <div className="p-4">
                      <h3 className="font-medium mb-2">
                        핵심 지표 실패 이유 분석
                      </h3>
                      <div className="space-y-2">
                        {archive.keyResultsReview.failedKeyResults.map(
                          (kr: any, index: number) => (
                            <div
                              key={index}
                              className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                            >
                              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                {kr.keyResultTitle}
                              </p>
                              <p className="text-xs text-orange-600 dark:text-orange-300 mt-1">
                                {kr.customReason || kr.reason}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </Card>
                )}
            </>
          )}

          {/* 노트 내용 */}
          {archive.type.includes("note") && (
            <Card>
              <div className="p-4">
                <h3 className="font-medium mb-2">
                  {translate("para.paraArchiveDetail.retrospective.note")}
                </h3>
                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {archive.content}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 회고 작성 모달 */}
        {showRetrospectiveModal && archive && (
          <RetrospectiveForm
            type={archive.type.includes("monthly") ? "monthly" : "project"}
            title={archive.title || ""}
            keyResults={monthly?.keyResults || []} // 먼슬리 정보가 있으면 keyResults 전달
            existingData={archive} // 기존 데이터 전달
            onClose={() => setShowRetrospectiveModal(false)}
            onSave={async (data) => {
              try {
                // 기존 아카이브 업데이트
                await updateUnifiedArchive(archive.id, {
                  title: data.title || archive.title || "",
                  content: data.content || "",
                  userRating: data.userRating,
                  bookmarked: data.bookmarked,
                  bestMoment: data.bestMoment,
                  routineAdherence: data.routineAdherence,
                  unexpectedObstacles: data.unexpectedObstacles,
                  nextMonthlyApplication: data.nextMonthlyApplication,
                });

                toast({
                  title: "회고 저장 완료",
                  description: "회고가 성공적으로 저장되었습니다.",
                });
                setShowRetrospectiveModal(false);

                // 데이터 새로고침
                queryClient.invalidateQueries({
                  queryKey: ["unified-archive", id],
                });
              } catch (error) {
                console.error("회고 저장 실패:", error);
                toast({
                  title: "회고 저장 실패",
                  description: "회고 저장 중 오류가 발생했습니다.",
                  variant: "destructive",
                });
              }
            }}
          />
        )}

        {/* 노트 편집 모달 */}
        {showNoteForm && archive && (
          <NoteForm
            type={archive.type.includes("monthly") ? "monthly" : "project"}
            parent={{
              id: archive.parentId,
              userId: archive.userId,
              objective: archive.title,
              title: archive.title,
              note: archive.content,
            }}
            onClose={() => setShowNoteForm(false)}
            onSave={() => {
              // 노트 저장 후 데이터 새로고침
              queryClient.invalidateQueries({
                queryKey: ["unified-archive", id],
              });
            }}
          />
        )}
      </div>
    </Suspense>
  );
}
