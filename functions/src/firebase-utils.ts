// Cloud Functions용 Firebase 유틸리티 함수들
// functions/src/firebase-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

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

  // 2. 다음 달 루프 찾기 (진행 중이거나 예정된 루프)
  const allLoops = await fetchAllLoopsByUserId(userId);

  const sortedLoops = allLoops
    .filter((loop) => {
      const status = getLoopStatus(loop);
      return status === "in_progress" || status === "planned";
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const targetLoop = sortedLoops[0]; // 가장 빠른 미래 루프

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
        `Migrated project ${project.title} to loop ${targetLoop.title}`
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
      const connectedLoops = project.connectedLoops || [];
      const updatedLoops = [...connectedLoops, { loopId: newLoopId }];

      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        connectedLoops: updatedLoops,
        migrationStatus: "migrated",
        carriedOverAt: new Date(),
        updatedAt: new Date(),
      });

      // 새 루프의 projectIds에 추가
      const loopRef = db.collection("loops").doc(newLoopId);
      const loopDoc = await loopRef.get();

      if (loopDoc.exists) {
        const loopData = loopDoc.data();
        const projectIds = loopData?.projectIds || [];

        if (!projectIds.includes(project.id)) {
          await loopRef.update({
            projectIds: [...projectIds, project.id],
            updatedAt: new Date(),
          });
        }
      }

      console.log(
        `Connected pending project ${project.title} to new loop ${newLoopId}`
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
    .where("connectedLoops", "array-contains", { loopId })
    .where("status", "!=", "completed");

  const querySnapshot = await projectsQuery.get();
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

// 프로젝트를 루프 간 이동
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

  const projectData = projectDoc.data();
  const connectedLoops = projectData?.connectedLoops || [];

  // 기존 루프에서 제거하고 새 루프에 추가
  const updatedLoops = connectedLoops
    .filter((loop: any) => loop.loopId !== fromLoopId)
    .concat({ loopId: toLoopId });

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
