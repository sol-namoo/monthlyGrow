"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";
import { useLanguage } from "@/hooks/useLanguage";

interface RetrospectiveFormProps {
  monthlyTitle: string;
  keyResults?: Array<{
    id: string;
    title: string;
    description?: string;
    isCompleted: boolean;
  }>;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function RetrospectiveForm({
  monthlyTitle,
  keyResults = [],
  onClose,
  onSave,
}: RetrospectiveFormProps) {
  const { toast } = useToast();
  const { translate } = useLanguage();

  // 실패 이유 옵션들
  const failedReasonOptions = [
    {
      value: "unrealisticGoal",
      label: translate(
        "retrospective.form.failedReasonOptions.unrealisticGoal"
      ),
    },
    {
      value: "timeManagement",
      label: translate("retrospective.form.failedReasonOptions.timeManagement"),
    },
    {
      value: "priorityMismatch",
      label: translate(
        "retrospective.form.failedReasonOptions.priorityMismatch"
      ),
    },
    {
      value: "externalFactors",
      label: translate(
        "retrospective.form.failedReasonOptions.externalFactors"
      ),
    },
    {
      value: "other",
      label: translate("retrospective.form.failedReasonOptions.other"),
    },
  ];

  // 회고 폼 스키마 정의
  const retrospectiveFormSchema = z.object({
    bestMoment: z
      .string()
      .min(1, translate("retrospective.form.validation.bestMomentRequired")),
    unexpectedObstacles: z
      .string()
      .min(
        1,
        translate("retrospective.form.validation.unexpectedObstaclesRequired")
      ),
    keyResultsReview: z
      .string()
      .min(
        1,
        translate("retrospective.form.validation.keyResultsReviewRequired")
      ),
    nextMonthlyApplication: z
      .string()
      .min(
        1,
        translate(
          "retrospective.form.validation.nextMonthlyApplicationRequired"
        )
      ),
    freeformContent: z.string().optional(),
    userRating: z.number().min(1).max(5),
    bookmarked: z.boolean(),
    // Key Results 평가를 위한 추가 필드들
    completedKeyResults: z.array(z.string()).optional(),
    failedKeyResults: z
      .array(
        z.object({
          keyResultId: z.string(),
          reason: z.string(),
        })
      )
      .optional(),
  });

  type RetrospectiveFormData = z.infer<typeof retrospectiveFormSchema>;

  const form = useForm<RetrospectiveFormData>({
    resolver: zodResolver(retrospectiveFormSchema),
    defaultValues: {
      bestMoment: "",
      unexpectedObstacles: "",
      keyResultsReview: "",
      nextMonthlyApplication: "",
      freeformContent: "",
      userRating: 0,
      bookmarked: false,
      completedKeyResults: [],
      failedKeyResults: [],
    },
  });

  const handleSubmit = (data: RetrospectiveFormData) => {
    onSave(data);
    form.reset();
    onClose();
  };

  const renderStarRating = (
    rating: number | undefined,
    setRating?: (rating: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating?.(star)}
            className={`text-lg ${
              rating && star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 pt-8 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {translate("retrospective.form.title")}
        </h3>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {translate("retrospective.form.bestMoment")}
            </label>
            <Textarea
              {...form.register("bestMoment")}
              placeholder={translate(
                "retrospective.form.bestMomentPlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.bestMoment && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.bestMoment.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              {translate("retrospective.form.unexpectedObstacles")}
            </label>
            <Textarea
              {...form.register("unexpectedObstacles")}
              placeholder={translate(
                "retrospective.form.unexpectedObstaclesPlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.unexpectedObstacles && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.unexpectedObstacles.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-3 block">
              {translate("retrospective.form.keyResultsReview")}
            </label>

            {/* 완료된 Key Results */}
            {keyResults.filter((kr) => kr.isCompleted).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-green-700 mb-2">
                  {translate("retrospective.form.completedKeyResults")}
                </h4>
                <div className="space-y-2">
                  {keyResults
                    .filter((kr) => kr.isCompleted)
                    .map((kr) => (
                      <Card
                        key={kr.id}
                        className="p-3 bg-green-50 border-green-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-green-800">
                              {kr.title}
                            </h5>
                            {kr.description && (
                              <p className="text-xs text-green-600 mt-1">
                                {kr.description}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            완료
                          </Badge>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* 실패한 Key Results */}
            {keyResults.filter((kr) => !kr.isCompleted).length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-red-700 mb-2">
                  {translate("retrospective.form.failedKeyResults")}
                </h4>
                <div className="space-y-3">
                  {keyResults
                    .filter((kr) => !kr.isCompleted)
                    .map((kr) => (
                      <Card
                        key={kr.id}
                        className="p-3 bg-red-50 border-red-200"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="text-sm font-medium text-red-800">
                                {kr.title}
                              </h5>
                              {kr.description && (
                                <p className="text-xs text-red-600 mt-1">
                                  {kr.description}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-red-100 text-red-800">
                              미달성
                            </Badge>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-red-700 block mb-1">
                              {translate("retrospective.form.failedReason")}
                            </label>
                            <Select>
                              <SelectTrigger className="w-full text-xs">
                                <SelectValue placeholder="실패 이유를 선택하세요" />
                              </SelectTrigger>
                              <SelectContent>
                                {failedReasonOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              {translate("retrospective.form.nextMonthlyApplication")}
            </label>
            <Textarea
              {...form.register("nextMonthlyApplication")}
              placeholder={translate(
                "retrospective.form.nextMonthlyApplicationPlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.nextMonthlyApplication && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.nextMonthlyApplication.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">
              {translate("retrospective.form.freeformContent")}
            </label>
            <Textarea
              {...form.register("freeformContent")}
              placeholder={translate(
                "retrospective.form.freeformContentPlaceholder"
              )}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              {translate("retrospective.form.rating")}
            </label>
            <div className="mt-2">
              {renderStarRating(form.watch("userRating"), (rating) =>
                form.setValue("userRating", rating)
              )}
            </div>
            {form.formState.errors.userRating && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.userRating.message}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bookmarked"
              {...form.register("bookmarked")}
            />
            <label htmlFor="bookmarked" className="text-sm">
              {translate("retrospective.form.bookmarked")}
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {translate("retrospective.form.save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {translate("retrospective.form.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
