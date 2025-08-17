// Cloud Functions용 Firebase 유틸리티 함수들
// functions/src/firebase-utils.ts

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin 초기화 (이미 초기화된 경우 스킵)
if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

// 타입 정의
interface KeyResult {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  targetCount?: number;
  completedCount?: number;
}

interface Project {
  id: string;
  title: string;
  completedTasks: number; // 전체 실제 완료된 태스크 수
  [key: string]: any;
}

interface Monthly {
  id: string;
  title: string;
  startDate: any;
  endDate: any;
  objective: string;
  keyResults: KeyResult[];
  [key: string]: any;
}

// Area 타입은 snapshot-utils.ts에서 사용됨

// 사용자 설정 가져오기
export const fetchUserSettings = async (userId: string) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      console.log(`User ${userId} not found`);
      return null;
    }

    const userData = userDoc.data();
    return (
      userData?.settings || {
        defaultReward: "",
        defaultRewardEnabled: false,
        carryOver: true, // 기본값 true
        aiRecommendations: true,
        notifications: true,
        theme: "system",
        language: "ko",
      }
    );
  } catch (error) {
    console.error(`Error fetching user settings for ${userId}:`, error);
    return null;
  }
};

// 이월 설정 확인
export const isCarryOverEnabled = async (userId: string): Promise<boolean> => {
  const settings = await fetchUserSettings(userId);
  return settings?.carryOver ?? true; // 기본값 true
};

// 자동 이관을 위한 함수: 완료된 먼슬리의 미완료 프로젝트를 다음 먼슬리로 이관
export const autoMigrateIncompleteProjects = async (
  userId: string,
  completedMonthlyId: string
): Promise<void> => {
  // 사용자 설정 확인
  const carryOverEnabled = await isCarryOverEnabled(userId);

  if (!carryOverEnabled) {
    console.log(
      `Carry over is disabled for user ${userId}. Skipping migration.`
    );
    return;
  }

  // 1. 미완료 프로젝트 찾기
  const incompleteProjects = await findIncompleteProjectsInMonthly(
    completedMonthlyId
  );

  if (incompleteProjects.length === 0) {
    console.log("No incomplete projects to migrate");
    return;
  }

  // 2. 다음 달 먼슬리 찾기 (이번 달 먼슬리가 없으면 다음 달 먼슬리에 추가)
  const allMonthlies = await fetchAllMonthliesByUserId(userId);

  // 현재 날짜 기준으로 다음 달 먼슬리 찾기
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const targetMonthlies = allMonthlies
    .filter((monthly) => {
      const monthlyStartDate = new Date(monthly.startDate);
      const status = getMonthlyStatus(monthly);
      // 다음 달에 시작하는 먼슬리이거나 현재 진행 중인 먼슬리
      // (이번 달 먼슬리가 없으면 다음 달 먼슬리에 추가)
      return (
        (monthlyStartDate >= nextMonth || status === "in_progress") &&
        status !== "ended"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const targetMonthly = targetMonthlies[0]; // 가장 빠른 미래 먼슬리

  if (!targetMonthly) {
    // 다음 달 먼슬리가 없으면 프로젝트에 이관 대기 상태로 마킹
    for (const project of incompleteProjects) {
      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        migrationStatus: "pending",
        originalMonthlyId: completedMonthlyId,
        updatedAt: new Date(),
      });
    }
    console.log(
      `Marked ${incompleteProjects.length} projects as pending migration`
    );
    return;
  }

  // 3. 미완료 프로젝트들을 다음 먼슬리로 이관
  for (const project of incompleteProjects) {
    try {
      await moveProjectToMonthly(
        project.id,
        completedMonthlyId,
        targetMonthly.id
      );
      console.log(
        `Migrated project ${(project as unknown as Project).title} to monthly ${
          (targetMonthly as unknown as Monthly).title
        }`
      );
    } catch (error) {
      console.error(`Failed to migrate project ${project.id}:`, error);
    }
  }
};

// 이관 대기 중인 프로젝트들을 새로 생성된 먼슬리에 자동 연결
export const connectPendingProjectsToNewMonthly = async (
  userId: string,
  newMonthlyId: string
): Promise<void> => {
  // 사용자 설정 확인
  const carryOverEnabled = await isCarryOverEnabled(userId);

  if (!carryOverEnabled) {
    console.log(
      `Carry over is disabled for user ${userId}. Skipping pending project connection.`
    );
    return;
  }

  const projectsQuery = db
    .collection("projects")
    .where("userId", "==", userId)
    .where("migrationStatus", "==", "pending");

  const querySnapshot = await projectsQuery.get();
  const pendingProjects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    };
  });

  for (const project of pendingProjects) {
    try {
      // 기존 connectedMonthlies에 새 먼슬리 추가
      const connectedMonthlies =
        (project as unknown as Project).connectedMonthlies || [];
      const updatedMonthlies = [...connectedMonthlies, { id: newMonthlyId }];

      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        connectedMonthlies: updatedMonthlies,
        migrationStatus: "migrated",
        carriedOverAt: new Date(),
        updatedAt: new Date(),
      });

      // 새로운 먼슬리 시스템에서는 프로젝트 연결이 없으므로 이 부분은 제거됨
      // 대신 태스크 완료 시 자동으로 월별 완료 태스크에 추가되는 방식 사용

      console.log(
        `Connected pending project ${
          (project as unknown as Project).title
        } to new monthly ${newMonthlyId}`
      );
    } catch (error) {
      console.error(`Failed to connect project ${project.id}:`, error);
    }
  }
};

