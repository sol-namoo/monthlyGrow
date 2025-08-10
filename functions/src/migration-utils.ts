// 마이그레이션 유틸리티 함수들
// functions/src/migration-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

interface ConnectedProjectGoal {
  projectId: string;
  chapterTargetCount: number;
  chapterDoneCount: number;
}

interface LegacyChapter {
  id: string;
  userId: string;
  title: string;
  startDate: any;
  endDate: any;
  focusAreas: string[];
  projectIds?: string[]; // 기존 구조
  reward?: string;
  doneCount: number;
  targetCount: number;
  connectedProjects?: ConnectedProjectGoal[]; // 새로운 구조
  createdAt: any;
  updatedAt: any;
}

interface LegacyProject {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: string;
  areaId?: string;
  area?: string;
  target: number;
  completedTasks: number;
  startDate: any;
  endDate: any;
  chapterId?: string; // 기존 구조
  connectedChapters?: any[]; // 새로운 구조
  createdAt: any;
  updatedAt: any;
}

/**
 * 기존 Chapter 데이터를 새로운 구조로 마이그레이션합니다.
 * projectIds 배열을 connectedProjects 배열로 변환합니다.
 */
export const migrateChapterStructure = async (
  chapterId: string
): Promise<void> => {
  const chapterRef = db.collection("chapters").doc(chapterId);
  const chapterDoc = await chapterRef.get();

  if (!chapterDoc.exists) {
    throw new Error(`Chapter ${chapterId} not found`);
  }

  const chapterData = chapterDoc.data() as LegacyChapter;

  // 이미 마이그레이션된 경우 스킵
  if (
    chapterData.connectedProjects &&
    chapterData.connectedProjects.length > 0
  ) {
    console.log(`Chapter ${chapterId} already migrated`);
    return;
  }

  const projectIds = chapterData.projectIds || [];
  const connectedProjects: ConnectedProjectGoal[] = [];

  // 각 프로젝트에 대해 기본 목표치 계산
  for (const projectId of projectIds) {
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (projectDoc.exists) {
      const projectData = projectDoc.data() as LegacyProject;

      // 기본 목표치 계산 (프로젝트 전체 목표치를 챕터 기간에 비례하여 분배)
      const defaultTarget = calculateDefaultChapterTarget(
        projectData,
        chapterData.startDate.toDate(),
        chapterData.endDate.toDate()
      );

      // 챕터 기간 동안 완료된 태스크 수 계산
      const chapterDoneCount = await calculateChapterDoneCount(
        projectId,
        chapterData.startDate.toDate(),
        chapterData.endDate.toDate()
      );

      connectedProjects.push({
        projectId,
        chapterTargetCount: defaultTarget,
        chapterDoneCount,
      });
    }
  }

  // Chapter 업데이트
  await chapterRef.update({
    connectedProjects,
    updatedAt: new Date(),
  });

  console.log(
    `Migrated chapter ${chapterId} with ${connectedProjects.length} projects`
  );
};

/**
 * 모든 Chapter를 새로운 구조로 마이그레이션합니다.
 */
export const migrateAllChapters = async (): Promise<void> => {
  const chaptersQuery = db.collection("chapters");
  const querySnapshot = await chaptersQuery.get();

  console.log(`Found ${querySnapshot.docs.length} chapters to migrate`);

  for (const doc of querySnapshot.docs) {
    try {
      await migrateChapterStructure(doc.id);
    } catch (error) {
      console.error(`Failed to migrate chapter ${doc.id}:`, error);
    }
  }

  console.log("Chapter migration completed");
};

/**
 * 특정 사용자의 모든 Chapter를 마이그레이션합니다.
 */
export const migrateUserChapters = async (userId: string): Promise<void> => {
  const chaptersQuery = db.collection("chapters").where("userId", "==", userId);
  const querySnapshot = await chaptersQuery.get();

  console.log(`Found ${querySnapshot.docs.length} chapters for user ${userId}`);

  for (const doc of querySnapshot.docs) {
    try {
      await migrateChapterStructure(doc.id);
    } catch (error) {
      console.error(`Failed to migrate chapter ${doc.id}:`, error);
    }
  }

  console.log(`User ${userId} chapter migration completed`);
};

/**
 * 챕터별 목표치의 기본값을 계산합니다.
 */
