// src/api/data.ts

import {
    fetchLoopById,
    fetchProjectsByLoopId,
    fetchAllTasksByProjectId,
    fetchProjectById,
    fetchAllAreasByUserId,
    fetchAreaById,
    fetchResourceById,
    fetchAllProjectsByUserId,
    fetchAllLoopsByUserId,
    fetchArchivedItemsByUserId
} from '../lib/firebase'; // lib/firebase.ts에서 기본 함수들을 import
import { Area, Loop, Project, Resource, Task } from '../lib/types';

// Loops
export const getLoop = async (loopId: string): Promise<Loop> => {
    return fetchLoopById(loopId);
};

export const getLoopsByUserId = async (userId: string): Promise<Loop[]> => {
    return fetchAllLoopsByUserId(userId);
};

// Projects
export const getProject = async (projectId: string): Promise<Project> => {
    return fetchProjectById(projectId);
};

export const getProjectsByLoopId = async (loopId: string): Promise<Project[]> => {
    return fetchProjectsByLoopId(loopId);
};

export const getProjectsByUserId = async (userId: string): Promise<Project[]> => {
    return fetchAllProjectsByUserId(userId);
};

// Tasks
export const getTasksByProjectId = async (projectId: string): Promise<Task[]> => {
    return fetchAllTasksByProjectId(projectId);
};

// Snapshots
export const getSnapshotsByLoopId = async (loopId: string): Promise<any[]> => { // TODO: Snapshot 타입으로 변경
    // TODO: implement getSnapshotsByLoopId
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
export const getArchive = async (archiveId: string): Promise<any> => { // TODO: Archive 타입으로 변경
    // TODO: implement getArchive
    return {};
};
