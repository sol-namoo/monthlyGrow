"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";

// 회고 폼 스키마 정의
const retrospectiveFormSchema = z.object({
  bestMoment: z.string().min(1, "가장 좋았던 순간을 입력해주세요"),
  routineAdherence: z.string().min(1, "루틴 준수율을 입력해주세요"),
  unexpectedObstacles: z.string().min(1, "예상치 못한 장애물을 입력해주세요"),
  nextLoopApplication: z.string().min(1, "다음 루프 적용 방안을 입력해주세요"),
  freeformContent: z.string().optional(),
  userRating: z.number().min(1).max(5),
  bookmarked: z.boolean(),
});

type RetrospectiveFormData = z.infer<typeof retrospectiveFormSchema>;

interface RetrospectiveFormProps {
  loopTitle: string;
  onClose: () => void;
  onSave: (data: RetrospectiveFormData) => void;
}

export function RetrospectiveForm({
  loopTitle,
  onClose,
  onSave,
}: RetrospectiveFormProps) {
  const { toast } = useToast();

  const form = useForm<RetrospectiveFormData>({
    resolver: zodResolver(retrospectiveFormSchema),
    defaultValues: {
      bestMoment: "",
      routineAdherence: "",
      unexpectedObstacles: "",
      nextLoopApplication: "",
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">회고 작성</h3>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">가장 좋았던 순간</label>
            <Textarea
              {...form.register("bestMoment")}
              placeholder="이번 루프에서 가장 좋았던 순간을 기록해주세요"
              rows={3}
            />
            {form.formState.errors.bestMoment && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.bestMoment.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">루틴 준수율</label>
            <Textarea
              {...form.register("routineAdherence")}
              placeholder="계획한 루틴을 얼마나 잘 지켰는지 기록해주세요"
              rows={3}
            />
            {form.formState.errors.routineAdherence && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.routineAdherence.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">예상치 못한 장애물</label>
            <Textarea
              {...form.register("unexpectedObstacles")}
              placeholder="예상하지 못했던 어려움을 기록해주세요"
              rows={3}
            />
            {form.formState.errors.unexpectedObstacles && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.unexpectedObstacles.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">다음 루프 적용 방안</label>
            <Textarea
              {...form.register("nextLoopApplication")}
              placeholder="이번 경험을 다음 루프에 어떻게 적용할지 기록해주세요"
              rows={3}
            />
            {form.formState.errors.nextLoopApplication && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.nextLoopApplication.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">자유 회고 (선택사항)</label>
            <Textarea
              {...form.register("freeformContent")}
              placeholder="추가로 기록하고 싶은 내용이 있다면 자유롭게 작성해주세요"
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">평점</label>
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
              북마크에 추가
            </label>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              저장
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
