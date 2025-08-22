"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare, Plus, Edit } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { fetchSingleArchive } from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { getMonthlyStatus } from "@/lib/utils";
import { RatingDisplay } from "@/components/ui/rating-display";
import { Monthly } from "@/lib/types";

interface NoteTabProps {
  monthly: Monthly;
  onOpenNoteForm: () => void;
}

export function NoteTab({ monthly, onOpenNoteForm }: NoteTabProps) {
  const { translate } = useLanguage();
  const [user] = useAuthState(auth);

  // 먼슬리 관련 아카이브 조회 (노트 하나만)
  const { data: monthlyNote, isLoading: noteLoading } = useQuery({
    queryKey: ["monthly-note", monthly.id],
    queryFn: async () => {
      const result = await fetchSingleArchive(
        user?.uid || "",
        monthly.id,
        "monthly_note"
      );
      return result;
    },
    enabled: !!user?.uid && !!monthly.id,
  });

  const status = getMonthlyStatus(monthly);
  // 회고/노트 수정 가능 여부: 진행중이거나 완료된 먼슬리에서만 가능
  const canEditRetrospectiveAndNote =
    status === "in_progress" || status === "ended";

  if (noteLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">
          노트 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {monthlyNote ? (
        <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4" />
            <h3 className="font-bold">노트</h3>
            <div className="flex items-center gap-2 ml-auto">
              <RatingDisplay
                rating={monthlyNote.userRating || 0}
                bookmarked={monthlyNote.bookmarked}
                size="sm"
              />
            </div>
          </div>
          <div className="p-4 bg-muted/40 dark:bg-muted/30 rounded-lg min-h-[120px]">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {monthlyNote.content}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="mb-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {translate("monthlyDetail.note.noNote")}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {translate("monthlyDetail.note.noNoteDescription")}
          </p>
          {canEditRetrospectiveAndNote && (
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={onOpenNoteForm}
            >
              <Plus className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.note.writeNote")}
            </Button>
          )}
        </Card>
      )}

      {canEditRetrospectiveAndNote && monthlyNote && (
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={onOpenNoteForm}
        >
          <Edit className="mr-2 h-4 w-4" />
          {translate("monthlyDetail.note.editNote")}
        </Button>
      )}
    </div>
  );
}
