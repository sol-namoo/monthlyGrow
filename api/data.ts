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
} from "../lib/firebase/index"; // lib/firebase/index.ts에서 기본 함수들을 import
import { Area, Monthly, Project, Resource, Task } from "../lib/types";

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

// 연결되지 않은 프로젝트들만 가져오는 함수
export const getUnconnectedProjects = async (
  userId: string,
  excludeMonthlyId?: string
): Promise<Project[]> => {
  // 새로운 구조에서는 모든 프로젝트가 연결되지 않은 상태로 간주
  const allProjects = await fetchAllProjectsByUserId(userId);
  return allProjects;
};

// Tasks
export const getTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  return fetchAllTasksByProjectId(projectId);
};

// Snapshots
export const getSnapshotsByMonthlyId = async (
  monthlyId: string
): Promise<any[]> => {
  // TODO: Snapshot 타입으로 변경
  // TODO: implement getSnapshotsByMonthlyId
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
