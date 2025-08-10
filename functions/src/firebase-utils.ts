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
interface ConnectedProjectGoal {
  projectId: string;
  chapterTargetCount: number; // 이번 루프에서 목표로 하는 태스크 수
  chapterDoneCount: number; // 이번 루프에서 실제 완료한 태스크 수
}

interface Project {
  id: string;
  title: string;
  target: number; // 전체 목표 개수
  completedTasks: number; // 전체 실제 완료된 태스크 수
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
  connectedProjects?: ConnectedProjectGoal[]; // 챕터별 프로젝트 목표치
  doneCount?: number; // 전체 완료 수 (legacy)
  targetCount?: number; // 전체 목표 수 (legacy)
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

      // 프로젝트를 새 챕터에 연결 (connectedProjects 사용)
      await addProjectToChapter(newChapterId, project.id);

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

// 챕터에 프로젝트 추가 (새로운 구조)
export const addProjectToChapter = async (
  chapterId: string,
  projectId: string,
  targetCount?: number
): Promise<void> => {
  const chapterRef = db.collection("chapters").doc(chapterId);
  const projectRef = db.collection("projects").doc(projectId);

  // 트랜잭션으로 동시 업데이트
  await db.runTransaction(async (transaction) => {
    const chapterDoc = await transaction.get(chapterRef);
    const projectDoc = await transaction.get(projectRef);

    if (!chapterDoc.exists) {
      throw new Error(`Chapter ${chapterId} not found`);
    }
    if (!projectDoc.exists) {
      throw new Error(`Project ${projectId} not found`);
    }

    const chapterData = chapterDoc.data() as Chapter;
    const projectData = projectDoc.data() as Project;

    // 챕터의 connectedProjects 업데이트
    const connectedProjects = chapterData.connectedProjects || [];
    const existingProject = connectedProjects.find(
      (goal) => goal.projectId === projectId
    );

    if (!existingProject) {
      // 기본 목표치 계산 (프로젝트 전체 목표치를 챕터 기간에 비례하여 분배)
      const defaultTarget =
        targetCount ||
        calculateDefaultChapterTarget(
          projectData,
          chapterData.startDate.toDate(),
          chapterData.endDate.toDate()
        );

      const newGoal: ConnectedProjectGoal = {
        projectId,
        chapterTargetCount: defaultTarget,
        chapterDoneCount: 0,
      };

      connectedProjects.push(newGoal);

      transaction.update(chapterRef, {
        connectedProjects,
        updatedAt: new Date(),
      });
    }

    // 프로젝트의 connectedChapters 업데이트
    const connectedChapters = projectData.connectedChapters || [];
    const isAlreadyConnected = connectedChapters.some((chapter: any) =>
      typeof chapter === "string"
        ? chapter === chapterId
        : chapter.id === chapterId
    );

    if (!isAlreadyConnected) {
      const updatedChapters = [...connectedChapters, { id: chapterId }];
      transaction.update(projectRef, {
        connectedChapters: updatedChapters,
        updatedAt: new Date(),
      });
    }
  });
};

// 챕터에서 프로젝트 제거
export const removeProjectFromChapter = async (
  chapterId: string,
  projectId: string
): Promise<void> => {
  const chapterRef = db.collection("chapters").doc(chapterId);
  const projectRef = db.collection("projects").doc(projectId);

  // 트랜잭션으로 동시 업데이트
  await db.runTransaction(async (transaction) => {
    const chapterDoc = await transaction.get(chapterRef);
    const projectDoc = await transaction.get(projectRef);

    if (!chapterDoc.exists) {
      throw new Error(`Chapter ${chapterId} not found`);
    }
    if (!projectDoc.exists) {
      throw new Error(`Project ${projectId} not found`);
    }

    const chapterData = chapterDoc.data() as Chapter;
    const projectData = projectDoc.data() as Project;

    // 챕터의 connectedProjects에서 제거
    const connectedProjects = chapterData.connectedProjects || [];
    const updatedProjects = connectedProjects.filter(
      (goal) => goal.projectId !== projectId
    );

    transaction.update(chapterRef, {
      connectedProjects: updatedProjects,
      updatedAt: new Date(),
    });

    // 프로젝트의 connectedChapters에서 제거
    const connectedChapters = projectData.connectedChapters || [];
    const updatedChapters = connectedChapters.filter((chapter: any) =>
      typeof chapter === "string"
        ? chapter !== chapterId
        : chapter.id !== chapterId
    );

    transaction.update(projectRef, {
      connectedChapters: updatedChapters,
      updatedAt: new Date(),
    });
  });
};

// 태스크 완료 시 챕터별 진행률 업데이트
export const updateChapterProgress = async (
  userId: string,
  projectId: string,
  increment: number = 1
): Promise<void> => {
  // 활성 챕터 찾기
  const activeChapters = await findActiveChaptersByUserId(userId);

  for (const chapter of activeChapters) {
    const chapterData = chapter as unknown as Chapter;
    const connectedProjects = chapterData.connectedProjects || [];
    const projectGoal = connectedProjects.find(
      (goal) => goal.projectId === projectId
    );

    if (projectGoal) {
      // 챕터별 진행률 업데이트
      const updatedProjects = connectedProjects.map((goal) => {
        if (goal.projectId === projectId) {
          return {
            ...goal,
            chapterDoneCount: Math.min(
              goal.chapterDoneCount + increment,
              goal.chapterTargetCount
            ),
          };
        }
        return goal;
      });

      const chapterRef = db.collection("chapters").doc(chapter.id);
      await chapterRef.update({
        connectedProjects: updatedProjects,
        updatedAt: new Date(),
      });

      console.log(
        `Updated chapter progress for project ${projectId} in chapter ${chapter.id}`
      );
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

// 활성 챕터 찾기
const findActiveChaptersByUserId = async (userId: string) => {
  const chaptersQuery = db.collection("chapters").where("userId", "==", userId);
  const querySnapshot = await chaptersQuery.get();

  const allChapters = querySnapshot.docs.map((doc) => {
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

  // 현재 진행 중인 챕터만 필터링
  return allChapters.filter((chapter) => {
    const status = getChapterStatus(chapter);
    return status === "in_progress";
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

    // 대상 챕터에 프로젝트 추가
    await addProjectToChapter(toChapterId, projectId);
  }
};

// 챕터별 목표치의 기본값을 계산합니다.
const calculateDefaultChapterTarget = (
  project: Project,
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
    return "ended";
  }
};
