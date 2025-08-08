"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";

// 노트 폼 스키마 정의
const noteFormSchema = z.object({
  content: z.string().min(1, "노트 내용을 입력해주세요"),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  onClose: () => void;
  onSave: (data: NoteFormData) => void;
}

export function NoteForm({ onClose, onSave }: NoteFormProps) {
  const { translate } = useLanguage();

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const handleSubmit = (data: NoteFormData) => {
    onSave(data);
    form.reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {translate("noteForm.title")}
        </h3>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              {translate("noteForm.content")}
            </label>
            <Textarea
              {...form.register("content")}
              placeholder={translate("noteForm.placeholder")}
              rows={4}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-1">
                {translate("noteForm.contentRequired")}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              {translate("noteForm.save")}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              {translate("noteForm.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
