"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageSquare,
  Target,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { fetchSingleArchive } from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { getMonthlyStatus } from "@/lib/utils";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Monthly } from "@/lib/types";
import Link from "next/link";

interface RetrospectiveTabProps {
  monthly: Monthly;
  onOpenRetrospectiveModal: () => void;
}

export function RetrospectiveTab({
  monthly,
  onOpenRetrospectiveModal,
}: RetrospectiveTabProps) {
  const { translate } = useLanguage();
  const [user] = useAuthState(auth);

  // 먼슬리 관련 아카이브 조회 (회고 하나만)
  const { data: monthlyRetrospective, isLoading: retrospectiveLoading } =
    useQuery({
      queryKey: ["monthly-retrospective", monthly.id],
      queryFn: async () => {
        const result = await fetchSingleArchive(
          user?.uid || "",
          monthly.id,
          "monthly_retrospective"
        );
        return result;
      },
      enabled: !!user?.uid && !!monthly.id,
    });

  const status = getMonthlyStatus(monthly);
  // 회고/노트 수정 가능 여부: 진행중이거나 완료된 먼슬리에서만 가능
  const canEditRetrospectiveAndNote =
    status === "in_progress" || status === "ended";

  // Key Results 완료/미완료 분류
  const completedKeyResults = monthly.keyResults.filter((kr) => kr.isCompleted);
  const failedKeyResults = monthly.keyResults.filter((kr) => !kr.isCompleted);

  if (retrospectiveLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">
          회고 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  if (status === "planned") {
    return (
      <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="mb-4">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {translate("monthlyDetail.retrospective.notStarted.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("monthlyDetail.retrospective.notStarted.description")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Key Results 현황 */}
      <Card className="p-6 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4" />
          <h3 className="font-bold">핵심 지표 현황</h3>
        </div>

        <div className="space-y-4">
          {/* 완료된 Key Results */}
          {completedKeyResults.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                달성한 핵심 지표 ({completedKeyResults.length}/
                {monthly.keyResults.length})
              </h4>
              <div className="space-y-2">
                {completedKeyResults.map((kr) => (
                  <div
                    key={kr.id}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {kr.title}
                    </p>
                    {kr.description && (
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        {kr.description}
                      </p>
                    )}
                    {kr.targetCount && kr.completedCount && (
                      <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                        목표: {kr.targetCount}회 → 달성: {kr.completedCount}회
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 미완료된 Key Results */}
          {failedKeyResults.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                달성하지 못한 핵심 지표 ({failedKeyResults.length}/
                {monthly.keyResults.length})
              </h4>
              <div className="space-y-2">
                {failedKeyResults.map((kr) => (
                  <div
                    key={kr.id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {kr.title}
                    </p>
                    {kr.description && (
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        {kr.description}
                      </p>
                    )}
                    {kr.targetCount && kr.completedCount && (
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        목표: {kr.targetCount}회 → 달성: {kr.completedCount}회
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Results가 없는 경우 */}
          {monthly.keyResults.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                설정된 핵심 지표가 없습니다.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 회고 목록 */}
      <div className="space-y-4">
        {monthlyRetrospective ? (
          <Card className="p-6 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <h3 className="font-bold">회고</h3>
              </div>
              <div className="flex items-center gap-2">
                <RatingDisplay
                  rating={monthlyRetrospective.userRating || 0}
                  bookmarked={monthlyRetrospective.bookmarked}
                  size="sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {monthlyRetrospective.bestMoment && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    가장 기억에 남는 순간
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.bestMoment}
                  </p>
                </div>
              )}

              {monthlyRetrospective.routineAdherence && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">루틴 준수율</h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.routineAdherence}
                  </p>
                </div>
              )}

              {monthlyRetrospective.unexpectedObstacles && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    예상치 못한 장애물
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.unexpectedObstacles}
                  </p>
                </div>
              )}

              {monthlyRetrospective.nextMonthlyApplication && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    다음 달 적용 사항
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.nextMonthlyApplication}
                  </p>
                </div>
              )}

              {monthlyRetrospective.stuckPoints && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">막힌 지점</h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.stuckPoints}
                  </p>
                </div>
              )}

              {monthlyRetrospective.newLearnings && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">새로운 학습</h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.newLearnings}
                  </p>
                </div>
              )}

              {monthlyRetrospective.nextProjectImprovements && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    다음 프로젝트 개선사항
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.nextProjectImprovements}
                  </p>
                </div>
              )}

              {monthlyRetrospective.memorableTask && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    가장 기억에 남는 작업
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                    {monthlyRetrospective.memorableTask}
                  </p>
                </div>
              )}

              {/* 회고에서 작성한 Key Results 실패 이유 (기존 데이터가 있는 경우) */}
              {monthlyRetrospective.keyResultsReview?.failedKeyResults &&
                monthlyRetrospective.keyResultsReview.failedKeyResults.length >
                  0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">
                      핵심 지표 실패 이유 분석
                    </h4>
                    <div className="space-y-2">
                      {monthlyRetrospective.keyResultsReview.failedKeyResults.map(
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
                )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              {canEditRetrospectiveAndNote && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenRetrospectiveModal}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {translate("monthlyDetail.retrospective.editTitle")}
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link href={`/para/archives/${monthlyRetrospective.id}`}>
                  {translate("monthlyDetail.retrospective.viewDetail")}
                </Link>
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
            <div className="mb-4">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {translate("monthlyDetail.retrospective.noContent")}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {status === "ended"
                ? translate("monthlyDetail.retrospective.description")
                : translate(
                    "monthlyDetail.retrospective.inProgressDescription"
                  )}
            </p>
            {canEditRetrospectiveAndNote && (
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={onOpenRetrospectiveModal}
              >
                <Plus className="mr-2 h-4 w-4" />
                {translate("monthlyDetail.retrospective.writeTitle")}
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
