import type { Area, Monthly, Project, Resource, UnifiedArchive } from "../types";

export interface IntegrityIssue {
  code:
    | "area_count_mismatch"
    | "missing_project_area"
    | "missing_monthly_project_link"
    | "missing_project_monthly_link"
    | "orphan_archive_parent";
  message: string;
  entityId?: string;
}

type IntegrityGraph = {
  areas: Area[];
  resources: Resource[];
  projects: Project[];
  monthlies: Monthly[];
  archives: UnifiedArchive[];
};

export const auditDataIntegrity = ({
  areas,
  resources,
  projects,
  monthlies,
  archives,
}: IntegrityGraph): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const areaById = new Map(areas.map((area) => [area.id, area]));
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const monthlyById = new Map(monthlies.map((monthly) => [monthly.id, monthly]));

  for (const area of areas) {
    const actualProjectCount = projects.filter(
      (project) => project.areaId === area.id
    ).length;
    const actualResourceCount = resources.filter(
      (resource) => resource.areaId === area.id
    ).length;
    const storedCounts = area.counts || { projectCount: 0, resourceCount: 0 };

    if (
      storedCounts.projectCount !== actualProjectCount ||
      storedCounts.resourceCount !== actualResourceCount
    ) {
      issues.push({
        code: "area_count_mismatch",
        entityId: area.id,
        message: `Area ${area.id} stored counts (${storedCounts.projectCount}/${storedCounts.resourceCount}) do not match actual counts (${actualProjectCount}/${actualResourceCount}).`,
      });
    }
  }

  for (const project of projects) {
    if (project.areaId && !areaById.has(project.areaId)) {
      issues.push({
        code: "missing_project_area",
        entityId: project.id,
        message: `Project ${project.id} points to missing area ${project.areaId}.`,
      });
    }

    for (const monthlyId of project.connectedMonthlies || []) {
      const monthly = monthlyById.get(monthlyId);
      const hasReverseLink = monthly?.connectedProjects?.some(
        (item) => item.projectId === project.id
      );

      if (!monthly || !hasReverseLink) {
        issues.push({
          code: "missing_monthly_project_link",
          entityId: project.id,
          message: `Project ${project.id} references monthly ${monthlyId}, but the reverse monthly.connectedProjects link is missing.`,
        });
      }
    }
  }

  for (const monthly of monthlies) {
    for (const connection of monthly.connectedProjects || []) {
      const project = projectById.get(connection.projectId);
      const hasReverseLink = project?.connectedMonthlies?.includes(monthly.id);

      if (!project || !hasReverseLink) {
        issues.push({
          code: "missing_project_monthly_link",
          entityId: monthly.id,
          message: `Monthly ${monthly.id} references project ${connection.projectId}, but the reverse project.connectedMonthlies link is missing.`,
        });
      }
    }
  }

  for (const archive of archives) {
    const parentExists =
      archive.parentType === "monthly"
        ? monthlyById.has(archive.parentId)
        : projectById.has(archive.parentId);

    if (!parentExists) {
      issues.push({
        code: "orphan_archive_parent",
        entityId: archive.id,
        message: `Archive ${archive.id} points to missing ${archive.parentType} parent ${archive.parentId}.`,
      });
    }
  }

  return issues;
};
