"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

import { useLanguage } from "@/hooks/useLanguage";
import { Bookmark } from "lucide-react";

interface RetrospectiveFormProps {
  type: "monthly" | "project";
  title: string;
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
  type,
  title,
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
        "monthlyDetail.retrospectiveForm.failedReasonOptions.unrealisticGoal"
      ),
    },
    {
      value: "timeManagement",
      label: translate(
        "monthlyDetail.retrospectiveForm.failedReasonOptions.timeManagement"
      ),
    },
    {
      value: "priorityMismatch",
      label: translate(
        "monthlyDetail.retrospectiveForm.failedReasonOptions.priorityMismatch"
      ),
    },
    {
      value: "externalFactors",
      label: translate(
        "monthlyDetail.retrospectiveForm.failedReasonOptions.externalFactors"
      ),
    },
    {
      value: "other",
      label: translate(
        "monthlyDetail.retrospectiveForm.failedReasonOptions.other"
      ),
    },
  ];

  // 회고 폼 스키마 정의
  const retrospectiveFormSchema = z.object({
    bestMoment: z
      .string()
      .min(
        1,
        translate(
          "monthlyDetail.retrospectiveForm.validation.bestMomentRequired"
        )
      ),
    unexpectedObstacles: z
      .string()
      .min(
        1,
        translate(
          "monthlyDetail.retrospectiveForm.validation.unexpectedObstaclesRequired"
        )
      ),
    keyResultsReview: z
      .string()
      .min(
        1,
        translate(
          "monthlyDetail.retrospectiveForm.validation.keyResultsReviewRequired"
        )
      ),
    completedKeyResults: z.array(z.string()).optional(),
    failedKeyResults: z
      .array(
        z.object({
          keyResultId: z.string(),
          keyResultTitle: z.string(),
          reason: z.enum([
            "unrealisticGoal",
            "timeManagement",
            "priorityMismatch",
            "externalFactors",
            "motivation",
            "other",
          ]),
          customReason: z.string().optional(),
        })
      )
      .optional(),
    nextMonthlyApplication: z
      .string()
      .min(
        1,
        translate(
          "monthlyDetail.retrospectiveForm.validation.nextMonthlyApplicationRequired"
        )
      ),
    freeformContent: z.string().optional(),
    userRating: z.number().min(1).max(5),
    bookmarked: z.boolean(),
  });

  type RetrospectiveFormData = z.infer<typeof retrospectiveFormSchema>;

  const form = useForm<RetrospectiveFormData>({
    resolver: zodResolver(retrospectiveFormSchema),
    defaultValues: {
      bestMoment: "",
      unexpectedObstacles: "",
      keyResultsReview: "",
      completedKeyResults: [],
      failedKeyResults: [],
      nextMonthlyApplication: "",
      freeformContent: "",
      userRating: 0,
      bookmarked: false,
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
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50"
      style={{ margin: 0, padding: "16px 16px 80px 16px" }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[calc(100vh-120px)] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {translate("monthlyDetail.retrospectiveForm.title")}
        </h3>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {translate("monthlyDetail.retrospectiveForm.bestMoment")}
            </label>
            <Textarea
              {...form.register("bestMoment")}
              placeholder={translate(
                "monthlyDetail.retrospectiveForm.bestMomentPlaceholder"
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
              {translate("monthlyDetail.retrospectiveForm.unexpectedObstacles")}
            </label>
            <Textarea
              {...form.register("unexpectedObstacles")}
              placeholder={translate(
                "monthlyDetail.retrospectiveForm.unexpectedObstaclesPlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.unexpectedObstacles && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.unexpectedObstacles.message}
              </p>
            )}
          </div>

          {type === "monthly" && keyResults.length > 0 && (
            <div>
              <label className="text-sm font-medium">
                {translate("monthlyDetail.retrospectiveForm.keyResultsReview")}
              </label>
              <Textarea
                {...form.register("keyResultsReview")}
                placeholder="이번 먼슬리의 핵심 지표들을 전반적으로 평가해보세요"
                rows={3}
                className="mb-4"
              />
              {form.formState.errors.keyResultsReview && (
                <p className="text-sm text-red-500 mt-1 mb-4">
                  {form.formState.errors.keyResultsReview.message}
                </p>
              )}

              {/* 완료된 Key Results */}
              {keyResults.filter((kr) => kr.isCompleted).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-green-700 mb-2">
                    {translate(
                      "monthlyDetail.retrospectiveForm.completedKeyResults"
                    )}
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
                              {translate(
                                "monthlyDetail.retrospectiveForm.status.completed"
                              )}
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
                    {translate(
                      "monthlyDetail.retrospectiveForm.failedKeyResults"
                    )}
                  </h4>
                  <div className="space-y-3">
                    {keyResults
                      .filter((kr) => !kr.isCompleted)
                      .map((kr) => {
                        const currentFailedKeyResults =
                          form.watch("failedKeyResults") || [];
                        const currentFailedKeyResult =
                          currentFailedKeyResults.find(
                            (fkr) => fkr.keyResultId === kr.id
                          );

                        return (
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
                                  {translate(
                                    "monthlyDetail.retrospectiveForm.status.failed"
                                  )}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-red-700 block mb-1">
                                  {translate(
                                    "monthlyDetail.retrospectiveForm.failedReason"
                                  )}
                                </label>
                                <Select
                                  value={currentFailedKeyResult?.reason || ""}
                                  onValueChange={(value) => {
                                    const updatedFailedKeyResults =
                                      currentFailedKeyResults.filter(
                                        (fkr) => fkr.keyResultId !== kr.id
                                      );

                                    if (value) {
                                      updatedFailedKeyResults.push({
                                        keyResultId: kr.id,
                                        keyResultTitle: kr.title,
                                        reason: value as any,
                                        customReason:
                                          value === "other"
                                            ? currentFailedKeyResult?.customReason ||
                                              ""
                                            : undefined,
                                      });
                                    }

                                    form.setValue(
                                      "failedKeyResults",
                                      updatedFailedKeyResults
                                    );
                                  }}
                                >
                                  <SelectTrigger className="w-full text-xs">
                                    <SelectValue
                                      placeholder={translate(
                                        "monthlyDetail.retrospectiveForm.failedReasonPlaceholder"
                                      )}
                                    />
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

                                {/* "기타" 선택 시 추가 입력 필드 */}
                                {currentFailedKeyResult?.reason === "other" && (
                                  <div className="mt-2">
                                    <label className="text-xs font-medium text-red-700 block mb-1">
                                      {translate(
                                        "monthlyDetail.retrospectiveForm.failedReasonOptions.customReason"
                                      )}
                                    </label>
                                    <Input
                                      value={
                                        currentFailedKeyResult.customReason ||
                                        ""
                                      }
                                      onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>
                                      ) => {
                                        const updatedFailedKeyResults =
                                          currentFailedKeyResults.map((fkr) =>
                                            fkr.keyResultId === kr.id
                                              ? {
                                                  ...fkr,
                                                  customReason: e.target.value,
                                                }
                                              : fkr
                                          );
                                        form.setValue(
                                          "failedKeyResults",
                                          updatedFailedKeyResults
                                        );
                                      }}
                                      placeholder={translate(
                                        "monthlyDetail.retrospectiveForm.failedReasonOptions.customReasonPlaceholder"
                                      )}
                                      className="text-xs"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium">
              {translate(
                "monthlyDetail.retrospectiveForm.nextMonthlyApplication"
              )}
            </label>
            <Textarea
              {...form.register("nextMonthlyApplication")}
              placeholder={translate(
                "monthlyDetail.retrospectiveForm.nextMonthlyApplicationPlaceholder"
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
              {translate("monthlyDetail.retrospectiveForm.freeformContent")}
            </label>
            <Textarea
              {...form.register("freeformContent")}
              placeholder={translate(
                "monthlyDetail.retrospectiveForm.freeformContentPlaceholder"
              )}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              {translate("monthlyDetail.retrospectiveForm.rating")}
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
            <label className="text-sm font-medium">
              {translate("monthlyDetail.retrospectiveForm.bookmarked")}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                form.setValue("bookmarked", !form.watch("bookmarked"))
              }
              className={`p-2 h-auto ${
                form.watch("bookmarked")
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Bookmark
                className={`h-5 w-5 ${
                  form.watch("bookmarked") ? "fill-yellow-500" : "fill-none"
                }`}
              />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {translate("monthlyDetail.retrospectiveForm.save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {translate("monthlyDetail.retrospectiveForm.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
