"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Target } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMonthly } from "@/lib/firebase/index";
import { Monthly } from "@/lib/types";

interface KeyResultsTabProps {
  monthly: Monthly;
}

export function KeyResultsTab({ monthly }: KeyResultsTabProps) {
  const { translate } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Key Result 업데이트 뮤테이션
  const updateKeyResultMutation = useMutation({
    mutationFn: async ({
      keyResultIndex,
      isCompleted,
    }: {
      keyResultIndex: number;
      isCompleted: boolean;
    }) => {
      const updatedKeyResults = [...monthly.keyResults];
      updatedKeyResults[keyResultIndex] = {
        ...updatedKeyResults[keyResultIndex],
        isCompleted,
      };

      await updateMonthly(monthly.id, {
        keyResults: updatedKeyResults,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly", monthly.id] });
      toast({
        title: translate("monthlyDetail.keyResults.updateSuccess"),
        description: translate(
          "monthlyDetail.keyResults.updateSuccessDescription"
        ),
      });
    },
    onError: (error) => {
      console.error("Key Result 업데이트 실패:", error);
      toast({
        title: translate("monthlyDetail.keyResults.updateError"),
        description: translate(
          "monthlyDetail.keyResults.updateErrorDescription"
        ),
        variant: "destructive",
      });
    },
  });

  const handleKeyResultToggle = (index: number, isCompleted: boolean) => {
    updateKeyResultMutation.mutate({ keyResultIndex: index, isCompleted });
  };

  const keyResultsCompleted =
    monthly.keyResults?.filter((kr) => kr.isCompleted).length || 0;
  const keyResultsTotal = monthly.keyResults?.length || 0;
  const keyResultProgress =
    keyResultsTotal > 0
      ? Math.round((keyResultsCompleted / keyResultsTotal) * 100)
      : 0;

  if (!monthly.keyResults || monthly.keyResults.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="mb-4">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          {translate("monthlyDetail.keyResults.noKeyResults.title")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {translate("monthlyDetail.keyResults.noKeyResults.description")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 진행률 표시 */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {translate("monthlyDetail.keyResults.progress")}
          </span>
          <span className="text-sm text-muted-foreground">
            {keyResultsCompleted}/{keyResultsTotal}
          </span>
        </div>
        <Progress value={keyResultProgress} className="mb-2" />
        <div className="text-center text-sm text-muted-foreground">
          {keyResultProgress}% 완료
        </div>
      </Card>

      {/* Key Results 목록 */}
      <div className="space-y-3">
        {monthly.keyResults.map((keyResult, index) => (
          <Card
            key={keyResult.id}
            className={`p-4 transition-all duration-200 hover:shadow-md ${
              keyResult.isCompleted ? "bg-green-50/50 dark:bg-green-900/20" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  handleKeyResultToggle(index, !keyResult.isCompleted)
                }
                className="flex-shrink-0 hover:scale-110 transition-transform cursor-pointer"
                disabled={updateKeyResultMutation.isPending}
              >
                {updateKeyResultMutation.isPending ? (
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : keyResult.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 fill-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-green-600 hover:fill-green-100" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p
                    className={`text-sm font-medium transition-all duration-200 ${
                      keyResult.isCompleted
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {keyResult.title}
                  </p>
                  {keyResult.isCompleted && (
                    <Badge variant="secondary" className="text-xs">
                      {translate("monthlyDetail.keyResults.completed")}
                    </Badge>
                  )}
                </div>
                {keyResult.description && (
                  <p className="text-xs text-muted-foreground">
                    {keyResult.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
