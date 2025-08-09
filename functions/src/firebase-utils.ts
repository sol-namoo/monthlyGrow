// Cloud Functions용 Firebase 유틸리티 함수들
// functions/src/firebase-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// 타입 정의
interface Project {
  id: string;
  title: string;
  connectedChapters?: any[];
  migrationStatus?: string;
  originalChapterId?: string;
  [key: string]: any;
}

interface Chapter {
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

// 자동 이관을 위한 함수: 완료된 챕터의 미완료 프로젝트를 다음 챕터로 이관
export const autoMigrateIncompleteProjects = async (
  userId: string,
  completedChapterId: string
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
  const incompleteProjects = await findIncompleteProjectsInChapter(
    completedChapterId
  );

  if (incompleteProjects.length === 0) {
    console.log("No incomplete projects to migrate");
    return;
  }

  // 2. 다음 달 챕터 찾기 (이번 달 챕터가 없으면 다음 달 챕터에 추가)
  const allChapters = await fetchAllChaptersByUserId(userId);

  // 현재 날짜 기준으로 다음 달 챕터 찾기
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const targetChapters = allChapters
    .filter((chapter) => {
      const chapterStartDate = new Date(chapter.startDate);
      const status = getChapterStatus(chapter);
      // 다음 달에 시작하는 챕터이거나 현재 진행 중인 챕터
      // (이번 달 챕터가 없으면 다음 달 챕터에 추가)
      return (
        (chapterStartDate >= nextMonth || status === "in_progress") &&
        status !== "ended"
      );
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const targetChapter = targetChapters[0]; // 가장 빠른 미래 챕터

  if (!targetChapter) {
    // 다음 달 챕터가 없으면 프로젝트에 이관 대기 상태로 마킹
    for (const project of incompleteProjects) {
      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        migrationStatus: "pending",
        originalChapterId: completedChapterId,
        updatedAt: new Date(),
      });
    }
    console.log(
      `Marked ${incompleteProjects.length} projects as pending migration`
    );
    return;
  }

  // 3. 미완료 프로젝트들을 다음 챕터로 이관
  for (const project of incompleteProjects) {
    try {
      await moveProjectToChapter(
        project.id,
        completedChapterId,
        targetChapter.id
      );
      console.log(
        `Migrated project ${(project as unknown as Project).title} to chapter ${
          (targetChapter as unknown as Chapter).title
        }`
      );
    } catch (error) {
      console.error(`Failed to migrate project ${project.id}:`, error);
    }
  }
};

// 이관 대기 중인 프로젝트들을 새로 생성된 챕터에 자동 연결
export const connectPendingProjectsToNewChapter = async (
  userId: string,
  newChapterId: string
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
      // 기존 connectedChapters에 새 챕터 추가
      const connectedChapters =
        (project as unknown as Project).connectedChapters || [];
      const updatedChapters = [...connectedChapters, { id: newChapterId }];

      const projectRef = db.collection("projects").doc(project.id);
      await projectRef.update({
        connectedChapters: updatedChapters,
        migrationStatus: "migrated",
        carriedOverAt: new Date(),
        updatedAt: new Date(),
      });

      // 프로젝트를 새 챕터에 연결 (projectIds는 더 이상 사용하지 않음)
      console.log(
        `Connected pending project ${
          (project as unknown as Project).title
        } to new chapter ${newChapterId}`
      );

      console.log(
        `Connected pending project ${
          (project as unknown as Project).title
        } to new chapter ${newChapterId}`
      );
    } catch (error) {
      console.error(`Failed to connect project ${project.id}:`, error);
    }
  }
};

// 미완료 프로젝트 찾기
const findIncompleteProjectsInChapter = async (chapterId: string) => {
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

  // connectedChapters에서 해당 chapterId를 가진 프로젝트들만 필터링
  return allProjects.filter((project) => {
    const connectedChapters =
      (project as unknown as Project).connectedChapters || [];
    return connectedChapters.some((chapter: any) => chapter.id === chapterId);
  });
};

// 모든 챕터 가져오기
const fetchAllChaptersByUserId = async (userId: string) => {
  const chaptersQuery = db.collection("chapters").where("userId", "==", userId);
  const querySnapshot = await chaptersQuery.get();

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

// 프로젝트를 챕터 간 이동 (추가 방식)
const moveProjectToChapter = async (
  projectId: string,
  fromChapterId: string,
  toChapterId: string
): Promise<void> => {
  const projectRef = db.collection("projects").doc(projectId);
  const projectDoc = await projectRef.get();

  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const projectData = projectDoc.data() as Project;
  const connectedChapters = projectData?.connectedChapters || [];

  // 새 챕터가 이미 연결되어 있는지 확인
  const isAlreadyConnected = connectedChapters.some((chapter: any) =>
    typeof chapter === "string"
      ? chapter === toChapterId
      : chapter.id === toChapterId
  );

  if (!isAlreadyConnected) {
    // 새 챕터에 추가 (기존 연결은 유지)
    const updatedChapters = [...connectedChapters, toChapterId];

    await projectRef.update({
      connectedChapters: updatedChapters,
      migrationStatus: "migrated",
      carriedOverAt: new Date(),
      updatedAt: new Date(),
    });

    // 대상 챕터의 projectIds에 추가
    const targetChapterRef = db.collection("chapters").doc(toChapterId);
    const targetChapterDoc = await targetChapterRef.get();

    if (targetChapterDoc.exists) {
      const targetChapterData = targetChapterDoc.data();
      const projectIds = targetChapterData?.projectIds || [];

      if (!projectIds.includes(projectId)) {
        await targetChapterRef.update({
          projectIds: [...projectIds, projectId],
          updatedAt: new Date(),
        });
      }
    }
  }
};

// 챕터 상태 확인
const getChapterStatus = (chapter: any): string => {
  const now = new Date();
  const startDate = new Date(chapter.startDate);
  const endDate = new Date(chapter.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "completed";
  }
};
