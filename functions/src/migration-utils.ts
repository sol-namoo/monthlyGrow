// 마이그레이션 유틸리티 함수들
// functions/src/migration-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

interface ConnectedProjectGoal {
  projectId: string;
  monthlyTargetCount: number;
  monthlyDoneCount: number;
}

interface LegacyMonthly {
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
  monthlyId?: string; // 기존 구조
  connectedMonthlies?: any[]; // 새로운 구조
  createdAt: any;
  updatedAt: any;
}

/**
 * 기존 Monthly 데이터를 새로운 구조로 마이그레이션합니다.
 * projectIds 배열을 connectedProjects 배열로 변환합니다.
 */
export const migrateMonthlyStructure = async (
  monthlyId: string
): Promise<void> => {
  const monthlyRef = db.collection("monthlies").doc(monthlyId);
  const monthlyDoc = await monthlyRef.get();

  if (!monthlyDoc.exists) {
    throw new Error(`Monthly ${monthlyId} not found`);
  }

  const monthlyData = monthlyDoc.data() as LegacyMonthly;

  // 이미 마이그레이션된 경우 스킵
  if (
    monthlyData.connectedProjects &&
    monthlyData.connectedProjects.length > 0
  ) {
    console.log(`Monthly ${monthlyId} already migrated`);
    return;
  }

  const projectIds = monthlyData.projectIds || [];
  const connectedProjects: ConnectedProjectGoal[] = [];

  // 각 프로젝트에 대해 기본 목표치 계산
  for (const projectId of projectIds) {
    const projectRef = db.collection("projects").doc(projectId);
    const projectDoc = await projectRef.get();

    if (projectDoc.exists) {
      const projectData = projectDoc.data() as LegacyProject;

      // 기본 목표치 계산 (프로젝트 전체 목표치를 먼슬리 기간에 비례하여 분배)
      const defaultTarget = calculateDefaultMonthlyTarget(
        projectData,
        monthlyData.startDate.toDate(),
        monthlyData.endDate.toDate()
      );

      // 먼슬리 기간 동안 완료된 태스크 수 계산
      const monthlyDoneCount = await calculateMonthlyDoneCount(
        projectId,
        monthlyData.startDate.toDate(),
        monthlyData.endDate.toDate()
      );

      connectedProjects.push({
        projectId,
        monthlyTargetCount: defaultTarget,
        monthlyDoneCount,
      });
    }
  }

  // Monthly 업데이트
  await monthlyRef.update({
    connectedProjects,
    updatedAt: new Date(),
  });

  console.log(
    `Migrated monthly ${monthlyId} with ${connectedProjects.length} projects`
  );
};

/**
 * 모든 Monthly를 새로운 구조로 마이그레이션합니다.
 */
export const migrateAllMonthlies = async (): Promise<void> => {
  const monthliesQuery = db.collection("monthlies");
  const querySnapshot = await monthliesQuery.get();

  console.log(`Found ${querySnapshot.docs.length} monthlies to migrate`);

  for (const doc of querySnapshot.docs) {
    try {
      await migrateMonthlyStructure(doc.id);
    } catch (error) {
      console.error(`Failed to migrate monthly ${doc.id}:`, error);
    }
  }

  console.log("Monthly migration completed");
};

/**
 * 특정 사용자의 모든 Monthly를 마이그레이션합니다.
 */
export const migrateUserMonthlies = async (userId: string): Promise<void> => {
  const monthliesQuery = db
    .collection("monthlies")
    .where("userId", "==", userId);
  const querySnapshot = await monthliesQuery.get();

  console.log(
    `Found ${querySnapshot.docs.length} monthlies for user ${userId}`
  );

  for (const doc of querySnapshot.docs) {
    try {
      await migrateMonthlyStructure(doc.id);
    } catch (error) {
      console.error(`Failed to migrate monthly ${doc.id}:`, error);
    }
  }

  console.log(`User ${userId} monthly migration completed`);
};

/**
 * 먼슬리별 목표치의 기본값을 계산합니다.
 */
const calculateDefaultMonthlyTarget = (
  project: LegacyProject,
  monthlyStartDate: Date,
  monthlyEndDate: Date
): number => {
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);

  // 프로젝트와 먼슬리의 겹치는 기간 계산
  const overlapStart = new Date(
    Math.max(projectStart.getTime(), monthlyStartDate.getTime())
  );
  const overlapEnd = new Date(
    Math.min(projectEnd.getTime(), monthlyEndDate.getTime())
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
 * 먼슬리 기간 동안 완료된 태스크 수를 계산합니다.
 */
const calculateMonthlyDoneCount = async (
  projectId: string,
  monthlyStartDate: Date,
  monthlyEndDate: Date
): Promise<number> => {
  const tasksQuery = db
    .collection("projects")
    .doc(projectId)
    .collection("tasks")
    .where("done", "==", true)
    .where("date", ">=", monthlyStartDate)
    .where("date", "<=", monthlyEndDate);

  const querySnapshot = await tasksQuery.get();
  return querySnapshot.docs.length;
};

/**
 * 기존 Project의 connectedMonthlies 배열을 업데이트합니다.
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
    projectData.connectedMonthlies &&
    projectData.connectedMonthlies.length > 0
  ) {
    console.log(`Project ${projectId} already migrated`);
    return;
  }

  const connectedMonthlies: any[] = [];

  // monthlyId가 있는 경우 추가
  if (projectData.monthlyId) {
    connectedMonthlies.push({ id: projectData.monthlyId });
  }

  // projectIds를 가진 먼슬리들 찾기
  const monthliesQuery = db.collection("monthlies");
  const querySnapshot = await monthliesQuery.get();

  for (const doc of querySnapshot.docs) {
    const monthlyData = doc.data() as LegacyMonthly;
    if (monthlyData.projectIds && monthlyData.projectIds.includes(projectId)) {
      connectedMonthlies.push({ id: doc.id });
    }
  }

  // Project 업데이트
  await projectRef.update({
    connectedMonthlies,
    updatedAt: new Date(),
  });

  console.log(
    `Migrated project ${projectId} with ${connectedMonthlies.length} monthlies`
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
    // 1. 모든 Monthly 마이그레이션
    await migrateAllMonthlies();

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
    // 1. 사용자의 모든 Monthly 마이그레이션
    await migrateUserMonthlies(userId);

    // 2. 사용자의 모든 Project 마이그레이션
    await migrateUserProjects(userId);

    console.log(`User ${userId} migration completed successfully`);
  } catch (error) {
    console.error(`User ${userId} migration failed:`, error);
    throw error;
  }
};
