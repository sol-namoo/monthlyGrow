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

// Project 타입은 snapshot-utils.ts에서 사용됨

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

// 레거시 함수 제거됨: isCarryOverEnabled
// 현재 구조에서는 프로젝트 이관이 불필요하므로 이월 설정도 불필요함

// 레거시 함수 제거됨: autoMigrateIncompleteProjects
// 현재 구조에서는 프로젝트 이관이 불필요함

// 레거시 함수 제거됨: connectPendingProjectsToNewMonthly
// 현재 구조에서는 프로젝트 이관이 불필요함

// 레거시 함수 제거됨: removeProjectFromMonthly
// 현재 구조에서는 프로젝트 연결이 없으므로 불필요함

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

// 레거시 함수 제거됨: findIncompleteProjectsInMonthly

// 레거시 함수 제거됨: fetchAllMonthliesByUserId

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

// 레거시 함수 제거됨: moveProjectToMonthly

// 레거시 함수 제거됨: calculateDefaultMonthlyTarget

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