// 새로운 먼슬리 시스템에서는 프로젝트 연결이 없으므로 이 함수는 제거됨
// 대신 태스크 완료 시 자동으로 월별 완료 태스크에 추가되는 방식 사용

// 먼슬리에서 프로젝트 제거
export const removeProjectFromMonthly = async (
  monthlyId: string,
  projectId: string
): Promise<void> => {
  const monthlyRef = db.collection("monthlies").doc(monthlyId);
  const projectRef = db.collection("projects").doc(projectId);

  // 트랜잭션으로 동시 업데이트
  await db.runTransaction(async (transaction) => {
    const monthlyDoc = await transaction.get(monthlyRef);
    const projectDoc = await transaction.get(projectRef);

    if (!monthlyDoc.exists) {
      throw new Error(`Monthly ${monthlyId} not found`);
    }
    if (!projectDoc.exists) {
      throw new Error(`Project ${projectId} not found`);
    }

    const monthlyData = monthlyDoc.data() as Monthly;
    const projectData = projectDoc.data() as Project;

    // 먼슬리의 connectedProjects에서 제거
    const connectedProjects = monthlyData.connectedProjects || [];
    const updatedProjects = connectedProjects.filter(
      (goal: any) => goal.projectId !== projectId
    );

    transaction.update(monthlyRef, {
      connectedProjects: updatedProjects,
      updatedAt: new Date(),
    });

    // 프로젝트의 connectedMonthlies에서 제거
    const connectedMonthlies = projectData.connectedMonthlies || [];
    const updatedMonthlies = connectedMonthlies.filter((monthly: any) =>
      typeof monthly === "string"
        ? monthly !== monthlyId
        : monthly.id !== monthlyId
    );

    transaction.update(projectRef, {
      connectedMonthlies: updatedMonthlies,
      updatedAt: new Date(),
    });
  });
};

// 태스크 완료 시 먼슬리별 진행률 업데이트
export const updateMonthlyProgress = async (
  userId: string,
  projectId: string,
  increment: number = 1
): Promise<void> => {
  // 활성 먼슬리 찾기
  const activeMonthlies = await findActiveMonthliesByUserId(userId);

  for (const monthly of activeMonthlies) {
    const monthlyData = monthly as unknown as Monthly;
    const connectedProjects = monthlyData.connectedProjects || [];
    const projectGoal = connectedProjects.find(
      (goal: any) => goal.projectId === projectId
    );

    if (projectGoal) {
      // 먼슬리별 진행률 업데이트
      const updatedProjects = connectedProjects.map((goal: any) => {
        if (goal.projectId === projectId) {
          return {
            ...goal,
            monthlyDoneCount: Math.min(
              goal.monthlyDoneCount + increment,
              goal.monthlyTargetCount
            ),
          };
        }
        return goal;
      });

      const monthlyRef = db.collection("monthlies").doc(monthly.id);
      await monthlyRef.update({
        connectedProjects: updatedProjects,
        updatedAt: new Date(),
      });

      console.log(
        `Updated monthly progress for project ${projectId} in monthly ${monthly.id}`
      );
    }
  }
};

// 미완료 프로젝트 찾기
const findIncompleteProjectsInMonthly = async (monthlyId: string) => {
  const projectsQuery = db
    .collection("projects")
    .where("status", "!=", "completed");

  const querySnapshot = await projectsQuery.get();
  const allProjects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    };
  });

  // connectedMonthlies에서 해당 monthlyId를 가진 프로젝트들만 필터링
  return allProjects.filter((project) => {
    const connectedMonthlies =
      (project as unknown as Project).connectedMonthlies || [];
    return connectedMonthlies.some((monthly: any) => monthly.id === monthlyId);
  });
};

// 모든 먼슬리 가져오기
const fetchAllMonthliesByUserId = async (userId: string) => {
  const monthliesQuery = db
    .collection("monthlies")
    .where("userId", "==", userId);
  const querySnapshot = await monthliesQuery.get();

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    };
  });
};

// 활성 먼슬리 찾기
const findActiveMonthliesByUserId = async (userId: string) => {
  const monthliesQuery = db
    .collection("monthlies")
    .where("userId", "==", userId);
  const querySnapshot = await monthliesQuery.get();

  const allMonthlies = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    };
  });

  // 현재 진행 중인 먼슬리만 필터링
  return allMonthlies.filter((monthly) => {
    const status = getMonthlyStatus(monthly);
    return status === "in_progress";
  });
};

