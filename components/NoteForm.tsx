"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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
        <h3 className="text-lg font-semibold mb-4">노트 작성</h3>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium">노트 내용</label>
            <Textarea
              {...form.register("content")}
              placeholder="기록하고 싶은 내용을 작성해주세요"
              rows={4}
            />
            {form.formState.errors.content && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.content.message}
              </p>
            )}
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
