import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, MessageSquare, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Project } from "@/lib/types";

interface RetrospectiveTabProps {
  project: Project;
  onEditRetrospective: () => void;
}

export function RetrospectiveTab({ project, onEditRetrospective }: RetrospectiveTabProps) {
  const { translate } = useLanguage();

  return (
    <div className="space-y-4">
      {project.retrospective ? (
        <Card className="p-6 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <h3 className="font-bold">회고</h3>
            </div>
          </div>
          <div className="space-y-4">
            {project.retrospective.bestMoment && (
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  가장 기억에 남는 순간
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/40 dark:bg-muted/30 p-3 rounded-lg">
                  {project.retrospective.bestMoment}
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditRetrospective}
            >
              <Edit className="mr-2 h-4 w-4" />
              {translate("paraProjectDetail.retrospective.editTitle")}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
          <div className="mb-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium mb-2">
            {translate("paraProjectDetail.retrospective.noContent")}
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {translate("paraProjectDetail.retrospective.description")}
          </p>
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={onEditRetrospective}
          >
            <Plus className="mr-2 h-4 w-4" />
            {translate("paraProjectDetail.retrospective.writeTitle")}
          </Button>
        </Card>
      )}
    </div>
  );
} 