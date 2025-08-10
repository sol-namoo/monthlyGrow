"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Retrospective } from "@/lib/types";
import { useLanguage } from "@/hooks/useLanguage";

interface RetrospectiveFormProps {
  chapterTitle: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

export function RetrospectiveForm({
  chapterTitle,
  onClose,
  onSave,
}: RetrospectiveFormProps) {
  const { toast } = useToast();
  const { translate } = useLanguage();

  // 회고 폼 스키마 정의
  const retrospectiveFormSchema = z.object({
    bestMoment: z
      .string()
      .min(1, translate("retrospective.form.validation.bestMomentRequired")),
    routineAdherence: z
      .string()
      .min(
        1,
        translate("retrospective.form.validation.routineAdherenceRequired")
      ),
    unexpectedObstacles: z
      .string()
      .min(
        1,
        translate("retrospective.form.validation.unexpectedObstaclesRequired")
      ),
    nextChapterApplication: z
      .string()
      .min(
        1,
        translate(
          "retrospective.form.validation.nextChapterApplicationRequired"
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
      routineAdherence: "",
      unexpectedObstacles: "",
      nextChapterApplication: "",
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
              {translate("retrospective.form.routineAdherence")}
            </label>
            <Textarea
              {...form.register("routineAdherence")}
              placeholder={translate(
                "retrospective.form.routineAdherencePlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.routineAdherence && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.routineAdherence.message}
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
            <label className="text-sm font-medium">
              {translate("retrospective.form.nextChapterApplication")}
            </label>
            <Textarea
              {...form.register("nextChapterApplication")}
              placeholder={translate(
                "retrospective.form.nextChapterApplicationPlaceholder"
              )}
              rows={3}
            />
            {form.formState.errors.nextChapterApplication && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.nextChapterApplication.message}
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
