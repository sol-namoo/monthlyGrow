// src/api/data.ts

import {
  fetchMonthlyById,
  fetchProjectsByMonthlyId,
  fetchAllTasksByProjectId,
  fetchProjectById,
  fetchAllAreasByUserId,
  fetchAreaById,
  fetchResourceById,
  fetchAllProjectsByUserId,
  fetchAllMonthliesByUserId,
  fetchUnifiedArchiveById,
} from "../lib/firebase/index"; // lib/firebase/index.ts에서 기본 함수들을 import
import { Area, Monthly, Project, Resource, Task, UnifiedArchive } from "../lib/types";

// Monthlies
export const getMonthly = async (monthlyId: string): Promise<Monthly> => {
  return fetchMonthlyById(monthlyId);
};

export const getMonthliesByUserId = async (
  userId: string
): Promise<Monthly[]> => {
  return fetchAllMonthliesByUserId(userId);
};

// Projects
export const getProject = async (projectId: string): Promise<Project> => {
  return fetchProjectById(projectId);
};

export const getProjectsByMonthlyId = async (
  monthlyId: string
): Promise<Project[]> => {
  return fetchProjectsByMonthlyId(monthlyId);
};

export const getProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  return fetchAllProjectsByUserId(userId);
};

// 현재 먼슬리의 프로젝트만 가져오는 함수
export const getCurrentMonthlyProjects = async (
  userId: string,
  currentMonthlyId: string
): Promise<Project[]> => {
  return fetchProjectsByMonthlyId(currentMonthlyId);
};

// Tasks
export const getTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  return fetchAllTasksByProjectId(projectId);
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
export const getArchive = async (
  archiveId: string
): Promise<UnifiedArchive | null> => {
  return fetchUnifiedArchiveById(archiveId);
};
