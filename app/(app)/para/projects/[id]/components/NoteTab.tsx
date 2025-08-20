import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, MessageSquare, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Project } from "@/lib/types";

interface NoteTabProps {
  project: Project;
  onEditNote: () => void;
}

export function NoteTab({ project, onEditNote }: NoteTabProps) {
  const { translate } = useLanguage();

  return (
    <div className="space-y-4">
      {project.notes && project.notes.length > 0 ? (
        <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4" />
            <h3 className="font-bold">노트</h3>
          </div>
          <div className="p-4 bg-muted/40 dark:bg-muted/30 rounded-lg min-h-[120px]">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {project.notes[0].content}
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="mb-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {translate("paraProjectDetail.note.noNote")}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {translate("paraProjectDetail.note.description")}
          </p>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={onEditNote}
          >
            <Plus className="mr-2 h-4 w-4" />
            {translate("paraProjectDetail.note.addButton")}
          </Button>
        </Card>
      )}

      {project.notes && project.notes.length > 0 && (
        <Button
          variant="outline"
          className="w-full bg-transparent"
          onClick={onEditNote}
        >
          <Edit className="mr-2 h-4 w-4" />
          {translate("paraProjectDetail.note.edit")}
        </Button>
      )}
    </div>
  );
} 