import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  mode: "chapter" | "project"; // 챕터 모드 vs 프로젝트 모드
  chapterTargetCount?: number; // 챕터 모드에서 사용할 챕터별 목표 수
  chapterDoneCount?: number; // 챕터 모드에서 사용할 챕터별 완료 수
  taskCounts?: {
    totalTasks: number;
    completedTasks: number;
  };
  showBothProgress?: boolean; // 챕터 모드에서 두 정보 모두 표시할지 여부
  showTargetButtons?: boolean; // 챕터 모드에서 목표 설정 버튼을 표시할지 여부
  onTargetCountChange?: (projectId: string, newCount: number) => void; // 목표 개수 변경 콜백
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function ProjectCard({
  project,
  mode,
  chapterTargetCount,
  chapterDoneCount,
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
    if (mode === "chapter") {
      // 챕터 모드: 프로젝트 전체 진행률 기준 (기본값)
      let done = 0;
      let total = 0;

      if (project.category === "repetitive") {
        // 반복형: targetCount 기준
        done = project.completedTasks || 0;
        total = project.targetCount || 0;
      } else {
        // 작업형: 실제 태스크 개수 기준
        done = taskCounts?.completedTasks || 0;
        total = taskCounts?.totalTasks || 0;
      }

      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        percentage,
        done,
        total,
        label: translate("common.projectProgress"),
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-200",
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
        // 작업형: 실제 태스크 개수 기준
        done = taskCounts?.completedTasks || 0;
        total = taskCounts?.totalTasks || 0;
      }

      const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        percentage,
        done,
        total,
        label: translate("common.projectProgress"),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-200",
      };
    }
  };

  // 챕터별 목표 계산 (챕터 모드에서 두 정보 모두 표시할 때 사용)
  const getChapterGoalInfo = () => {
    const target = chapterTargetCount || 0;
    const done = chapterDoneCount || 0;
    const percentage = target > 0 ? Math.round((done / target) * 100) : 0;

    return {
      percentage,
      done,
      total: target,
      label: translate("common.chapterGoal"),
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      borderColor: "border-purple-200",
    };
  };

  const progressInfo = getProgressInfo();

  // 프로젝트 상태 계산
  const getProjectStatus = () => {
    const now = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : null;
    const endDate = project.endDate ? new Date(project.endDate) : null;

    if (!startDate || !endDate) {
      return {
        status: translate("para.projects.status.undefined"),
        color: "text-gray-500",
        bgColor: "bg-gray-100",
      };
    }

    // 완료된 경우 (진행률 100% 이상)
    if (progressInfo.percentage >= 100) {
      return {
        status: translate("para.projects.status.completed"),
        color: "text-green-600",
        bgColor: "bg-green-100",
      };
    }

    // 시작일이 미래인 경우
    if (now < startDate) {
      return {
        status: translate("para.projects.status.planned"),
        color: "text-blue-600",
        bgColor: "bg-blue-100",
      };
    }

    // 종료일이 지났지만 완료되지 않은 경우
    if (now > endDate && progressInfo.percentage < 100) {
      return {
        status: translate("para.projects.status.overdue"),
        color: "text-red-600",
        bgColor: "bg-red-100",
      };
    }

    // 진행 중인 경우
    return {
      status: translate("para.projects.status.inProgress"),
      color: "text-green-600",
      bgColor: "bg-green-100",
    };
  };

  const projectStatus = getProjectStatus();

  return (
    <Card
      className={`${
        onClick ? "cursor-pointer transition-all hover:shadow-md" : ""
      } ${className || ""}`}
      onClick={onClick}
    >
      <div className="p-3">
        {/* 프로젝트 제목과 상태 */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.title}</span>
            <Badge
              variant="outline"
              className={`text-xs ${projectStatus.color} ${projectStatus.bgColor}`}
            >
              {projectStatus.status}
            </Badge>
          </div>
        </div>

        {/* 챕터 모드에서 챕터별 목표 표시 */}
        {mode === "chapter" && (
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${getChapterGoalInfo().color}`}
              >
                {getChapterGoalInfo().label}
              </span>
              <span className="text-sm font-medium">
                {getChapterGoalInfo().done}/{getChapterGoalInfo().total}
              </span>
            </div>
            {showTargetButtons && onTargetCountChange && (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 권장값 계산 (프로젝트 기간과 챕터 기간을 고려)
                    const projectStartDate = new Date(project.startDate);
                    const projectEndDate = new Date(project.endDate);
                    const now = new Date();
                    const chapterEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    const overlapStart = new Date(Math.max(projectStartDate.getTime(), now.getTime()));
                    const overlapEnd = new Date(Math.min(projectEndDate.getTime(), chapterEndDate.getTime()));
                    
                    if (overlapEnd <= overlapStart) {
                      onTargetCountChange(project.id, 1);
                      return;
                    }
                    
                    const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
                    const totalProjectDays = Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const targetCount = project.targetCount || 1;
                    
                    const recommendedCount = Math.max(1, Math.round((overlapDays / totalProjectDays) * targetCount));
                    onTargetCountChange(project.id, recommendedCount);
                  }}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  권장값
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTargetCountChange(project.id, project.targetCount || 1);
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  전체
                </button>
              </div>
            )}
          </div>
        )}

        {/* 진행률 바 */}
        <div className="progress-bar mb-3">
          <div
            className="progress-value"
            style={{
              width: `${
                mode === "chapter"
                  ? getChapterGoalInfo().percentage
                  : progressInfo.percentage
              }%`,
              backgroundColor: "#e9d5ff", // 연한 보라색으로 통일
            }}
          ></div>
        </div>

        {/* 챕터 모드에서 두 정보 모두 표시할 때 전체 진행률 추가 */}
        {mode === "chapter" && showBothProgress && (
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
          <div className="flex items-center justify-between">
            <span>{translate("common.area")}:</span>
            <span>{project.area || translate("common.uncategorized")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{translate("common.category")}:</span>
            <span>
              {project.category === "repetitive"
                ? translate("para.projects.category.repetitive")
                : translate("para.projects.category.taskBased")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>{translate("common.target")}:</span>
            <span>{project.target}</span>
          </div>
        </div>

        {/* 추가 정보 (children) */}
        {children}
      </div>
    </Card>
  );
}
