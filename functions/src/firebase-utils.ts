// Cloud Functions용 Firebase 유틸리티 함수들
// functions/src/firebase-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// 타입 정의
interface Project {
  id: string;
  title: string;
  connectedLoops?: any[];
  migrationStatus?: string;
  originalLoopId?: string;
  [key: string]: any;
}

interface Loop {
  id: string;
  title: string;
  startDate: any;
  endDate: any;
  projectIds?: string[];
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

// 자동 이관을 위한 함수: 완료된 루프의 미완료 프로젝트를 다음 루프로 이관
export const autoMigrateIncompleteProjects = async (
  userId: string,
  completedLoopId: string
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
  const incompleteProjects = await findIncompleteProjectsInLoop(
    completedLoopId
  );

  if (incompleteProjects.length === 0) {
    console.log("No incomplete projects to migrate");
    return;
  }

  // 2. 다음 달 루프 찾기 (이번 달 루프가 없으면 다음 달 루프에 추가)
  const allLoops = await fetchAllLoopsByUserId(userId);

  // 현재 날짜 기준으로 다음 달 루프 찾기
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const targetLoops = allLoops
    .filter((loop) => {
      const loopStartDate = new Date(loop.startDate);
      const status = getLoopStatus(loop);
      // 다음 달에 시작하는 루프이거나 현재 진행 중인 루프
      // (이번 달 루프가 없으면 다음 달 루프에 추가)
      return (
        (loopStartDate >= nextMonth || status === "in_progress") &&
        status !== "ended"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const targetLoop = targetLoops[0]; // 가장 빠른 미래 루프

  if (!targetLoop) {
    // 다음 달 루프가 없으면 프로젝트에 이관 대기 상태로 마킹
    for (const project of incompleteProjects) {
      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        migrationStatus: "pending",
        originalLoopId: completedLoopId,
        updatedAt: new Date(),
      });
    }
    console.log(
      `Marked ${incompleteProjects.length} projects as pending migration`
    );
    return;
  }

  // 3. 미완료 프로젝트들을 다음 루프로 이관
  for (const project of incompleteProjects) {
    try {
      await moveProjectToLoop(project.id, completedLoopId, targetLoop.id);
      console.log(
        `Migrated project ${(project as unknown as Project).title} to loop ${
          (targetLoop as unknown as Loop).title
        }`
      );
    } catch (error) {
      console.error(`Failed to migrate project ${project.id}:`, error);
    }
  }
};

// 이관 대기 중인 프로젝트들을 새로 생성된 루프에 자동 연결
export const connectPendingProjectsToNewLoop = async (
  userId: string,
  newLoopId: string
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
      // 기존 connectedLoops에 새 루프 추가
      const connectedLoops =
        (project as unknown as Project).connectedLoops || [];
      const updatedLoops = [...connectedLoops, { id: newLoopId }];

      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        connectedLoops: updatedLoops,
        migrationStatus: "migrated",
        carriedOverAt: new Date(),
        updatedAt: new Date(),
      });

      // 프로젝트를 새 루프에 연결 (projectIds는 더 이상 사용하지 않음)
      console.log(
        `Connected pending project ${
          (project as unknown as Project).title
        } to new loop ${newLoopId}`
      );

      console.log(
        `Connected pending project ${
          (project as unknown as Project).title
        } to new loop ${newLoopId}`
      );
    } catch (error) {
      console.error(`Failed to connect project ${project.id}:`, error);
    }
  }
};

// 미완료 프로젝트 찾기
const findIncompleteProjectsInLoop = async (loopId: string) => {
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

  // connectedLoops에서 해당 loopId를 가진 프로젝트들만 필터링
  return allProjects.filter((project) => {
    const connectedLoops = (project as unknown as Project).connectedLoops || [];
    return connectedLoops.some((loop: any) => loop.id === loopId);
  });
};

// 모든 루프 가져오기
const fetchAllLoopsByUserId = async (userId: string) => {
  const loopsQuery = db.collection("loops").where("userId", "==", userId);
  const querySnapshot = await loopsQuery.get();

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

// 프로젝트를 루프 간 이동 (추가 방식)
const moveProjectToLoop = async (
  projectId: string,
  fromLoopId: string,
  toLoopId: string
): Promise<void> => {
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const projectData = projectDoc.data() as Project;
  const connectedLoops = projectData?.connectedLoops || [];

  // 새 루프가 이미 연결되어 있는지 확인
  const isAlreadyConnected = connectedLoops.some((loop: any) =>
    typeof loop === "string" ? loop === toLoopId : loop.id === toLoopId
  );

  if (!isAlreadyConnected) {
    // 새 루프에 추가 (기존 연결은 유지)
    const updatedLoops = [...connectedLoops, toLoopId];

    await projectRef.update({
      connectedLoops: updatedLoops,
      migrationStatus: "migrated",
      carriedOverAt: new Date(),
      updatedAt: new Date(),
    });

    // 대상 루프의 projectIds에 추가
    const targetLoopRef = db.collection("loops").doc(toLoopId);
    const targetLoopDoc = await targetLoopRef.get();

    if (targetLoopDoc.exists) {
      const targetLoopData = targetLoopDoc.data();
      const projectIds = targetLoopData?.projectIds || [];

      if (!projectIds.includes(projectId)) {
        await targetLoopRef.update({
          projectIds: [...projectIds, projectId],
          updatedAt: new Date(),
        });
      }
    }
  }
};

// 루프 상태 확인
const getLoopStatus = (loop: any): string => {
  const now = new Date();
  const startDate = new Date(loop.startDate);
  const endDate = new Date(loop.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "completed";
  }
};
