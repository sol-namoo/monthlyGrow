"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Edit, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { RatingDisplay } from "@/components/ui/rating-display";

interface RetrospectiveContentProps {
  retrospective: any;
  canEdit: boolean;
  onEdit: () => void;
  onWrite: () => void;
  isPast?: boolean;
  type?: "monthly" | "project";
}

export function RetrospectiveContent({
  retrospective,
  canEdit,
  onEdit,
  onWrite,
  isPast = false,
  type = "monthly",
}: RetrospectiveContentProps) {
  const { translate } = useLanguage();

  if (!retrospective) {
    return (
      <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="mb-4">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {translate("monthlyDetail.retrospective.noContent")}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {translate("monthlyDetail.retrospective.noRetrospectiveDescription")}
        </p>
        {canEdit && (
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={onWrite}
          >
            <Plus className="mr-2 h-4 w-4" />
            {translate("monthlyDetail.retrospective.writeTitle")}
          </Button>
        )}
      </Card>
    );
  }

  return (
    <>
      {" "}
      <Card className="p-6 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <h3 className="font-bold">회고</h3>
          </div>
          <div className="flex items-center gap-2">
            <RatingDisplay
              rating={retrospective.userRating || 0}
              bookmarked={retrospective.bookmarked}
              size="sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          {retrospective.bestMoment && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                가장 기억에 남는 순간
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {retrospective.bestMoment}
              </p>
            </div>
          )}

          {retrospective.routineAdherence && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {translate(
                  "monthlyDetail.retrospective.routineAdherence.label"
                )}
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {retrospective.routineAdherence}
              </p>
            </div>
          )}

          {retrospective.unexpectedObstacles && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {translate(
                  "monthlyDetail.retrospective.unexpectedObstacles.label"
                )}
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {retrospective.unexpectedObstacles}
              </p>
            </div>
          )}

          {retrospective.keyResultsReview && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {translate("monthlyDetail.retrospectiveForm.keyResultsReview")}
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {retrospective.keyResultsReview}
              </p>
            </div>
          )}

          {(retrospective.nextMonthlyApplication ||
            retrospective.nextProjectImprovements) && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {type === "project"
                  ? translate(
                      "monthlyDetail.retrospectiveForm.project.nextProjectImprovements"
                    )
                  : translate(
                      "monthlyDetail.retrospective.nextMonthlyApplication.label"
                    )}
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {type === "project"
                  ? retrospective.nextProjectImprovements
                  : retrospective.nextMonthlyApplication}
              </p>
            </div>
          )}

          {retrospective.content && (
            <div>
              <h4 className="font-semibold text-sm mb-2">
                {translate("monthlyDetail.retrospectiveForm.freeformContent")}
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                {retrospective.content}
              </p>
            </div>
          )}

          {/* Key Results 실패 이유 표시 */}
          {retrospective.failedKeyResults &&
            retrospective.failedKeyResults.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-700 dark:text-red-300">
                  {translate(
                    "monthlyDetail.retrospectiveForm.failedKeyResults"
                  )}{" "}
                  분석
                </h4>
                <div className="space-y-2">
                  {retrospective.failedKeyResults.map(
                    (failedKr: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-red-800 dark:text-red-200">
                            {failedKr.keyResultTitle}
                          </h5>
                          <Badge variant="destructive" className="text-xs">
                            {translate(
                              "monthlyDetail.retrospectiveForm.status.failed"
                            )}
                          </Badge>
                        </div>
                        <p className="text-xs text-red-600 dark:text-red-300">
                          {translate(
                            "monthlyDetail.retrospective.failureReason"
                          )}
                          :{" "}
                          {translate(
                            `monthlyDetail.retrospectiveForm.failedReasonOptions.${failedKr.reason}`
                          )}
                          {failedKr.customReason &&
                            ` - ${failedKr.customReason}`}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </Card>
      {/* 회고 수정 버튼 */}
      {canEdit && (
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={onEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          {translate("monthlyDetail.retrospective.editTitle")}
        </Button>
      )}
    </>
  );
}
