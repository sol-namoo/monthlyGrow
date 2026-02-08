import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  mode: "monthly" | "project"; // 월간 모드 vs 프로젝트 모드
  monthlyTargetCount?: number; // 월간 모드에서 사용할 월간별 목표 수
  monthlyDoneCount?: number; // 월간 모드에서 사용할 월간별 완료 수
  taskCounts?: {
    totalTasks: number;
    completedTasks: number;
  };
  showBothProgress?: boolean; // 월간 모드에서 두 정보 모두 표시할지 여부
  showTargetButtons?: boolean; // 월간 모드에서 목표 설정 버튼을 표시할지 여부
  onTargetCountChange?: (projectId: string, newCount: number) => void; // 목표 개수 변경 콜백
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ProjectCard({
  project,
  mode,
  monthlyTargetCount,
  monthlyDoneCount,
  taskCounts,
  showBothProgress = false,
  showTargetButtons = false,
  onTargetCountChange,
  onClick,
  className,
  children,
}: ProjectCardProps) {
  const { translate } = useLanguage();

  // 진행률 계산
  const getProgressInfo = () => {
    if (mode === "monthly") {
      // 월간 모드: 프로젝트 전체 진행률 기준 (기본값)
      let done = 0;
      let total = 0;

      if (project.category === "repetitive") {
        // 반복형: targetCount 기준
        done = project.completedTasks || 0;
        total = project.targetCount || 0;
      } else {
        // 작업형: 실제 태스크 개수 기준 (taskCounts가 없으면 프로젝트 데이터 사용)
        done = taskCounts?.completedTasks ?? project.completedTasks ?? 0;
        total = taskCounts?.totalTasks ?? project.targetCount ?? 0;
      }

      const percentage =
        total > 0 ? Math.round((done / total) * 100) : done > 0 ? 100 : 0;

      return {
        percentage,
        done,
        total,
        label: translate("common.projectProgress"),
        color: "text-gray-600 dark:text-gray-300",
        bgColor: "bg-gray-100 dark:bg-gray-800/50",
        borderColor: "border-gray-200 dark:border-gray-700",
      };
    } else {
      // 프로젝트 모드: 프로젝트 전체 진행률 기준
      let done = 0;
      let total = 0;

      if (project.category === "repetitive") {
        // 반복형: targetCount 기준
        done = project.completedTasks || 0;
        total = project.targetCount || 0;
      } else {
        // 작업형: 실제 태스크 개수 기준 (taskCounts가 없으면 프로젝트 데이터 사용)
        done = taskCounts?.completedTasks ?? project.completedTasks ?? 0;
        total = taskCounts?.totalTasks ?? project.targetCount ?? 0;
      }

      const percentage =
        total > 0 ? Math.round((done / total) * 100) : done > 0 ? 100 : 0;

      return {
        percentage,
        done,
        total,
        label: translate("common.projectProgress"),
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        borderColor: "border-blue-200 dark:border-blue-800",
      };
    }
  };

  // 월간별 목표 계산 (월간 모드에서 두 정보 모두 표시할 때 사용)
  const getMonthlyGoalInfo = () => {
    const target = monthlyTargetCount || 0;
    const done = monthlyDoneCount || 0;
    const percentage = target > 0 ? Math.round((done / target) * 100) : 0;

    return {
      percentage,
      done,
      total: target,
      label: translate("common.monthlyGoal"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      borderColor: "border-purple-200 dark:border-purple-800",
    };
  };

  const progressInfo = getProgressInfo();

  // 프로젝트 상태 계산 (목표 targetCount 달성 여부 기준. 상세와 동일). Badge는 상세와 동일한 variant 사용.
  const getProjectStatus = (): {
    statusKey: "scheduled" | "in_progress" | "completed" | "overdue" | "undefined";
    label: string;
  } => {
    const now = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (!startDate || !endDate) {
      return {
        statusKey: "undefined",
        label: translate("para.projects.status.undefined"),
      };
    }

    const goal = project.targetCount ?? progressInfo.total;
    const goalReached = goal > 0 && progressInfo.done >= goal;

    if (now < startDate) {
      return {
        statusKey: "scheduled",
        label: translate("para.projects.status.planned"),
      };
    }
    if (goalReached) {
      return {
        statusKey: "completed",
        label: translate("para.projects.status.completed"),
      };
    }
    if (now > endDate) {
      return {
        statusKey: "overdue",
        label: translate("para.projects.status.overdue"),
      };
    }
    return {
      statusKey: "in_progress",
      label: translate("para.projects.status.inProgress"),
    };
  };

  const projectStatus = getProjectStatus();
  const statusVariant: Record<
    "scheduled" | "in_progress" | "completed" | "overdue" | "undefined",
    "secondary" | "default" | "destructive" | "outline"
  > = {
    scheduled: "secondary",
    in_progress: "default",
    completed: "outline",
    overdue: "destructive",
    undefined: "secondary",
  };

  return (
    <Card
      className={`${
        onClick ? "cursor-pointer transition-all hover:shadow-md" : ""
      } bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40 ${
        className || ""
      }`}
      onClick={onClick}
    >
      <div className="p-3">
        {/* 프로젝트 제목과 상태 */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="font-medium truncate">{project.title}</span>
          </div>
          <Badge
            variant={statusVariant[projectStatus.statusKey]}
            className="text-xs flex-shrink-0"
          >
            {projectStatus.label}
          </Badge>
        </div>

        {/* 완료된 태스크 개수 표시 */}
        <div className="mb-2 text-xs text-muted-foreground">
          완료된 태스크: {taskCounts?.completedTasks || 0}개 / 전체:{" "}
          {taskCounts?.totalTasks || 0}개
        </div>

        {/* 월간 모드에서 월간별 목표 표시 */}
        {mode === "monthly" && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${getMonthlyGoalInfo().color}`}
              >
                {getMonthlyGoalInfo().label}
              </span>
              <span className="text-sm font-medium">
                {getMonthlyGoalInfo().done}/{getMonthlyGoalInfo().total}
              </span>
            </div>
            {showTargetButtons && onTargetCountChange && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 권장값 계산 (프로젝트 기간과 월간 기간을 고려)
                    const projectStartDate = new Date(project.startDate);
                    const projectEndDate = new Date(project.endDate);
                    const now = new Date();
                    const monthlyEndDate = new Date(
                      now.getFullYear(),
                      now.getMonth() + 1,
                      0
                    );

                    const overlapStart = new Date(
                      Math.max(projectStartDate.getTime(), now.getTime())
                    );
                    const overlapEnd = new Date(
                      Math.min(
                        projectEndDate.getTime(),
                        monthlyEndDate.getTime()
                      )
                    );

                    if (overlapEnd <= overlapStart) {
                      onTargetCountChange(project.id, 1);
                      return;
                    }

                    const overlapDays = Math.ceil(
                      (overlapEnd.getTime() - overlapStart.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const totalProjectDays = Math.ceil(
                      (projectEndDate.getTime() - projectStartDate.getTime()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const targetCount = project.targetCount || 1;

                    const recommendedCount = Math.max(
                      1,
                      Math.round((overlapDays / totalProjectDays) * targetCount)
                    );
                    onTargetCountChange(project.id, recommendedCount);
                  }}
                  className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                >
                  권장값
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTargetCountChange(project.id, project.targetCount || 1);
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  전체
                </button>
              </div>
            )}
          </div>
        )}

        {/* 진행률 바 */}
        <Progress
          value={
            mode === "monthly"
              ? getMonthlyGoalInfo().percentage
              : progressInfo.percentage
          }
          className="mb-3 h-2"
        />

        {/* 월간 모드에서 두 정보 모두 표시할 때 전체 진행률 추가 */}
        {mode === "monthly" && showBothProgress && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${progressInfo.color}`}>
                  {progressInfo.label}
                </span>
                <span className="text-sm font-medium">
                  {progressInfo.done}/{progressInfo.total}
                </span>
              </div>
            </div>
            <div className="progress-bar mb-3">
              <div
                className="progress-value"
                style={{
                  width: `${progressInfo.percentage}%`,
                  backgroundColor: "#6b7280", // 회색 (추가 진행률 바)
                }}
              ></div>
            </div>
          </>
        )}

        {/* 프로젝트 정보 */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-start gap-2">
            <span className="min-w-[60px]">{translate("common.area")}:</span>
            <span>{project.area || translate("common.uncategorized")}</span>
          </div>
          <div className="flex items-center justify-start gap-2">
            <span className="min-w-[60px]">
              {translate("common.category")}:
            </span>
            <span>
              {project.category === "repetitive"
                ? translate("para.projects.category.repetitive")
                : translate("para.projects.category.taskBased")}
            </span>
          </div>
          <div className="flex items-center justify-start gap-2">
            <span className="min-w-[60px]">{translate("common.target")}:</span>
            <span>{project.target}</span>
          </div>
        </div>

        {/* 추가 정보 (children) */}
        {children}
      </div>
    </Card>
  );
}