// 프로젝트를 먼슬리 간 이동 (추가 방식)
const moveProjectToMonthly = async (
  projectId: string,
  fromMonthlyId: string,
  toMonthlyId: string
): Promise<void> => {
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const projectData = projectDoc.data() as Project;
  const connectedMonthlies = projectData?.connectedMonthlies || [];

  // 새 먼슬리가 이미 연결되어 있는지 확인
  const isAlreadyConnected = connectedMonthlies.some((monthly: any) =>
    typeof monthly === "string"
      ? monthly === toMonthlyId
      : monthly.id === toMonthlyId
  );

  if (!isAlreadyConnected) {
    // 새 먼슬리에 추가 (기존 연결은 유지)
    const updatedMonthlies = [...connectedMonthlies, toMonthlyId];

    await projectRef.update({
      connectedMonthlies: updatedMonthlies,
      migrationStatus: "migrated",
      carriedOverAt: new Date(),
      updatedAt: new Date(),
    });

    // 새로운 먼슬리 시스템에서는 프로젝트 연결이 없으므로 이 부분은 제거됨
    // 대신 태스크 완료 시 자동으로 월별 완료 태스크에 추가되는 방식 사용
  }
};

// 먼슬리별 목표치의 기본값을 계산합니다.
const calculateDefaultMonthlyTarget = (
  project: Project,
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

// 먼슬리 상태 확인
const getMonthlyStatus = (monthly: any): string => {
  const now = new Date();
  const startDate = new Date(monthly.startDate);
  const endDate = new Date(monthly.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "ended";
  }
};

// 새로운 먼슬리 시스템 관련 함수들

// 태스크 완료 시 월별 완료 태스크에 추가
export const addCompletedTaskToMonthly = async (
  userId: string,
  taskId: string,
  projectId: string,
  completedAt: Date
): Promise<void> => {
  const yearMonth = `${completedAt.getFullYear()}-${String(
    completedAt.getMonth() + 1
  ).padStart(2, "0")}`;

  // 기존 월별 완료 태스크 조회
  const existingData = await fetchMonthlyCompletedTasks(userId, yearMonth);

  if (existingData) {
    // 기존 데이터 업데이트
    const updatedTasks = [
      ...existingData.completedTasks,
      { taskId, projectId, completedAt },
    ];

    await db.collection("monthlyCompletedTasks").doc(existingData.id).update({
      completedTasks: updatedTasks,
      updatedAt: new Date(),
    });
  } else {
    // 새 데이터 생성
    await db.collection("monthlyCompletedTasks").add({
      userId,
      yearMonth,
      completedTasks: [{ taskId, projectId, completedAt }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
};

// 월별 완료된 태스크 조회
export const fetchMonthlyCompletedTasks = async (
  userId: string,
  yearMonth: string
): Promise<any | null> => {
  const q = db
    .collection("monthlyCompletedTasks")
    .where("userId", "==", userId)
    .where("yearMonth", "==", yearMonth);

  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

// 월간 스냅샷 생성
export const createMonthlySnapshot = async (
  userId: string,
  yearMonth: string
): Promise<void> => {
  // 해당 월의 먼슬리 조회
  const [year, month] = yearMonth.split("-").map(Number);
  const monthly = await findMonthlyByMonth(userId, year, month);

  if (!monthly) {
    throw new Error(`Monthly not found for ${yearMonth}`);
  }

  // 완료된 태스크들 조회
  const completedTasks = await fetchMonthlyCompletedTasks(userId, yearMonth);

  // 통계 계산
  const totalCompletedTasks = completedTasks?.completedTasks?.length || 0;
  const projectIds =
    completedTasks?.completedTasks?.map((t: any) => t.projectId) || [];
  const totalProjects = new Set(projectIds).size;

  // 스냅샷 생성
  await db.collection("monthlySnapshots").add({
    userId,
    yearMonth,
    snapshotDate: new Date(),
    monthly: {
      id: monthly.id,
      title: monthly.title,
      objective: monthly.objective,
      keyResults: monthly.keyResults,
    },
    completedTasks: completedTasks?.completedTasks || [],
    statistics: {
      totalCompletedTasks,
      totalProjects,
      totalAreas: 0, // TODO: 영역 정보 추가
      keyResultsCompleted:
        monthly.keyResults?.filter((kr: any) => kr.isCompleted).length || 0,
      keyResultsTotal: monthly.keyResults?.length || 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
};

// 특정 월의 먼슬리 찾기
const findMonthlyByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<any | null> => {
  const q = db.collection("monthlies").where("userId", "==", userId);
  const querySnapshot = await q.get();

  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const monthlyStartDate = data.startDate.toDate();

    // 먼슬리의 시작 월과 비교
    if (
      monthlyStartDate.getFullYear() === year &&
      monthlyStartDate.getMonth() === month - 1
    ) {
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      };
    }
  }

  return null;
};
