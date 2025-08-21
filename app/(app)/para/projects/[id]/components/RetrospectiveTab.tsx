import { RetrospectiveContent } from "@/components/monthly/RetrospectiveContent";
import { Project, UnifiedArchive } from "@/lib/types";

interface RetrospectiveTabProps {
  project: Project;
  retrospective?: UnifiedArchive | null;
  onEditRetrospective: () => void;
}

export function RetrospectiveTab({
  project,
  retrospective,
  onEditRetrospective,
}: RetrospectiveTabProps) {
  return (
    <div className="space-y-4">
      <RetrospectiveContent
        retrospective={retrospective}
        canEdit={true}
        onEdit={onEditRetrospective}
        onWrite={onEditRetrospective}
        type="project"
      />
    </div>
  );
}