const calculateDefaultChapterTarget = (
  project: LegacyProject,
  chapterStartDate: Date,
  chapterEndDate: Date
): number => {
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);

  // 프로젝트와 챕터의 겹치는 기간 계산
  const overlapStart = new Date(
    Math.max(projectStart.getTime(), chapterStartDate.getTime())
  );
  const overlapEnd = new Date(
    Math.min(projectEnd.getTime(), chapterEndDate.getTime())
  );

  if (overlapEnd <= overlapStart) {
    return 0; // 겹치는 기간이 없음
  }

  // 전체 프로젝트 기간
  const totalProjectDays =
    (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
  // 겹치는 기간
  const overlapDays =
    (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);

  // 비례하여 목표치 계산
  const ratio = overlapDays / totalProjectDays;
  return Math.round(project.target * ratio);
};

/**
 * 챕터 기간 동안 완료된 태스크 수를 계산합니다.
 */
const calculateChapterDoneCount = async (
  projectId: string,
  chapterStartDate: Date,
  chapterEndDate: Date
): Promise<number> => {
  const tasksQuery = db
    .collection("projects")
    .doc(projectId)
    .collection("tasks")
    .where("done", "==", true)
    .where("date", ">=", chapterStartDate)
    .where("date", "<=", chapterEndDate);

  const querySnapshot = await tasksQuery.get();
  return querySnapshot.docs.length;
};

/**
 * 기존 Project의 connectedChapters 배열을 업데이트합니다.
 */
export const migrateProjectConnections = async (
  projectId: string
): Promise<void> => {
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const projectData = projectDoc.data() as LegacyProject;

  // 이미 마이그레이션된 경우 스킵
  if (
    projectData.connectedChapters &&
    projectData.connectedChapters.length > 0
  ) {
    console.log(`Project ${projectId} already migrated`);
    return;
  }

  const connectedChapters: any[] = [];

  // chapterId가 있는 경우 추가
  if (projectData.chapterId) {
    connectedChapters.push({ id: projectData.chapterId });
  }

  // projectIds를 가진 챕터들 찾기
  const chaptersQuery = db.collection("chapters");
  const querySnapshot = await chaptersQuery.get();

  for (const doc of querySnapshot.docs) {
    const chapterData = doc.data() as LegacyChapter;
    if (chapterData.projectIds && chapterData.projectIds.includes(projectId)) {
      connectedChapters.push({ id: doc.id });
    }
  }

  // Project 업데이트
  await projectRef.update({
    connectedChapters,
    updatedAt: new Date(),
  });

  console.log(
    `Migrated project ${projectId} with ${connectedChapters.length} chapters`
  );
};

/**
 * 모든 Project를 새로운 구조로 마이그레이션합니다.
 */
export const migrateAllProjects = async (): Promise<void> => {
  const projectsQuery = db.collection("projects");
  const querySnapshot = await projectsQuery.get();

  console.log(`Found ${querySnapshot.docs.length} projects to migrate`);

  for (const doc of querySnapshot.docs) {
    try {
      await migrateProjectConnections(doc.id);
    } catch (error) {
      console.error(`Failed to migrate project ${doc.id}:`, error);
    }
  }

  console.log("Project migration completed");
};

/**
 * 특정 사용자의 모든 Project를 마이그레이션합니다.
 */
export const migrateUserProjects = async (userId: string): Promise<void> => {
  const projectsQuery = db.collection("projects").where("userId", "==", userId);
  const querySnapshot = await projectsQuery.get();

  console.log(`Found ${querySnapshot.docs.length} projects for user ${userId}`);

  for (const doc of querySnapshot.docs) {
    try {
      await migrateProjectConnections(doc.id);
    } catch (error) {
      console.error(`Failed to migrate project ${doc.id}:`, error);
    }
  }

  console.log(`User ${userId} project migration completed`);
};

/**
 * 전체 데이터베이스를 새로운 구조로 마이그레이션합니다.
 */
export const migrateEntireDatabase = async (): Promise<void> => {
  console.log("Starting database migration...");

  try {
    // 1. 모든 Chapter 마이그레이션
    await migrateAllChapters();

    // 2. 모든 Project 마이그레이션
    await migrateAllProjects();

    console.log("Database migration completed successfully");
  } catch (error) {
    console.error("Database migration failed:", error);
    throw error;
  }
};

/**
 * 특정 사용자의 데이터를 새로운 구조로 마이그레이션합니다.
 */
export const migrateUserData = async (userId: string): Promise<void> => {
  console.log(`Starting migration for user ${userId}...`);

  try {
    // 1. 사용자의 모든 Chapter 마이그레이션
    await migrateUserChapters(userId);

    // 2. 사용자의 모든 Project 마이그레이션
    await migrateUserProjects(userId);

    console.log(`User ${userId} migration completed successfully`);
  } catch (error) {
    console.error(`User ${userId} migration failed:`, error);
    throw error;
  }
};
