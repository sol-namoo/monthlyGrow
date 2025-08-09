// src/hooks/usePageData.ts

import { useQuery } from "@tanstack/react-query";
import {
  getChapter,
  getProjectsByChapterId,
  getSnapshotsByChapterId,
  getProject,
  getTasksByProjectId,
  getArea,
  getResource,
  getArchive,
  getProjectsByUserId,
  getChaptersByUserId,
} from "../api/data"; // api/data.ts를 import

interface Options {
  userId?: string;
  chapterId?: string;
  projectId?: string;
  areaId?: string;
  resourceId?: string;
  archiveId?: string;
}

// 각 페이지에서 사용할 데이터들의 묶음.
export const usePageData = (
  page:
    | "home"
    | "chapterDetail"
    | "projectDetail"
    | "newChapter"
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
      data: chapters,
      isLoading: chaptersLoading,
      error: chaptersError,
    } = useQuery({
      queryKey: ["chapters"],
      queryFn: () => getChaptersByUserId(userId),
    });
    return {
      projects,
      chapters,
      isLoading: chaptersLoading || projectsLoading,
      error: chaptersError || projectsError,
    };
  }

  if (page === "chapterDetail") {
    const { chapterId = "" } = options;
    const {
      data: chapter,
      isLoading: chapterLoading,
      error: chapterError,
    } = useQuery({
      queryKey: ["chapters", chapterId],
      queryFn: () => getChapter(chapterId),
    });
    const {
      data: projects,
      isLoading: projectsLoading,
      error: projectsError,
    } = useQuery({
      queryKey: ["chapters", chapterId, "projects"],
      queryFn: () => getProjectsByChapterId(chapterId),
    });
    const {
      data: snapshots,
      isLoading: snapshotsLoading,
      error: snapshotsError,
    } = useQuery({
      queryKey: ["chapters", chapterId, "snapshots"],
      queryFn: () => getSnapshotsByChapterId(chapterId),
    });
    return {
      chapter,
      projects,
      snapshots,
      isLoading: chapterLoading || projectsLoading || snapshotsLoading,
      error: chapterError || projectsError || snapshotsError,
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
  if (page === "newChapter") {
    // TODO: implement newChapter data fetching
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
