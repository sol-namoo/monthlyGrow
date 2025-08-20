"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Clock,
  Calendar,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/hooks/useLanguage";
import { useQuery } from "@tanstack/react-query";
import { getCompletedTasksByMonthlyPeriod } from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { formatDate } from "@/lib/utils";
import { Monthly } from "@/lib/types";

interface CompletedTasksTabProps {
  monthly: Monthly;
}

export function CompletedTasksTab({ monthly }: CompletedTasksTabProps) {
  const { translate, currentLanguage } = useLanguage();
  const [user] = useAuthState(auth);

  // Collapse 상태 관리 - 기본적으로 모든 프로젝트를 접힌 상태로 설정
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(
    new Set()
  );

  // 완료된 태스크 조회 (느슨한 관계 지원)
  const { data: completedTasks, isLoading: completedTasksLoading } = useQuery({
    queryKey: [
      "completedTasks",
      monthly.id,
      monthly.startDate,
      monthly.endDate,
    ],
    queryFn: () =>
      getCompletedTasksByMonthlyPeriod(
        user?.uid || "",
        new Date(monthly.startDate),
        new Date(monthly.endDate)
      ),
    enabled: !!user?.uid && !!monthly.id,
  });

  // completed tasks가 로드되면 모든 프로젝트를 기본적으로 접힌 상태로 설정
  useEffect(() => {
    if (completedTasks && completedTasks.length > 0) {
      const projectIds = [
        ...new Set(completedTasks.map((task) => task.projectId)),
      ];
      setCollapsedProjects(new Set(projectIds));
    }
  }, [completedTasks]);

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  if (completedTasksLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-sm text-muted-foreground mt-2">
          완료된 태스크를 불러오는 중...
        </p>
      </div>
    );
  }

  if (!completedTasks || completedTasks.length === 0) {
    return (
      <Card className="p-8 text-center bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-muted-foreground/30"></div>
        </div>
        <h3 className="text-lg font-medium mb-2">
          {translate("monthlyDetail.completedTasks.noTasks.title")}
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {translate("monthlyDetail.completedTasks.noTasks.description")}
          <br />
          {translate("monthlyDetail.completedTasks.noTasks.hint")}
        </p>

        <Button asChild className="w-full">
          <Link href="/para/projects">
            <FolderOpen className="mr-2 h-4 w-4" />
            {translate("monthlyDetail.viewProjects")}
          </Link>
        </Button>
      </Card>
    );
  }

  // 프로젝트별로 태스크 그룹핑
  const tasksByProject = completedTasks.reduce((acc, task) => {
    if (!acc[task.projectId]) {
      acc[task.projectId] = {
        projectId: task.projectId,
        projectTitle: task.projectTitle || "알 수 없는 프로젝트",
        areaName: task.areaName || "미분류",
        tasks: [],
      };
    }
    acc[task.projectId].tasks.push(task);
    return acc;
  }, {} as Record<string, any>);

  const projectEntries = Object.values(tasksByProject);

  return (
    <div className="space-y-4">
      {/* 완료된 태스크 요약 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {translate("monthlyDetail.completedTasks.summary")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {translate("monthlyDetail.completedTasks.summaryDescription")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {completedTasks.length}
            </div>
            <div className="text-sm text-muted-foreground">
              {translate("monthlyDetail.completedTasks.tasks")}
            </div>
          </div>
        </div>
      </Card>

      {/* 프로젝트별 태스크 목록 */}
      <div className="space-y-3">
        {projectEntries.map((project: any) => (
          <Collapsible
            key={project.projectId}
            open={!collapsedProjects.has(project.projectId)}
            onOpenChange={() => toggleProjectCollapse(project.projectId)}
          >
            <CollapsibleTrigger asChild>
              <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {collapsedProjects.has(project.projectId) ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <h4 className="font-medium">{project.projectTitle}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{project.areaName}</span>
                        <span>•</span>
                        <span>{project.tasks.length}개 태스크</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{project.tasks.length}개</Badge>
                </div>
              </Card>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-2">
                {project.tasks.map((task: any) => (
                  <Card
                    key={task.id}
                    className="p-3 ml-6 bg-muted/30 dark:bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDate(task.completedAt, currentLanguage)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {typeof task.duration === "string"
                                ? parseFloat(task.duration)
                                : task.duration}
                              시간
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {/* 총 완료 태스크 수 */}
      <div className="text-center text-sm text-muted-foreground">
        총 {completedTasks.length}개 태스크 완료
      </div>
    </div>
  );
}
