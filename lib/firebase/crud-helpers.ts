import { getProjectStatus } from "../utils";
import { Project, Resource } from "../types";

type WithOptionalStatus<T> = T & { status?: string };

export function buildNestedUpdateFields(
  prefix: string,
  updateData: Record<string, unknown>,
  updatedAtValue: unknown
) {
  const updateFields: Record<string, unknown> = {};

  Object.entries(updateData).forEach(([key, value]) => {
    if (value !== undefined) {
      updateFields[`${prefix}.${key}`] = value;
    }
  });

  updateFields[`${prefix}.updatedAt`] = updatedAtValue;

  return updateFields;
}

export function getProjectCollectionState(
  project: WithOptionalStatus<
    Pick<Project, "startDate" | "endDate" | "targetCount" | "completedTasks">
  >
): "active" | "archived" {
  if (project.status === "active" || project.status === "archived") {
    return project.status;
  }

  return getProjectStatus(project as Project) === "completed"
    ? "archived"
    : "active";
}

export function getResourceCollectionState(
  resource: WithOptionalStatus<Resource>
): "active" | "archived" {
  return resource.status === "archived" ? "archived" : "active";
}

export function addAreaCounts(
  counts: { projectCount?: number; resourceCount?: number } | undefined,
  delta: { projectCount?: number; resourceCount?: number }
) {
  return {
    projectCount: Math.max(0, (counts?.projectCount ?? 0) + (delta.projectCount ?? 0)),
    resourceCount: Math.max(
      0,
      (counts?.resourceCount ?? 0) + (delta.resourceCount ?? 0)
    ),
  };
}
