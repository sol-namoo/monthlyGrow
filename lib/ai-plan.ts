import { GeneratedPlan } from "./types";

function normalizeAreaAssignment(project: any) {
  if (project?.areaAssignment?.type === "existing") {
    return {
      type: "existing" as const,
      existingAreaId:
        typeof project?.areaAssignment?.existingAreaId === "string"
          ? project.areaAssignment.existingAreaId
          : undefined,
    };
  }

  if (project?.areaAssignment?.type === "new") {
    return {
      type: "new" as const,
      newAreaKey:
        typeof project?.areaAssignment?.newAreaKey === "string"
          ? project.areaAssignment.newAreaKey
          : undefined,
    };
  }

  if (typeof project?.existingAreaId === "string") {
    return {
      type: "existing" as const,
      existingAreaId: project.existingAreaId,
    };
  }

  if (typeof project?.newAreaKey === "string") {
    return {
      type: "new" as const,
      newAreaKey: project.newAreaKey,
    };
  }

  return {
    type: "new" as const,
    newAreaKey: "",
  };
}

export function normalizeGeneratedPlan(plan: any): GeneratedPlan {
  const rawNewAreas = Array.isArray(plan?.newAreas)
    ? plan.newAreas
    : Array.isArray(plan?.areas)
    ? plan.areas
    : [];

  const newAreas = rawNewAreas.map((area: any, index: number) => ({
    key:
      typeof area?.key === "string" && area.key.trim()
        ? area.key
        : `new-area-${index}`,
    name: area?.name || "",
    description: area?.description || "",
    icon: area?.icon || "compass",
    color: area?.color || "#6b7280",
  }));

  const projectsSource = Array.isArray(plan?.projects) ? plan.projects : [];
  const missingNewAreas = projectsSource
    .filter(
      (project: any) =>
        project?.areaAssignment?.type === "new" &&
        typeof project?.areaAssignment?.newAreaKey === "string" &&
        project.areaAssignment.newAreaKey &&
        !newAreas.some(
          (area: { key: string }) => area.key === project.areaAssignment.newAreaKey
        )
    )
    .map((project: any) => ({
      key: project.areaAssignment.newAreaKey,
      name: project?.areaName || project?.title || "새 영역",
      description: "",
      icon: "compass",
      color: "#6b7280",
    }));

  const normalizedNewAreas = Array.from(
    new Map(
      [...newAreas, ...missingNewAreas].map((area) => [area.key, area] as const)
    ).values()
  );

  const newAreaNameByKey = new Map(
    normalizedNewAreas.map((area) => [area.key, area.name])
  );

  const projects = projectsSource
    ? projectsSource.map((project: any) => {
        const areaAssignment = normalizeAreaAssignment(project);
        const tasks = Array.isArray(project?.tasks)
          ? project.tasks.map((task: any) => ({
              title: task?.title || "",
              description: task?.description || "",
              duration: typeof task?.duration === "number" ? task.duration : 1,
              requirements: Array.isArray(task?.requirements)
                ? task.requirements
                : [],
              resources: Array.isArray(task?.resources) ? task.resources : [],
              prerequisites: Array.isArray(task?.prerequisites)
                ? task.prerequisites
                : [],
            }))
          : [];

        const derivedAreaName =
          areaAssignment.type === "new" && areaAssignment.newAreaKey
            ? newAreaNameByKey.get(areaAssignment.newAreaKey) || project?.areaName || ""
            : project?.areaName || "";

        return {
          title: project?.title || "",
          description: project?.description || "",
          category:
            project?.category === "repetitive" ? "repetitive" : "task_based",
          areaName: derivedAreaName,
          areaAssignment,
          durationWeeks:
            typeof project?.durationWeeks === "number" ? project.durationWeeks : 1,
          difficulty: project?.difficulty || "intermediate",
          target: project?.target || "",
          targetCount:
            typeof project?.targetCount === "number"
              ? project.targetCount
              : 0,
          estimatedDailyTime:
            typeof project?.estimatedDailyTime === "number"
              ? project.estimatedDailyTime
              : 0,
          tasks,
          milestones: Array.isArray(project?.milestones) ? project.milestones : [],
          resources: Array.isArray(project?.resources) ? project.resources : [],
        };
      })
    : [];

  return {
    newAreas: normalizedNewAreas,
    projects,
    timeline:
      plan?.timeline && typeof plan.timeline === "object"
        ? {
            totalWeeks:
              typeof plan.timeline.totalWeeks === "number"
                ? plan.timeline.totalWeeks
                : 0,
            weeklySchedule: Array.isArray(plan.timeline.weeklySchedule)
              ? plan.timeline.weeklySchedule
              : [],
          }
        : { totalWeeks: 0, weeklySchedule: [] },
    successMetrics: Array.isArray(plan?.successMetrics)
      ? plan.successMetrics
      : [],
  };
}

export function validateGeneratedPlanForSave(plan: GeneratedPlan) {
  if (!Array.isArray(plan.projects) || plan.projects.length === 0) {
    return {
      isValid: false,
      error: "저장할 프로젝트가 없습니다.",
    };
  }

  const availableNewAreaKeys = new Set(
    (Array.isArray(plan.newAreas) ? plan.newAreas : [])
      .map((area) => area.key)
      .filter(Boolean)
  );

  for (const project of plan.projects) {
    if (!project.title.trim()) {
      return {
        isValid: false,
        error: "제목이 비어 있는 프로젝트가 있습니다.",
      };
    }

    if (!Array.isArray(project.tasks) || project.tasks.length === 0) {
      return {
        isValid: false,
        error: `프로젝트 "${project.title}"에 저장할 작업이 없습니다.`,
      };
    }

    if (project.areaAssignment?.type === "existing") {
      if (!project.areaAssignment.existingAreaId?.trim()) {
        return {
          isValid: false,
          error: `프로젝트 "${project.title}"에 연결된 기존 영역 ID가 없습니다.`,
        };
      }
    } else if (project.areaAssignment?.type === "new") {
      if (!project.areaAssignment.newAreaKey?.trim()) {
        return {
          isValid: false,
          error: `프로젝트 "${project.title}"에 연결된 새 영역 키가 없습니다.`,
        };
      }

      if (!availableNewAreaKeys.has(project.areaAssignment.newAreaKey)) {
        return {
          isValid: false,
          error: `프로젝트 "${project.title}"가 참조하는 새 영역 정의를 찾을 수 없습니다.`,
        };
      }
    } else {
      return {
        isValid: false,
        error: `프로젝트 "${project.title}"의 영역 매핑 정보가 없습니다.`,
      };
    }

    if (!project.areaName.trim()) {
      return {
        isValid: false,
        error: `프로젝트 "${project.title}"에 연결된 영역 이름이 없습니다.`,
      };
    }

    for (const task of project.tasks) {
      if (!task.title.trim()) {
        return {
          isValid: false,
          error: `프로젝트 "${project.title}"에 제목이 비어 있는 작업이 있습니다.`,
        };
      }
    }
  }

  return {
    isValid: true,
    error: "",
  };
}
