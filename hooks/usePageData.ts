// src/hooks/usePageData.ts

import { useQuery } from "@tanstack/react-query";
import {
  getMonthly,
  getProjectsByMonthlyId,
  getSnapshotsByMonthlyId,
  getProject,
  getTasksByProjectId,
  getArea,
  getResource,
  getArchive,
  getProjectsByUserId,
  getMonthliesByUserId,
} from "../api/data"; // api/data.ts를 import

interface Options {
  userId?: string;
  monthlyId?: string;
  projectId?: string;
  areaId?: string;
  resourceId?: string;
  archiveId?: string;
}

// 각 페이지에서 사용할 데이터들의 묶음.
export const usePageData = (
  page:
    | "home"
    | "monthlyDetail"
    | "projectDetail"
    | "newMonthly"
    | "area"
    | "resource"
    | "archive",
  options: Options
) => {
  if (page === "home") {
    const { userId = "" } = options;
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["projects"],
      queryFn: () => getProjectsByUserId(userId),
    });
    const {
      data: monthlies,
      isLoading: monthliesLoading,
      error: monthliesError,
    } = useQuery({
      queryKey: ["monthlies"],
      queryFn: () => getMonthliesByUserId(userId),
    });
    return {
      projects,
      monthlies,
      isLoading: monthliesLoading || projectsLoading,
      error: monthliesError || projectsError,
    };
  }

  if (page === "monthlyDetail") {
    const { monthlyId = "" } = options;
    const {
      data: monthly,
      isLoading: monthlyLoading,
      error: monthlyError,
    } = useQuery({
      queryKey: ["monthlies", monthlyId],
      queryFn: () => getMonthly(monthlyId),
    });
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["monthlies", monthlyId, "projects"],
      queryFn: () => getProjectsByMonthlyId(monthlyId),
    });
    const {
      data: snapshots,
      isLoading: snapshotsLoading,
      error: snapshotsError,
    } = useQuery({
      queryKey: ["monthlies", monthlyId, "snapshots"],
      queryFn: () => getSnapshotsByMonthlyId(monthlyId),
    });
    return {
      monthly,
      projects,
      snapshots,
      isLoading: monthlyLoading || projectsLoading || snapshotsLoading,
      error: monthlyError || projectsError || snapshotsError,
    };
  }

  if (page === "projectDetail") {
    const { projectId = "" } = options;
    const {
      data: project,
      isLoading: projectLoading,
      error: projectError,
    } = useQuery({
      queryKey: ["projects", projectId],
      queryFn: () => getProject(projectId),
    });
    const {
      data: tasks,
      isLoading: tasksLoading,
      error: tasksError,
    } = useQuery({
      queryKey: ["projects", projectId, "tasks"],
      queryFn: () => getTasksByProjectId(projectId),
    });
    return {
      project,
      tasks,
      isLoading: projectLoading || tasksLoading,
      error: projectError || tasksError,
    };
  }
  if (page === "newMonthly") {
    // TODO: implement newMonthly data fetching
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["projects"],
      queryFn: () => getProjectsByUserId("user1"),
    });
    return { projects, isLoading: projectsLoading, error: projectsError };
  }
  if (page === "area") {
    const { areaId = "" } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["areas", areaId],
      queryFn: () => getArea(areaId),
    });
    return { data, isLoading, error };
  }
  if (page === "resource") {
    const { resourceId = "" } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["resources", resourceId],
      queryFn: () => getResource(resourceId),
    });
    return { data, isLoading, error };
  }
  if (page === "archive") {
    const { archiveId = "" } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["archives", archiveId],
      queryFn: () => getArchive(archiveId),
    });
    return { data, isLoading, error };
  }
  // ... 다른 페이지에 대한 로직 ...
  return {};
};
