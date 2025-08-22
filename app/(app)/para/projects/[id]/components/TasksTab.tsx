import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Calendar, Clock, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { formatDate } from "@/lib/utils";
import { Project, Task } from "@/lib/types";

interface TasksTabProps {
  project: Project;
  tasks: Task[];
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
  onAddTask: () => void;
  onToggleTask: (taskId: string, currentStatus: boolean) => void;
}

export function TasksTab({
  project,
  tasks,
  completedTasks,
  totalTasks,
  progressPercentage,
  onAddTask,
  onToggleTask,
}: TasksTabProps) {
  const { translate, currentLanguage } = useLanguage();

  // 태스크 정렬: 완료되지 않은 것이 먼저, 그 다음 날짜순
  const sortedTasks =
    tasks?.sort((a, b) => {
      // 1. 완료 여부로 정렬 (완료되지 않은 것이 먼저)
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      // 2. 완료 여부가 같으면 날짜순 정렬 (빠른 날짜가 먼저)
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">
          {translate("paraProjectDetail.taskList")}
        </h3>
        {project.category === "task_based" && (
          <Button size="sm" variant="outline" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-2" />
            {translate("paraProjectDetail.add")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {sortedTasks.map((task: any) => (
          <Card key={task.id} className="p-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleTask(task.id, task.done)}
                className="flex-shrink-0"
              >
                {task.done ? (
                  <CheckCircle2 className="h-3 w-3 text-green-600 fill-green-600" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    task.done ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.date, currentLanguage)}</span>
                  <Clock className="h-3 w-3" />
                  <span>{task.duration}시간</span>
                </div>
              </div>
            </div>
          </Card>
        )) || []}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        {completedTasks || 0}/{totalTasks || 0} 태스크 완료 (
        {progressPercentage || 0}%)
      </div>
    </div>
  );
}
