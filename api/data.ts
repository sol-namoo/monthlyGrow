// src/api/data.ts

import {
  fetchChapterById,
  fetchProjectsByChapterId,
  fetchAllTasksByProjectId,
  fetchProjectById,
  fetchAllAreasByUserId,
  fetchAreaById,
  fetchResourceById,
  fetchAllProjectsByUserId,
  fetchAllChaptersByUserId,
  fetchArchivedItemsByUserId,
} from "../lib/firebase"; // lib/firebase.ts에서 기본 함수들을 import
import { Area, Chapter, Project, Resource, Task } from "../lib/types";

// Chapters
export const getChapter = async (chapterId: string): Promise<Chapter> => {
  return fetchChapterById(chapterId);
};

export const getChaptersByUserId = async (
  userId: string
): Promise<Chapter[]> => {
  return fetchAllChaptersByUserId(userId);
};

// Projects
export const getProject = async (projectId: string): Promise<Project> => {
  return fetchProjectById(projectId);
};

export const getProjectsByChapterId = async (
  chapterId: string
): Promise<Project[]> => {
  return fetchProjectsByChapterId(chapterId);
};

export const getProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  return fetchAllProjectsByUserId(userId);
};

// 현재 챕터의 프로젝트만 가져오는 함수
export const getCurrentChapterProjects = async (
  userId: string,
  currentChapterId: string
): Promise<Project[]> => {
  return fetchProjectsByChapterId(currentChapterId);
};

// 연결되지 않은 프로젝트들만 가져오는 함수
export const getUnconnectedProjects = async (
  userId: string,
  excludeChapterId?: string
): Promise<Project[]> => {
  // TODO: 연결되지 않은 프로젝트 필터링 로직 구현
  const allProjects = await fetchAllProjectsByUserId(userId);
  return allProjects.filter(
    (project) =>
      !project.connectedChapters || project.connectedChapters.length === 0
  );
};

// Tasks
export const getTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  return fetchAllTasksByProjectId(projectId);
};

// Snapshots
export const getSnapshotsByChapterId = async (
  chapterId: string
): Promise<any[]> => {
  // TODO: Snapshot 타입으로 변경
  // TODO: implement getSnapshotsByChapterId
  return [];
};
// Areas
export const getArea = async (areaId: string): Promise<Area> => {
  return fetchAreaById(areaId);
};

// Resources
export const getResource = async (resourceId: string): Promise<Resource> => {
  return fetchResourceById(resourceId);
};

// Archive
export const getArchive = async (archiveId: string): Promise<any> => {
  // TODO: Archive 타입으로 변경
  // TODO: implement getArchive
  return {};
};
