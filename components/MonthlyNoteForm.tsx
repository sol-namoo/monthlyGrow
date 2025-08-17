"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { updateMonthly } from "@/lib/firebase/index";
import type { Monthly } from "@/lib/types";

// 노트 폼 스키마 정의
const monthlyNoteFormSchema = z.object({
  note: z.string().optional(),
});

type MonthlyNoteFormData = z.infer<typeof monthlyNoteFormSchema>;

interface MonthlyNoteFormProps {
  monthly: Monthly;
  onClose: () => void;
  onSave?: () => void;
}

export function MonthlyNoteForm({
  monthly,
  onClose,
  onSave,
}: MonthlyNoteFormProps) {
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MonthlyNoteFormData>({
    resolver: zodResolver(monthlyNoteFormSchema),
    defaultValues: {
      note: typeof monthly.note === "string" ? monthly.note : "",
    },
  });

  const handleSubmit = async (data: MonthlyNoteFormData) => {
    try {
      setIsSubmitting(true);

      await updateMonthly(monthly.id, {
        note: data.note || "",
      });

      toast({
        title: translate("monthly.note.saveSuccess"),
        description: translate("monthly.note.saveSuccessDescription"),
      });

      onSave?.();
      onClose();
    } catch (error) {
      console.error("노트 저장 실패:", error);
      toast({
        title: translate("monthly.note.saveError"),
        description: translate("monthly.note.saveErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {typeof monthly.note === "string" && monthly.note.trim() !== ""
            ? translate("monthly.note.editTitle")
            : translate("monthly.note.addTitle")}
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          {translate("monthly.note.descriptionText")}
        </p>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              {translate("monthly.note.title")}
            </label>
            <Textarea
              {...form.register("note")}
              placeholder={translate("monthly.note.placeholder")}
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : translate("monthly.note.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {translate("common.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
