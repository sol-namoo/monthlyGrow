import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Target } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { Project, Task, Area } from "@/lib/types";

/** 연결된 먼슬리 한 건 (id, objective, startDate, endDate, connectedProjects) */
type ConnectedMonthlyItem = {
  id: string;
  objective?: string;
  startDate: Date;
  endDate: Date;
  connectedProjects?: { projectId: string; monthlyTargetCount?: number; monthlyDoneCount?: number }[];
};

interface OverviewTabProps {
  project: Project;
  tasks: Task[];
  timeStats: any;
  completedTasks: number;
  totalTasks: number;
  area?: Area | null;
  /** 연결된 먼슬리 목록 (상세 표시용) */
  connectedMonthlies?: ConnectedMonthlyItem[];
}

export function OverviewTab({
  project,
  tasks,
  timeStats,
  completedTasks,
  totalTasks,
  area,
  connectedMonthlies = [],
}: OverviewTabProps) {
  const { translate, currentLanguage } = useLanguage();

  const getProjectGoalInMonthly = (monthly: ConnectedMonthlyItem) => {
    const list = monthly.connectedProjects || [];
    const cp = list.find(
      (c: any) => (typeof c === "string" ? c : c.projectId) === project.id
    );
    if (!cp || typeof cp === "string")
      return { target: 0, done: 0 };
    return {
      target: (cp as any).monthlyTargetCount ?? 0,
      done: (cp as any).monthlyDoneCount ?? 0,
    };
  };

  const formatMonthlyPeriod = (m: ConnectedMonthlyItem) => {
    const s = new Date(m.startDate);
    return `${s.getFullYear()}년 ${s.getMonth() + 1}월`;
  };

  // 반복형 프로젝트의 경우 targetCount 사용, 작업형의 경우 tasks 개수 사용
  const targetCount =
    project?.targetCount ||
    (project?.category === "repetitive" ? completedTasks : totalTasks);

  return (
    <div className="space-y-4">
      {/* 세부 진행 상황 */}
      <Card className="p-4 mb-4">
        <h3 className="font-semibold mb-3">
          {translate("paraProjectDetail.progressStatus")}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.completed")}{" "}
              {project.category === "repetitive"
                ? translate("paraProjectDetail.targetLabels.count")
                : translate("paraProjectDetail.targetLabels.tasks")}
            </span>
            <span className="font-medium">
              {completedTasks || 0}
              {project.category === "repetitive"
                ? translate("paraProjectDetail.targetLabels.times")
                : translate("paraProjectDetail.targetLabels.items")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.remaining")}{" "}
              {project.category === "repetitive"
                ? translate("paraProjectDetail.targetLabels.count")
                : translate("paraProjectDetail.targetLabels.tasks")}
            </span>
            <span className="font-medium">
              {project.category === "repetitive"
                ? Math.max(0, targetCount - (completedTasks || 0))
                : (totalTasks || 0) - (completedTasks || 0)}
              {project.category === "repetitive"
                ? translate("paraProjectDetail.targetLabels.times")
                : translate("paraProjectDetail.targetLabels.items")}
            </span>
          </div>
          <hr />
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.completedTime")}
            </span>
            <span className="font-medium">
              {timeStats?.completedTime || 0}
              {translate("paraProjectDetail.hours")}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.remainingTime")}
            </span>
            <span className="font-medium">
              {timeStats?.remainingTime || 0}
              {translate("paraProjectDetail.hours")}
            </span>
          </div>
        </div>
      </Card>

      {/* 최근 활동 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          {translate("paraProjectDetail.recentActivity")}
        </h3>
        <div className="space-y-2">
          {tasks && tasks.length > 0 ? (
            tasks
              .filter((task) => task.updatedAt) // updatedAt이 있는 태스크만
              .sort(
                (a, b) =>
                  new Date(b.updatedAt!).getTime() -
                  new Date(a.updatedAt!).getTime()
              ) // 최신순 정렬
              .slice(0, 2) // 최근 2개만
              .map((task) => (
                <div key={task.id} className="flex items-center gap-2 text-sm">
                  {task.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span
                    className={
                      task.done ? "line-through text-muted-foreground" : ""
                    }
                  >
                    {task.title}
                  </span>
                  <span className="text-muted-foreground ml-auto">
                    {formatDate(task.updatedAt, currentLanguage)}
                  </span>
                </div>
              ))
          ) : (
            <p className="text-xs text-muted-foreground">
              {translate("paraProjectDetail.noActivity")}
            </p>
          )}
        </div>
      </Card>

      {/* 프로젝트 정보 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">
          {translate("paraProjectDetail.projectInfo")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.projectType")}
            </span>
            <span>
              {project.category === "repetitive"
                ? translate("paraProjectDetail.projectTypeLabels.repetitive")
                : translate("paraProjectDetail.projectTypeLabels.task")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.target")}{" "}
              {project.category === "repetitive"
                ? translate("paraProjectDetail.targetLabels.count")
                : translate("paraProjectDetail.targetLabels.tasks")}
            </span>
            <span>
              {project.category === "repetitive" && project.targetCount
                ? `${project.target} ${project.targetCount}${translate(
                    "paraProjectDetail.targetLabels.times"
                  )}`
                : project.target}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.connectedArea")}
            </span>
            <span>{area?.title || project.area || "연결된 Area 없음"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.createdAt")}
            </span>
            <span>{formatDate(project.createdAt, currentLanguage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.updatedAt")}
            </span>
            <span>{formatDate(project.updatedAt, currentLanguage)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {translate("paraProjectDetail.connectedMonthlies")}
            </span>
            <span>
              {project.connectedMonthlies &&
              project.connectedMonthlies.length > 0
                ? `${project.connectedMonthlies.length}개`
                : translate("paraProjectDetail.noConnectedMonthlies")}
            </span>
          </div>
        </div>
      </Card>

      {/* 연결된 먼슬리 목록 + 목표/진행 */}
      {connectedMonthlies.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4" />
            {translate("paraProjectDetail.connectedMonthlies")}
          </h3>
          <div className="space-y-3">
            {connectedMonthlies.map((monthly) => {
              const status = getMonthlyStatus(monthly);
              const isActive = status === "in_progress";
              const { target, done } = getProjectGoalInMonthly(monthly);
              const progressText =
                target > 0
                  ? `목표 ${target}개 중 ${done}개 완료${isActive ? ` (${Math.round((done / target) * 100)}%)` : ""}`
                  : "목표 미설정";
              return (
                <Link
                  key={monthly.id}
                  href={`/monthly/${monthly.id}`}
                  className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">
                          {monthly.objective || "제목 없음"}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="text-xs shrink-0">
                            이번 달
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatMonthlyPeriod(monthly)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {progressText}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
