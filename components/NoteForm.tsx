"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import {
  updateMonthly,
  updateProject,
  createUnifiedArchive,
  updateUnifiedArchive,
  fetchSingleArchive,
} from "@/lib/firebase/index";
import type { Monthly } from "@/lib/types";

// 노트 폼 스키마 정의
const noteFormSchema = z.object({
  note: z.string().optional(),
});

type NoteFormData = z.infer<typeof noteFormSchema>;

interface NoteFormProps {
  type: "monthly" | "project";
  parent: Monthly | any; // Monthly 또는 Project 타입
  onClose: () => void;
  onSave?: () => void;
}

export function NoteForm({ type, parent, onClose, onSave }: NoteFormProps) {
  const { translate } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      note: typeof parent.note === "string" ? parent.note : "",
    },
  });

  const handleSubmit = async (data: NoteFormData) => {
    try {
      setIsSubmitting(true);

      if (type === "monthly") {
        await updateMonthly(parent.id, {
          note: data.note || "",
        });

        // unifiedarchive 컬렉션에도 저장
        const existingArchive = await fetchSingleArchive(
          parent.userId,
          parent.id,
          "monthly_note"
        );

        if (existingArchive) {
          // 기존 노트 업데이트
          await updateUnifiedArchive(existingArchive.id, {
            title: parent.objective || "",
            content: data.note || "",
          });
        } else {
          // 새 노트 생성
          await createUnifiedArchive({
            userId: parent.userId,
            type: "monthly_note",
            parentId: parent.id,
            title: parent.objective || "",
            content: data.note || "",
          });
        }
      } else if (type === "project") {
        // 프로젝트 노트 저장 로직
        const existingArchive = await fetchSingleArchive(
          parent.userId,
          parent.id,
          "project_note"
        );

        if (existingArchive) {
          // 기존 노트 업데이트
          await updateUnifiedArchive(existingArchive.id, {
            title: parent.title || "",
            content: data.note || "",
          });
        } else {
          // 새 노트 생성
          const newArchive = await createUnifiedArchive({
            userId: parent.userId,
            type: "project_note",
            parentId: parent.id,
            title: parent.title || "",
            content: data.note || "",
          });

          // 프로젝트에 노트 연결 (아카이브 ID 사용)
          await updateProject(parent.id, {
            notes: [
              {
                id: newArchive.id,
                userId: newArchive.userId,
                title: parent.title || "",
                content: data.note || "",
                createdAt: newArchive.createdAt,
                updatedAt: newArchive.updatedAt,
              },
            ],
          });
        }
      }

      toast({
        title: translate("monthlyDetail.note.saveSuccess"),
        description: translate("monthlyDetail.note.saveSuccessDescription"),
      });

      onSave?.();
      onClose();
    } catch (error) {
      console.error("노트 저장 실패:", error);
      toast({
        title: translate("monthlyDetail.note.saveError"),
        description: translate("monthlyDetail.note.saveErrorDescription"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-50"
      style={{ margin: 0, padding: "16px 16px 80px 16px" }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[calc(100vh-120px)] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {typeof parent.note === "string" && parent.note.trim() !== ""
            ? translate("monthlyDetail.note.editTitle")
            : translate("monthlyDetail.note.addTitle")}
        </h3>

        <p className="text-sm text-muted-foreground mb-4">
          {translate("monthlyDetail.note.descriptionText")}
        </p>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-2">
              {translate("monthlyDetail.note.title")}
            </label>
            <Textarea
              {...form.register("note")}
              placeholder={translate("monthlyDetail.note.placeholder")}
              rows={8}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting
                ? translate("common.saving")
                : translate("monthlyDetail.note.save")}
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
