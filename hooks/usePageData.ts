// src/hooks/usePageData.ts

import { useQuery } from "@tanstack/react-query";
import {
  getLoop,
  getProjectsByLoopId,
  getSnapshotsByLoopId,
  getProject,
  getTasksByProjectId,
  getArea,
  getResource,
  getArchive,
  getProjectsByUserId,
  getLoopsByUserId,
} from "../api/data"; // api/data.ts를 import

// 각 페이지에서 사용할 데이터들의 묶음.
export const usePageData = (
  page:
    | "home"
    | "loopDetail"
    | "projectDetail"
    | "newLoop"
    | "area"
    | "resource"
    | "archive",
  options?: any
) => {
  if (page === "home") {
    // TODO: implement home data fetching
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["projects"],
      queryFn: () => getProjectsByUserId("user1"),
    }); // user1은 임시 유저입니다.
    const {
      data: loops,
      isLoading: loopsLoading,
      error: loopsError,
    } = useQuery({
      queryKey: ["loops"],
      queryFn: () => getLoopsByUserId("user1"),
    }); // user1은 임시 유저입니다.
    return {
      projects,
      loops,
      isLoading: loopsLoading || projectsLoading,
      error: loopsError || projectsError,
    };
  }

  if (page === "loopDetail") {
    const { loopId } = options;
    const {
      data: loop,
      isLoading: loopLoading,
      error: loopError,
    } = useQuery({
      queryKey: ["loops", loopId],
      queryFn: () => getLoop(loopId),
    });
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["loops", loopId, "projects"],
      queryFn: () => getProjectsByLoopId(loopId),
    });
    const {
      data: snapshots,
      isLoading: snapshotsLoading,
      error: snapshotsError,
    } = useQuery({
      queryKey: ["loops", loopId, "snapshots"],
      queryFn: () => getSnapshotsByLoopId(loopId),
    });
    return {
      loop,
      projects,
      snapshots,
      isLoading: loopLoading || projectsLoading || snapshotsLoading,
      error: loopError || projectsError || snapshotsError,
    };
  }

  if (page === "projectDetail") {
    const { projectId } = options;
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
  if (page === "newLoop") {
    // TODO: implement newLoop data fetching
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["projects"],
      queryFn: () => getProjectsByUserId("user1"),
    }); // user1은 임시 유저입니다.
    return { projects, isLoading: projectsLoading, error: projectsError };
  }
  if (page === "area") {
    const { areaId } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["areas", areaId],
      queryFn: () => getArea(areaId),
    });
    return { data, isLoading, error };
  }
  if (page === "resource") {
    const { resourceId } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["resources", resourceId],
      queryFn: () => getResource(resourceId),
    });
    return { data, isLoading, error };
  }
  if (page === "archive") {
    const { archiveId } = options;
    const { data, isLoading, error } = useQuery({
      queryKey: ["archives", archiveId],
      queryFn: () => getArchive(archiveId),
    });
    return { data, isLoading, error };
  }
  // ... 다른 페이지에 대한 로직 ...
  return {};
};
