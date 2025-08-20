import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Edit, Trash2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/utils";
import { getProjectStatus } from "@/lib/utils";
import { Project, Area } from "@/lib/types";

interface ProjectHeaderProps {
  project: Project;
  area?: Area;
  onEdit: () => void;
  onDelete: () => void;
}

export function ProjectHeader({
  project,
  area,
  onEdit,
  onDelete,
}: ProjectHeaderProps) {
  const { translate, currentLanguage } = useLanguage();

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-2xl font-bold">{project.title}</h1>
        {area ? (
          <Badge variant={area.name === "미분류" ? "destructive" : "secondary"}>
            {area.name}
          </Badge>
        ) : project.areaId ? (
          <Badge variant="outline">
            {translate("paraProjectDetail.areaLoading")}
          </Badge>
        ) : (
          <Badge variant="destructive">
            {translate("paraProjectDetail.noArea")}
          </Badge>
        )}
      </div>

      <p className="text-muted-foreground mb-4">{project.description}</p>

      {/* 상태 및 진행률 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-sm font-medium">
            {translate("paraProjectDetail.duration")}
          </span>
          <div className="flex items-center gap-1">
            <span>
              {formatDate(project.startDate, currentLanguage)} ~{" "}
              {formatDate(project.endDate, currentLanguage)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {translate("paraProjectDetail.status")}
          </span>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                getProjectStatus(project) === "scheduled"
                  ? "secondary"
                  : getProjectStatus(project) === "in_progress"
                  ? "default"
                  : "outline"
              }
            >
              {getProjectStatus(project) === "scheduled"
                ? translate("paraProjectDetail.statusLabels.planned")
                : getProjectStatus(project) === "in_progress"
                ? translate("paraProjectDetail.statusLabels.inProgress")
                : getProjectStatus(project) === "completed"
                ? translate("paraProjectDetail.statusLabels.completed")
                : translate("paraProjectDetail.statusLabels.overdue")}
            </Badge>
            {getProjectStatus(project) === "overdue" && (
              <Badge variant="destructive" className="text-xs">
                {translate("paraProjectDetail.overdue")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {translate("paraProjectDetail.target")}
          </span>
          <span className="text-sm text-muted-foreground">
            {project.target}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {translate("paraProjectDetail.target")}{" "}
            {project.category === "repetitive"
              ? translate("paraProjectDetail.targetLabels.count")
              : translate("paraProjectDetail.targetLabels.tasks")}
          </span>
          <span className="text-sm text-muted-foreground">
            {project.targetCount || 0}
            {project.category === "repetitive"
              ? translate("paraProjectDetail.targetLabels.times")
              : translate("paraProjectDetail.targetLabels.tasks")}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {translate("paraProjectDetail.progress")}
          </span>
          <span className="text-sm text-muted-foreground">
            {project.progressPercentage || 0}%
          </span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-value"
            style={{
              width: `${project.progressPercentage || 0}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
