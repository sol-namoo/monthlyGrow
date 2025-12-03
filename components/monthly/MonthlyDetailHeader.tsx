"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Trophy,
  Edit,
  Trash2,
  Plus,
  FolderOpen,
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { Monthly, Project } from "@/lib/types";

interface MonthlyDetailHeaderProps {
  monthly: Monthly & { connectedProjects?: Project[] };
  allAreas?: any[];
  showActions?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenRetrospectiveModal?: () => void;
  onOpenNoteForm?: () => void;
  onOpenProjectConnectionDialog?: () => void;
}

export function MonthlyDetailHeader({
  monthly,
  allAreas = [],
  showActions = true,
  onDelete,
  onEdit,
  onOpenRetrospectiveModal,
  onOpenNoteForm,
  onOpenProjectConnectionDialog,
}: MonthlyDetailHeaderProps) {
  const { translate, currentLanguage } = useLanguage();

  // 통계 계산
  const status = getMonthlyStatus(monthly);
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(monthly.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const daysUntilStart = Math.max(
    0,
    Math.ceil(
      (new Date(monthly.startDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const keyResultsCompleted =
    monthly.keyResults?.filter((kr) => kr.isCompleted).length || 0;
  const keyResultsTotal = monthly.keyResults?.length || 0;
  const keyResultProgress =
    keyResultsTotal > 0
      ? Math.round((keyResultsCompleted / keyResultsTotal) * 100)
      : 0;

  const isPastMonthly = status === "ended";

  return (
    <div className="space-y-6">
      {/* 먼슬리 기본 정보 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{monthly.objective}</h1>
          <Badge
            variant={
              status === "planned"
                ? "secondary"
                : status === "in_progress"
                ? "default"
                : "outline"
            }
          >
            {status === "planned"
              ? translate("monthly.status.planned")
              : status === "in_progress"
              ? translate("monthly.status.inProgress")
              : translate("monthly.status.completed")}
          </Badge>
        </div>

        <p className="text-muted-foreground">{monthly.description}</p>

        {/* 기간 정보 */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(monthly.startDate, currentLanguage)} ~{" "}
              {formatDate(monthly.endDate, currentLanguage)}
            </span>
          </div>
          {status === "in_progress" && daysLeft > 0 && (
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span>
                {daysLeft}
                {translate("monthlyDetail.daysLeft")}
              </span>
            </div>
          )}
          {status === "planned" && daysUntilStart > 0 && (
            <div className="flex items-center gap-1 text-blue-600">
              <Clock className="h-4 w-4" />
              <span>
                {daysUntilStart}
                {translate("monthlyDetail.daysUntilStart")}
              </span>
            </div>
          )}
        </div>

        {/* Key Results 진행률 */}
        {monthly.keyResults && monthly.keyResults.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {translate("monthly.currentMonthly.keyResultsProgress")}
              </span>
              <span className="text-sm text-muted-foreground">
                {keyResultsCompleted}/{keyResultsTotal}
              </span>
            </div>
            <Progress value={keyResultProgress} className="mb-2" />
            <div className="text-center text-sm text-muted-foreground">
              {keyResultProgress}% {translate("monthlyDetail.completedShort")}
            </div>
          </Card>
        )}

        {/* 보상 정보 */}
        {monthly.reward && (
          <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <div>
                <h4 className="font-semibold text-sm">
                  {translate("monthlyDetail.reward.title")}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {monthly.reward}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* 연결된 프로젝트 */}
        {monthly.connectedProjects && monthly.connectedProjects.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              {translate("monthlyDetail.connectedProjects")}
            </h3>
            <div className="space-y-2">
              {monthly.connectedProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-3 bg-muted/30 dark:bg-muted/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {project.areaName || "미분류"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 액션 버튼들 */}
      {showActions && !isPastMonthly && (
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.edit")}
            </Button>
          )}
          {onOpenRetrospectiveModal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenRetrospectiveModal}
            >
              <Plus className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.writeRetrospective")}
            </Button>
          )}
          {onOpenNoteForm && (
            <Button variant="outline" size="sm" onClick={onOpenNoteForm}>
              <Plus className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.writeNote")}
            </Button>
          )}
          {onOpenProjectConnectionDialog && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProjectConnectionDialog}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.connectProjects")}
            </Button>
          )}
          {onDelete && (
            <Button variant="destructive" size="sm" onClick={onDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {translate("monthlyDetail.delete")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
