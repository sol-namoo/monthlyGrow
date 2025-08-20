import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/utils";
import { Project, Task } from "@/lib/types";

interface OverviewTabProps {
  project: Project;
  tasks: Task[];
  timeStats: any;
  completedTasks: number;
  totalTasks: number;
}

export function OverviewTab({
  project,
  tasks,
  timeStats,
  completedTasks,
  totalTasks,
}: OverviewTabProps) {
  const { translate, currentLanguage } = useLanguage();

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
            <span>
              {project.areaId
                ? translate("settings.loading.areaInfo")
                : "연결된 Area 없음"}
            </span>
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
    </div>
  );
}
