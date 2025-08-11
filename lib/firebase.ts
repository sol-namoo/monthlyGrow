// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import {
  Area,
  Resource,
  Project,
  Task,
  Chapter,
  Retrospective,
  Note,
  User,
  UserProfile,
  UserSettings,
  UserPreferences,
} from "./types"; // lib/types.ts에서 타입 import
import { getChapterStatus } from "./utils";

const firebaseConfig = {
  apiKey: "AIzaSyCKEG-VqAZRGyEpSsPIxeJV5ACZ8mfQvPY",
  authDomain: "monthlygrow-cb74d.firebaseapp.com",
  projectId: "monthlygrow-cb74d",
  storageBucket: "monthlygrow-cb74d.firebasestorage.app",
  messagingSenderId: "960277815712",
  appId: "1:960277815712:web:38f547540231380e0fc4c5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

// Initialize Storage
export const storage = getStorage(app);

// Set persistence to LOCAL (localStorage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence 설정 실패:", error);
});

// --- Utility Functions ---

// 데이터 생성 시 타임스탬프 설정 유틸리티
export const createTimestamp = () => Timestamp.now();

// 데이터 생성 시 기본 필드 설정
export const createBaseData = (userId: string) => ({
  userId,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(), // 생성 시에는 createdAt과 동일
});

// 데이터 수정 시 updatedAt 필드 업데이트
export const updateTimestamp = () => Timestamp.now();

// Task 정렬 유틸리티 함수
const sortTasksByDateAndTitle = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    // Date 비교
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    // 같은 date인 경우 제목으로 정렬
    return a.title.localeCompare(b.title);
  });
};

// --- Basic Data Fetching Functions ---

// Areas
export const fetchAllAreasByUserId = async (
  userId: string
): Promise<Area[]> => {
  const q = query(collection(db, "areas"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Area;
  });
};

export const fetchActiveAreasByUserId = async (
  userId: string
): Promise<Area[]> => {
  const q = query(
    collection(db, "areas"),
    where("userId", "==", userId),
    where("status", "==", "active")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Area[];
};

export const fetchArchivedAreasByUserId = async (
  userId: string
): Promise<Area[]> => {
  const q = query(
    collection(db, "areas"),
    where("userId", "==", userId),
    where("status", "==", "archived")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Area[];
};

export const fetchAreaById = async (areaId: string): Promise<Area> => {
  const docRef = doc(db, "areas", areaId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Area;
  } else {
    throw new Error("Area not found");
  }
};

// Resources
export const fetchAllResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  const q = query(collection(db, "resources"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Resource;
  });
};

export const fetchActiveResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  const q = query(
    collection(db, "resources"),
    where("userId", "==", userId),
    where("status", "==", "active")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
};

export const fetchArchivedResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  const q = query(
    collection(db, "resources"),
    where("userId", "==", userId),
    where("status", "==", "archived")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Resource[];
};

export const fetchResourceById = async (
  resourceId: string
): Promise<Resource> => {
  const docRef = doc(db, "resources", resourceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Resource;
  } else {
    throw new Error("Resource not found");
  }
};

// 리소스와 연결된 영역 정보를 함께 가져오는 함수
export const fetchResourceWithAreaById = async (
  resourceId: string
): Promise<Resource & { area?: { id: string; name: string } }> => {
  const docRef = doc(db, "resources", resourceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const resource = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Resource;

    // 영역 정보 가져오기
    if (resource.areaId) {
      try {
        const areaRef = doc(db, "areas", resource.areaId);
        const areaSnap = await getDoc(areaRef);
        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          return {
            ...resource,
            area: {
              id: areaSnap.id,
              name: areaData.name || "기타",
            },
          } as Resource & { area?: { id: string; name: string } };
        }
      } catch (error) {
        console.error("Error fetching area for resource:", error);
      }
    }

    return resource as Resource & { area?: { id: string; name: string } };
  } else {
    throw new Error("Resource not found");
  }
};

// Projects
export const fetchAllProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });
};

export const fetchActiveProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "active")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });
};

export const fetchArchivedProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "archived")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
  console.log("🔥 Firestore: Fetching project by ID:", projectId);
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const project = {
      id: docSnap.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;

    console.log("🔥 Firestore: Project data:", {
      id: project.id,
      title: project.title,
      target: project.target,
      category: project.category,
      area: project.area,
    });

    return project;
  } else {
    throw new Error("Project not found");
  }
};

export const fetchProjectsByAreaId = async (
  areaId: string
): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("areaId", "==", areaId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });
};

export const fetchProjectsByChapterId = async (
  chapterId: string,
  userId?: string
): Promise<Project[]> => {
  // userId가 없으면 chapterId에서 추출 시도
  const targetUserId = userId || chapterId.split("_")[0];

  // 모든 프로젝트를 가져온 후 클라이언트 사이드에서 필터링
  const q = query(
    collection(db, "projects"),
    where("userId", "==", targetUserId)
  );

  const querySnapshot = await getDocs(q);
  const projects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });

  // connectedChapters 배열 또는 chapterId 필드에서 해당 chapterId를 가진 프로젝트들만 필터링
  return projects.filter((project) => {
    const connectedChapters = (project as any).connectedChapters || [];
    return (
      connectedChapters.includes(chapterId) || project.chapterId === chapterId
    );
  });
};

// 현재 챕터의 프로젝트만 효율적으로 가져오는 함수
export const fetchCurrentChapterProjects = async (
  userId: string,
  currentChapterId?: string
): Promise<Project[]> => {
  if (!currentChapterId) return [];

  // 현재 챕터에 연결된 프로젝트들만 가져오기
  const q = query(collection(db, "projects"), where("userId", "==", userId));

  const querySnapshot = await getDocs(q);
  const projects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });

  // 현재 챕터에 연결된 프로젝트들만 필터링
  return projects.filter((project) => {
    const connectedChapters = (project as any).connectedChapters || [];
    return (
      connectedChapters.includes(currentChapterId) ||
      project.chapterId === currentChapterId
    );
  });
};

// 연결되지 않은 프로젝트들만 가져오는 함수 (챕터 편집용)
export const fetchUnconnectedProjects = async (
  userId: string,
  excludeChapterId?: string
): Promise<Project[]> => {
  const q = query(collection(db, "projects"), where("userId", "==", userId));

  const querySnapshot = await getDocs(q);
  const projects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedChapters: data.connectedChapters || [],
    } as Project;
  });

  // excludeChapterId가 있으면 해당 챕터에 연결되지 않은 프로젝트들만 반환
  if (excludeChapterId) {
    return projects.filter((project) => {
      const connectedChapters = (project as any).connectedChapters || [];
      return (
        !connectedChapters.includes(excludeChapterId) &&
        project.chapterId !== excludeChapterId
      );
    });
  }

  // excludeChapterId가 없으면 모든 프로젝트 반환 (챕터 생성 시)
  return projects;
};

// 챕터별 프로젝트 개수만 효율적으로 조회하는 함수
export const fetchProjectCountsByChapterIds = async (
  chapterIds: string[],
  userId: string
): Promise<{ [chapterId: string]: number }> => {
  if (chapterIds.length === 0) return {};

  const counts: { [chapterId: string]: number } = {};

  console.log("🔍 fetchProjectCountsByChapterIds 시작");
  console.log("조회할 챕터 IDs:", chapterIds);
  console.log("사용자 ID:", userId);

  // 모든 프로젝트를 한 번에 가져오기
  const allProjectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId)
  );
  const allProjectsSnapshot = await getDocs(allProjectsQuery);
  const allProjects = allProjectsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Project[];

  console.log(`총 ${allProjects.length}개 프로젝트 조회됨`);

  // 각 챕터별로 프로젝트 개수 계산
  for (const chapterId of chapterIds) {
    console.log(`\n📊 챕터 ${chapterId} 계산 중...`);

    const connectedProjects = allProjects.filter((project) => {
      const connectedChapters = (project as any).connectedChapters || [];
      return (
        connectedChapters.includes(chapterId) || project.chapterId === chapterId
      );
    });

    console.log(
      `챕터 ${chapterId} 결과:`,
      connectedProjects.length,
      "개 프로젝트"
    );

    // 실제 프로젝트 데이터 확인
    if (connectedProjects.length > 0) {
      console.log("연결된 프로젝트들:");
      connectedProjects.forEach((project) => {
        console.log(
          `- ${project.title}: connectedChapters =`,
          (project as any).connectedChapters
        );
      });
    } else {
      console.log("연결된 프로젝트 없음");
    }

    counts[chapterId] = connectedProjects.length;
  }

  console.log("최종 결과:", counts);
  return counts;
};

// Tasks
export const fetchAllTasksByUserId = async (
  userId: string
): Promise<Task[]> => {
  const q = query(collection(db, "tasks"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];

  return sortTasksByDateAndTitle(tasks);
};

export const fetchAllTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  try {
    // 서브컬렉션에서 태스크 가져오기
    const tasksRef = collection(db, "projects", projectId, "tasks");
    const querySnapshot = await getDocs(tasksRef);
    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    return sortTasksByDateAndTitle(tasks);
  } catch (error) {
    // 서브컬렉션에서 실패하면 메인 컬렉션에서 시도 (fallback)
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );
    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];

    return sortTasksByDateAndTitle(tasks);
  }
};

// 프로젝트의 태스크 개수만 카운트하는 함수
export const getTaskCountsByProjectId = async (
  projectId: string
): Promise<{ totalTasks: number; completedTasks: number }> => {
  try {
    // 서브컬렉션에서 태스크 개수 가져오기
    const tasksRef = collection(db, "projects", projectId, "tasks");
    const querySnapshot = await getDocs(tasksRef);

    const totalTasks = querySnapshot.size;
    const completedTasks = querySnapshot.docs.filter(
      (doc) => doc.data().done === true
    ).length;

    return { totalTasks, completedTasks };
  } catch (error) {
    // 서브컬렉션에서 실패하면 메인 컬렉션에서 시도 (fallback)
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );
    const querySnapshot = await getDocs(q);

    const totalTasks = querySnapshot.size;
    const completedTasks = querySnapshot.docs.filter(
      (doc) => doc.data().done === true
    ).length;

    return { totalTasks, completedTasks };
  }
};

// 여러 프로젝트의 태스크 개수를 한 번에 가져오는 함수 (배치 최적화)
export const getTaskCountsForMultipleProjects = async (
  projectIds: string[]
): Promise<{
  [projectId: string]: { totalTasks: number; completedTasks: number };
}> => {
  if (projectIds.length === 0) return {};

  console.log("🔍 getTaskCountsForMultipleProjects 시작:", { projectIds });

  // 프로젝트별로 그룹화
  const counts: {
    [projectId: string]: { totalTasks: number; completedTasks: number };
  } = {};

  // 초기화
  projectIds.forEach((id) => {
    counts[id] = { totalTasks: 0, completedTasks: 0 };
  });

  try {
    // 서브컬렉션에서 각 프로젝트별로 태스크 개수 가져오기
    for (const projectId of projectIds) {
      try {
        const tasksRef = collection(db, "projects", projectId, "tasks");
        const querySnapshot = await getDocs(tasksRef);

        const totalTasks = querySnapshot.size;
        const completedTasks = querySnapshot.docs.filter(
          (doc) => doc.data().done === true
        ).length;

        counts[projectId] = { totalTasks, completedTasks };

        console.log(`🔍 프로젝트 ${projectId} 서브컬렉션 결과:`, {
          totalTasks,
          completedTasks,
          tasksFound: querySnapshot.docs.length,
        });
      } catch (error) {
        console.error(`❌ 프로젝트 ${projectId} 서브컬렉션 조회 실패:`, error);
        // 개별 프로젝트 실패 시 기본값 유지
      }
    }

    console.log("🔍 최종 서브컬렉션 결과:", counts);
    return counts;
  } catch (error) {
    console.error("❌ 서브컬렉션 전체 실패, 메인 컬렉션으로 폴백:", error);

    // 서브컬렉션에서 실패하면 메인 컬렉션에서 시도 (fallback)
    const q = query(
      collection(db, "tasks"),
      where("projectId", "in", projectIds)
    );
    const querySnapshot = await getDocs(q);

    // 카운트 계산
    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const projectId = data.projectId;
      if (counts[projectId]) {
        counts[projectId].totalTasks++;
        if (data.done === true) {
          counts[projectId].completedTasks++;
        }
      }
    });

    console.log("🔍 메인 컬렉션 폴백 결과:", counts);
    return counts;
  }
};

// 프로젝트의 시간 통계만 가져오는 함수
export const getTaskTimeStatsByProjectId = async (
  projectId: string
): Promise<{ completedTime: number; remainingTime: number }> => {
  try {
    // 서브컬렉션에서 시간 통계 가져오기
    const tasksRef = collection(db, "projects", projectId, "tasks");
    const querySnapshot = await getDocs(tasksRef);

    let completedTime = 0;
    let remainingTime = 0;

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const duration = data.duration || 0;
      if (data.done === true) {
        completedTime += duration;
      } else {
        remainingTime += duration;
      }
    });

    return { completedTime, remainingTime };
  } catch (error) {
    // 서브컬렉션에서 실패하면 메인 컬렉션에서 시도 (fallback)
    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", projectId)
    );
    const querySnapshot = await getDocs(q);

    let completedTime = 0;
    let remainingTime = 0;

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const duration = data.duration || 0;
      if (data.done === true) {
        completedTime += duration;
      } else {
        remainingTime += duration;
      }
    });

    return { completedTime, remainingTime };
  }
};

export const fetchTaskById = async (taskId: string): Promise<Task> => {
  const docRef = doc(db, "tasks", taskId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Task;
  } else {
    throw new Error("Task not found");
  }
};

// Chapters
export const fetchAllChaptersByUserId = async (
  userId: string
): Promise<Chapter[]> => {
  const q = query(collection(db, "chapters"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedProjects: data.connectedProjects || [],
    } as Chapter;
  });
};

export const fetchChapterById = async (chapterId: string): Promise<Chapter> => {
  const docRef = doc(db, "chapters", chapterId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      // status 필드 제거 - 클라이언트에서 날짜 기반으로 계산
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedProjects: data.connectedProjects || [],
    } as Chapter;
  } else {
    throw new Error("Chapter not found");
  }
};

// 특정 월의 기존 챕터 찾기
export const findChapterByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<Chapter | null> => {
  const q = query(collection(db, "chapters"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);

  for (const doc of querySnapshot.docs) {
    const data = doc.data();
    const chapterStartDate = data.startDate.toDate();

    // 챕터의 시작 월과 비교
    if (
      chapterStartDate.getFullYear() === year &&
      chapterStartDate.getMonth() === month - 1
    ) {
      return {
        id: doc.id,
        userId: data.userId,
        title: data.title,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        focusAreas: data.focusAreas,
        // projectIds는 더 이상 사용하지 않음 (connectedChapters로 대체)
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        doneCount: data.doneCount,
        targetCount: data.targetCount,
        reward: data.reward,
        connectedProjects: data.connectedProjects || [],
      } as Chapter;
    }
  }

  return null;
};

// 챕터의 미완료 프로젝트 찾기
export const findIncompleteProjectsInChapter = async (
  chapterId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("connectedChapters", "array-contains", chapterId)
  );
  const querySnapshot = await getDocs(q);

  const incompleteProjects: Project[] = [];

  for (const doc of querySnapshot.docs) {
    const data = doc.data();

    // 프로젝트의 완료 상태 확인 (tasks 기반)
    const tasksQuery = query(
      collection(db, "tasks"),
      where("projectId", "==", doc.id)
    );
    const tasksSnapshot = await getDocs(tasksQuery);

    const tasks = tasksSnapshot.docs.map((taskDoc) => taskDoc.data());
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.done).length;

    // 완료되지 않은 프로젝트만 추가
    if (totalTasks === 0 || completedTasks < totalTasks) {
      incompleteProjects.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        description: data.description,
        category: data.category,
        area: data.area,
        areaId: data.areaId,
        target: data.target || totalTasks, // target이 없으면 totalTasks 사용
        completedTasks: completedTasks,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        chapterId: data.chapterId,
        connectedChapters: data.connectedChapters || [],
        addedMidway: data.addedMidway,
        retrospective: data.retrospective,
        notes: data.notes || [], // notes 배열이 없으면 빈 배열
        isCarriedOver: data.isCarriedOver,
        originalChapterId: data.originalChapterId,
        carriedOverAt: data.carriedOverAt?.toDate(),
        migrationStatus: data.migrationStatus,
        status: data.status || "in_progress", // status가 없으면 기본값
      } as Project);
    }
  }

  return incompleteProjects;
};

// 프로젝트를 다른 챕터로 이동
export const moveProjectToChapter = async (
  projectId: string,
  fromChapterId: string,
  toChapterId: string
): Promise<void> => {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Project not found");
  }

  const projectData = projectSnap.data();
  const connectedChapters = (projectData as any).connectedChapters || [];

  // 기존 챕터에서 제거하고 새 챕터에 추가
  const updatedConnectedChapters = connectedChapters
    .filter((chapterId: string) => chapterId !== fromChapterId)
    .concat([toChapterId]);

  // 프로젝트 업데이트
  await updateDoc(projectRef, {
    connectedChapters: updatedConnectedChapters,
    isCarriedOver: true,
    originalChapterId: fromChapterId,
    carriedOverAt: new Date(),
    migrationStatus: "migrated",
    updatedAt: new Date(),
  });
};

// Retrospectives
export const fetchAllRetrospectivesByUserId = async (
  userId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

export const fetchRetrospectiveById = async (
  retrospectiveId: string
): Promise<Retrospective> => {
  const docRef = doc(db, "retrospectives", retrospectiveId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  } else {
    throw new Error("Retrospective not found");
  }
};

export const fetchRetrospectivesByChapterId = async (
  chapterId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("chapterId", "==", chapterId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

export const fetchRetrospectivesByProjectId = async (
  projectId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("projectId", "==", projectId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

// Archive (기존 함수 업데이트)
export const fetchArchivedItemsByUserId = async (
  userId: string
): Promise<any> => {
  // TODO: implement fetchArchive - 현재는 빈 객체 반환
  return {};
};

// --- Data Creation/Update Functions ---

// Areas
export const createArea = async (
  areaData: Omit<Area, "id" | "createdAt" | "updatedAt">
): Promise<Area> => {
  const baseData = createBaseData(areaData.userId);
  const newArea = {
    ...areaData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "areas"), newArea);

  // Area 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: areaData.userId,
    name: areaData.name,
    description: areaData.description,
    icon: areaData.icon,
    color: areaData.color,
    status: areaData.status || "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Area;
};

// "미분류" 영역 생성 또는 가져오기
export const getOrCreateUncategorizedArea = async (
  userId: string
): Promise<Area> => {
  try {
    // 기존 "미분류" 영역이 있는지 확인
    const areasRef = collection(db, "areas");
    const q = query(
      areasRef,
      where("userId", "==", userId),
      where("name", "==", "미분류")
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // 기존 "미분류" 영역 반환
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        status: data.status,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Area;
    } else {
      // 새로운 "미분류" 영역 생성
      const uncategorizedArea = {
        name: "미분류",
        description: "아직 분류되지 않은 항목들을 위한 영역입니다",
        color: "#6B7280", // 회색
        status: "active" as const,
        userId,
      };
      return await createArea(uncategorizedArea);
    }
  } catch (error) {
    console.error("미분류 영역 생성/조회 실패:", error);
    throw new Error("미분류 영역을 생성할 수 없습니다.");
  }
};

export const updateArea = async (
  areaId: string,
  updateData: Partial<Omit<Area, "id" | "userId" | "createdAt">>
): Promise<void> => {
  // 영역 정보 먼저 가져오기
  const area = await fetchAreaById(areaId);

  // "미분류" 영역은 수정할 수 없음
  if (area.name === "미분류") {
    throw new Error("미분류 영역은 수정할 수 없습니다.");
  }

  const docRef = doc(db, "areas", areaId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// Resources
export const createResource = async (
  resourceData: Omit<Resource, "id" | "createdAt" | "updatedAt">
): Promise<Resource> => {
  const baseData = createBaseData(resourceData.userId);
  const newResource = {
    ...resourceData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "resources"), newResource);

  // Resource 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: resourceData.userId,
    name: resourceData.name,
    areaId: resourceData.areaId,
    area: resourceData.area,
    areaColor: resourceData.areaColor,
    description: resourceData.description,
    text: resourceData.text,
    link: resourceData.link,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Resource;
};

export const updateResource = async (
  resourceId: string,
  updateData: Partial<Omit<Resource, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "resources", resourceId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// Projects
export const createProject = async (
  projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> => {
  const baseData = createBaseData(projectData.userId);

  // Date 객체의 유효성을 검사하고 안전하게 Timestamp로 변환
  const safeDateToTimestamp = (date: Date | any) => {
    if (!date) return Timestamp.now();

    // Date 객체인지 확인
    if (date instanceof Date) {
      // 유효한 Date인지 확인
      if (isNaN(date.getTime())) {
        console.warn("Invalid Date detected, using current timestamp");
        return Timestamp.now();
      }
      return Timestamp.fromDate(date);
    }

    // 문자열인 경우 Date로 변환 시도
    if (typeof date === "string") {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        console.warn("Invalid date string detected, using current timestamp");
        return Timestamp.now();
      }
      return Timestamp.fromDate(parsedDate);
    }

    // 그 외의 경우 현재 시간 사용
    console.warn("Unknown date format, using current timestamp");
    return Timestamp.now();
  };

  const newProject = {
    ...projectData,
    ...baseData,
    startDate: safeDateToTimestamp(projectData.startDate),
    endDate: safeDateToTimestamp(projectData.endDate),
  };

  console.log("🔥 Firestore: Creating project with data:", {
    title: newProject.title,
    startDate: newProject.startDate,
    endDate: newProject.endDate,
    target: newProject.target,
  });

  const docRef = await addDoc(collection(db, "projects"), newProject);

  // Project 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: projectData.userId,
    title: projectData.title,
    description: projectData.description,
    category: projectData.category,
    areaId: projectData.areaId,
    area: projectData.area,
    target: projectData.target,
    targetCount: projectData.targetCount,
    completedTasks: projectData.completedTasks || 0,
    startDate: projectData.startDate,
    endDate: projectData.endDate,
    createdAt: new Date(),
    updatedAt: new Date(),
    chapterId: projectData.chapterId,
    connectedChapters: projectData.connectedChapters || [],

    addedMidway: projectData.addedMidway,
    retrospective: projectData.retrospective,
    notes: projectData.notes || [],
    isCarriedOver: projectData.isCarriedOver,
    originalChapterId: projectData.originalChapterId,
    carriedOverAt: projectData.carriedOverAt,
    migrationStatus: projectData.migrationStatus,
  } as Project;
};

export const updateProject = async (
  projectId: string,
  updateData: Partial<Omit<Project, "id" | "userId" | "createdAt">>
): Promise<void> => {
  // Date 객체를 Timestamp로 변환
  const convertedUpdateData = {
    ...updateData,
    updatedAt: updateTimestamp(),
  };

  // startDate와 endDate가 Date 객체인 경우 Timestamp로 변환
  if (updateData.startDate) {
    convertedUpdateData.startDate = Timestamp.fromDate(
      updateData.startDate
    ) as any;
  }
  if (updateData.endDate) {
    convertedUpdateData.endDate = Timestamp.fromDate(updateData.endDate) as any;
  }

  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, convertedUpdateData);
};

// Tasks
export const createTask = async (
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> => {
  const baseData = createBaseData(taskData.userId);

  // Date 객체를 Timestamp로 변환
  const newTask = {
    ...taskData,
    ...baseData,
    date:
      taskData.date instanceof Date
        ? Timestamp.fromDate(taskData.date)
        : taskData.date,
  };

  const docRef = await addDoc(collection(db, "tasks"), newTask);

  // Task 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: taskData.userId,
    projectId: taskData.projectId,
    title: taskData.title,
    date: taskData.date,
    duration: taskData.duration,
    done: taskData.done,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Task;
};

export const updateTask = async (
  taskId: string,
  updateData: Partial<Omit<Task, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "tasks", taskId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// 프로젝트에 태스크 추가
export const addTaskToProject = async (
  projectId: string,
  taskData: Omit<
    Task,
    "id" | "projectId" | "userId" | "createdAt" | "updatedAt"
  >
): Promise<Task> => {
  // 먼저 프로젝트 정보를 가져와서 userId 확인
  const projectDoc = await getDoc(doc(db, "projects", projectId));
  if (!projectDoc.exists()) {
    throw new Error("Project not found");
  }

  const projectData = projectDoc.data();
  const newTask = {
    ...taskData,
    projectId,
    userId: projectData.userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await addDoc(collection(db, "tasks"), newTask);
  return { id: docRef.id, ...newTask } as Task;
};

// 프로젝트 태스크 수정
export const updateTaskInProject = async (
  taskId: string,
  updateData: Partial<Omit<Task, "id" | "projectId" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "tasks", taskId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: new Date(),
  });
};

// 프로젝트 태스크 삭제
export const deleteTaskFromProject = async (taskId: string): Promise<void> => {
  try {
    console.log(`🗑️ Firestore: 태스크 삭제 시작 - ID: ${taskId}`);
    const docRef = doc(db, "tasks", taskId);
    await deleteDoc(docRef);
    console.log(`✅ Firestore: 태스크 삭제 완료 - ID: ${taskId}`);
  } catch (error) {
    console.error(`❌ Firestore: 태스크 삭제 실패 - ID: ${taskId}`, error);
    throw new Error("태스크 삭제에 실패했습니다.");
  }
};

// Chapters
export const createChapter = async (
  chapterData: Omit<Chapter, "id" | "createdAt" | "updatedAt">
): Promise<Chapter> => {
  const baseData = createBaseData(chapterData.userId);

  // Date 객체를 Timestamp로 변환
  const newChapter = {
    ...chapterData,
    ...baseData,
    startDate:
      chapterData.startDate instanceof Date
        ? Timestamp.fromDate(chapterData.startDate)
        : chapterData.startDate,
    endDate:
      chapterData.endDate instanceof Date
        ? Timestamp.fromDate(chapterData.endDate)
        : chapterData.endDate,
  };

  const docRef = await addDoc(collection(db, "chapters"), newChapter);

  // Chapter 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: chapterData.userId,
    title: chapterData.title,
    startDate: chapterData.startDate,
    endDate: chapterData.endDate,
    status: chapterData.status || "planned",
    retrospective: chapterData.retrospective,
    focusAreas: chapterData.focusAreas || [],
    connectedProjects: chapterData.connectedProjects || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Chapter;
};

export const updateChapter = async (
  chapterId: string,
  updateData: Partial<Omit<Chapter, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "chapters", chapterId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// Retrospectives
export const createRetrospective = async (
  retrospectiveData: Omit<Retrospective, "id" | "createdAt" | "updatedAt">
): Promise<Retrospective> => {
  const baseData = createBaseData(retrospectiveData.userId);
  const newRetrospective = {
    ...retrospectiveData,
    ...baseData,
  };

  const docRef = await addDoc(
    collection(db, "retrospectives"),
    newRetrospective
  );

  // Retrospective 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: retrospectiveData.userId,
    title: retrospectiveData.title,
    projectId: retrospectiveData.projectId,
    chapterId: retrospectiveData.chapterId,
    content: retrospectiveData.content,
    bestMoment: retrospectiveData.bestMoment,
    routineAdherence: retrospectiveData.routineAdherence,
    userRating: retrospectiveData.userRating,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Retrospective;
};

export const updateRetrospective = async (
  retrospectiveId: string,
  updateData: Partial<Omit<Retrospective, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "retrospectives", retrospectiveId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// Notes
export const createNote = async (
  noteData: Omit<Note, "id" | "createdAt" | "updatedAt">
): Promise<Note> => {
  const baseData = createBaseData(noteData.userId);
  const newNote = {
    ...noteData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "notes"), newNote);

  // Note 타입에 맞는 객체로 변환하여 반환
  return {
    id: docRef.id,
    userId: noteData.userId,
    content: noteData.content,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Note;
};

export const updateNote = async (
  noteId: string,
  updateData: Partial<Omit<Note, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "notes", noteId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// --- User Functions ---

export const fetchUserById = async (userId: string): Promise<User> => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      profile: {
        ...data.profile,
        createdAt: data.profile.createdAt.toDate(),
        updatedAt: data.profile.updatedAt.toDate(),
      },
      settings: data.settings,
      preferences: data.preferences,
    } as User;
  } else {
    throw new Error("User not found");
  }
};

export const createUser = async (
  userId: string,
  userData: {
    profile: Omit<UserProfile, "createdAt" | "updatedAt">;
    settings?: Partial<UserSettings>;
    preferences?: Partial<UserPreferences>;
  }
): Promise<User> => {
  const defaultSettings: UserSettings = {
    defaultReward: "",
    defaultRewardEnabled: false,
    carryOver: true, // 기본적으로 true로 설정
    aiRecommendations: true,
    notifications: true,
    theme: "system",
    language: "ko",
  };

  const defaultPreferences: UserPreferences = {
    timezone: "Asia/Seoul",
    dateFormat: "ko-KR",
    weeklyStartDay: "monday",
  };

  const userDoc = {
    profile: {
      ...userData.profile,
      createdAt: createTimestamp(),
      updatedAt: createTimestamp(),
    },
    settings: {
      ...defaultSettings,
      ...userData.settings,
    },
    preferences: {
      ...defaultPreferences,
      ...userData.preferences,
    },
  };

  await setDoc(doc(db, "users", userId), userDoc);

  // User 타입에 맞는 객체로 변환하여 반환
  return {
    id: userId,
    profile: {
      ...userData.profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    settings: {
      ...defaultSettings,
      ...userData.settings,
    },
    preferences: {
      ...defaultPreferences,
      ...userData.preferences,
    },
  } as User;
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<Omit<UserProfile, "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    profile: {
      ...updateData,
      updatedAt: updateTimestamp(),
    },
  });
};

export const updateUserSettings = async (
  userId: string,
  updateData: Partial<UserSettings>
): Promise<void> => {
  const docRef = doc(db, "users", userId);

  // 점 표기법을 사용하여 중첩 필드 업데이트
  const updateFields: any = {};
  Object.entries(updateData).forEach(([key, value]) => {
    updateFields[`settings.${key}`] = value;
  });

  console.log("Updating user settings:", { userId, updateData, updateFields });

  try {
    await updateDoc(docRef, updateFields);
    console.log("User settings updated successfully");
  } catch (error) {
    console.error("Failed to update user settings:", error);
    throw error;
  }
};

export const updateUserPreferences = async (
  userId: string,
  updateData: Partial<UserPreferences>
): Promise<void> => {
  const docRef = doc(db, "users", userId);

  // 점 표기법을 사용하여 중첩 필드 업데이트
  const updateFields: any = {};
  Object.entries(updateData).forEach(([key, value]) => {
    updateFields[`preferences.${key}`] = value;
  });

  await updateDoc(docRef, updateFields);
};

// --- Firebase Auth Profile Update ---

export const updateUserDisplayName = async (
  displayName: string
): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("로그인된 사용자가 없습니다.");
  }

  await updateProfile(currentUser, {
    displayName: displayName,
  });
};

// 프로필 사진 업로드 함수
export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    // 파일 확장자 확인
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      throw new Error(
        "지원하지 않는 파일 형식입니다. JPEG, PNG, GIF 파일만 업로드 가능합니다."
      );
    }

    // 파일 크기 확인 (2MB 제한)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error(
        "파일 크기가 너무 큽니다. 2MB 이하의 파일만 업로드 가능합니다."
      );
    }

    // Storage 참조 생성
    const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);

    // 파일 업로드
    const snapshot = await uploadBytes(storageRef, file);

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error("프로필 사진 업로드 실패:", error);
    throw error;
  }
};

// 프로필 사진 삭제 함수
export const deleteProfilePicture = async (
  userId: string,
  fileName: string
): Promise<void> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}/${fileName}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("프로필 사진 삭제 실패:", error);
    throw error;
  }
};

// 사용자 프로필 사진 업데이트 함수
export const updateUserProfilePicture = async (
  photoURL: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("사용자가 로그인되지 않았습니다.");
  }

  await updateProfile(user, {
    photoURL,
  });
};

// Delete functions
export const deleteAreaById = async (
  areaId: string,
  deleteWithItems: boolean = false
): Promise<void> => {
  try {
    // 영역 정보 먼저 가져오기
    const area = await fetchAreaById(areaId);

    // "미분류" 영역은 삭제할 수 없음
    if (area.name === "미분류") {
      throw new Error("미분류 영역은 삭제할 수 없습니다.");
    }

    if (deleteWithItems) {
      // 연결된 프로젝트들 삭제
      const projects = await fetchProjectsByAreaId(areaId);
      for (const project of projects) {
        await deleteProjectById(project.id);
      }

      // 연결된 리소스들 삭제
      const allResources = await fetchAllResourcesByUserId(area.userId);
      const areaResources = allResources.filter(
        (resource) => resource.areaId === areaId
      );

      for (const resource of areaResources) {
        await deleteResourceById(resource.id);
      }
    } else {
      // "미분류" 영역 가져오기 또는 생성
      const uncategorizedArea = await getOrCreateUncategorizedArea(area.userId);

      // 연결된 프로젝트들을 "미분류"로 이동
      const projects = await fetchProjectsByAreaId(areaId);
      for (const project of projects) {
        await updateProject(project.id, { areaId: uncategorizedArea.id });
      }

      // 연결된 리소스들을 "미분류"로 이동
      const allResources = await fetchAllResourcesByUserId(area.userId);
      const areaResources = allResources.filter(
        (resource) => resource.areaId === areaId
      );

      for (const resource of areaResources) {
        await updateResource(resource.id, { areaId: uncategorizedArea.id });
      }
    }

    // Area 자체 삭제
    const docRef = doc(db, "areas", areaId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting area:", error);
    throw new Error("영역 삭제에 실패했습니다.");
  }
};

export const deleteResourceById = async (resourceId: string): Promise<void> => {
  try {
    const docRef = doc(db, "resources", resourceId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting resource:", error);
    throw new Error("자료 삭제에 실패했습니다.");
  }
};

export const deleteProjectById = async (projectId: string): Promise<void> => {
  try {
    console.log(`🗑️ 프로젝트 삭제 시작 - ID: ${projectId}`);

    // 1. 프로젝트에 연관된 모든 태스크 조회
    const tasks = await fetchAllTasksByProjectId(projectId);
    console.log(`📋 발견된 태스크 수: ${tasks.length}개`);

    // 2. 연관된 태스크들 삭제
    if (tasks.length > 0) {
      console.log("🗑️ 연관된 태스크들 삭제 시작...");
      for (const task of tasks) {
        try {
          await deleteTaskFromProject(task.id);
          console.log(`✅ 태스크 삭제 완료: ${task.title}`);
        } catch (error) {
          console.error(`❌ 태스크 삭제 실패: ${task.title}`, error);
          // 태스크 삭제 실패해도 프로젝트 삭제는 계속 진행
        }
      }
      console.log("✅ 모든 연관 태스크 삭제 완료");
    }

    // 3. 프로젝트 자체 삭제
    const docRef = doc(db, "projects", projectId);
    await deleteDoc(docRef);
    console.log(`✅ 프로젝트 삭제 완료 - ID: ${projectId}`);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("프로젝트 삭제에 실패했습니다.");
  }
};

export const deleteChapterById = async (chapterId: string): Promise<void> => {
  try {
    const docRef = doc(db, "chapters", chapterId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting chapter:", error);
    throw new Error("챕터 삭제에 실패했습니다.");
  }
};

// 자동 이관을 위한 함수: 완료된 챕터의 미완료 프로젝트를 다음 챕터로 이관
export const autoMigrateIncompleteProjects = async (
  userId: string,
  completedChapterId: string
): Promise<void> => {
  // 사용자 설정 확인
  const userData = await fetchUserById(userId);
  const carryOverEnabled = userData.settings?.carryOver ?? true; // 기본값 true

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

  // 2. 다음 달 챕터 찾기 (진행 중이거나 예정된 챕터)
  const allChapters = await fetchAllChaptersByUserId(userId);
  const { getChapterStatus } = await import("./utils");

  const sortedChapters = allChapters
    .filter((chapter) => {
      const status = getChapterStatus(chapter);
      return status === "in_progress" || status === "planned";
    })
    .sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

  const targetChapter = sortedChapters[0]; // 가장 빠른 미래 챕터

  if (!targetChapter) {
    // 다음 달 챕터가 없으면 프로젝트에 이관 대기 상태로 마킹
    for (const project of incompleteProjects) {
      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
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
        `Migrated project ${project.title} to chapter ${targetChapter.title}`
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
  const userData = await fetchUserById(userId);
  const carryOverEnabled = userData.settings?.carryOver ?? true; // 기본값 true

  if (!carryOverEnabled) {
    console.log(
      `Carry over is disabled for user ${userId}. Skipping pending project connection.`
    );
    return;
  }

  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("migrationStatus", "==", "pending")
  );

  const querySnapshot = await getDocs(projectsQuery);
  const pendingProjects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Project;
  });

  for (const project of pendingProjects) {
    try {
      // 기존 connectedChapters에 새 챕터 추가
      const connectedChapters = (project as any).connectedChapters || [];
      const updatedChapters = [...connectedChapters, newChapterId];

      const projectRef = doc(db, "projects", project.id);
      await updateDoc(projectRef, {
        connectedChapters: updatedChapters,
        migrationStatus: "migrated",
        carriedOverAt: new Date(),
        updatedAt: new Date(),
      });

      // 새 챕터 정보 가져오기
      const chapterRef = doc(db, "chapters", newChapterId);
      const chapterSnap = await getDoc(chapterRef);
      if (chapterSnap.exists()) {
        const chapterData = chapterSnap.data();
        const newChapterInfo = {
          id: newChapterId,
          title: chapterData.title,
          startDate: chapterData.startDate.toDate(),
          endDate: chapterData.endDate.toDate(),
        };

        // 새 챕터가 이미 연결되어 있지 않으면 추가
        const isAlreadyConnected = updatedChapters.some(
          (chapter: any) => chapter.id === newChapterId
        );

        const finalConnectedChapters = isAlreadyConnected
          ? updatedChapters
          : [...updatedChapters, newChapterInfo];

        await updateDoc(projectRef, {
          connectedChapters: finalConnectedChapters,
          migrationStatus: "migrated",
          carriedOverAt: new Date(),
          updatedAt: new Date(),
        });
      }

      console.log(`Connected pending project ${project.title} to new chapter`);
    } catch (error) {
      console.error(`Failed to connect pending project ${project.id}:`, error);
    }
  }
};

// 상태별 프로젝트 조회 함수들 (동적 계산 기반)

// 진행 중인 프로젝트들 가져오기
export const fetchActiveProjects = async (
  userId: string
): Promise<Project[]> => {
  try {
    const today = new Date();

    // 임시 해결책: 복합 인덱스 없이 모든 프로젝트를 가져온 후 클라이언트에서 필터링
    const q = query(collection(db, "projects"), where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const allProjects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Project;
    });

    // 클라이언트에서 현재 진행 중인 프로젝트들 필터링 (시작일 <= 오늘 <= 종료일)
    return allProjects.filter((project) => {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      return startDate <= today && endDate >= today;
    });
  } catch (error) {
    console.error("진행 중인 프로젝트 조회 중 오류:", error);
    return [];
  }
};

// 완료된 프로젝트들 가져오기
export const fetchCompletedProjects = async (
  userId: string
): Promise<Project[]> => {
  try {
    const today = new Date();

    // 완료된 프로젝트들 (종료일 < 오늘 또는 완료율 100%)
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("endDate", "<", today)
    );

    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Project;
    });

    // 완료율 100%인 프로젝트들도 포함
    return projects.filter((project) => {
      const completionRate =
        project.targetCount && project.completedTasks
          ? (project.completedTasks / project.targetCount) * 100
          : 0;
      return completionRate >= 100;
    });
  } catch (error) {
    console.error("완료된 프로젝트 조회 중 오류:", error);
    return [];
  }
};

// 오늘 마감인 프로젝트 체크 함수 - 임시 해결책
export const getTodayDeadlineProjects = async (
  userId: string
): Promise<Project[]> => {
  try {
    const today = new Date();
    const todayDateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const tomorrowDateOnly = new Date(todayDateOnly);
    tomorrowDateOnly.setDate(tomorrowDateOnly.getDate() + 1);

    // 임시 해결책: 복합 인덱스 없이 모든 프로젝트를 가져온 후 클라이언트에서 필터링
    const q = query(collection(db, "projects"), where("userId", "==", userId));

    const querySnapshot = await getDocs(q);
    const allProjects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Project;
    });

    // 클라이언트에서 오늘 마감인 프로젝트들 필터링
    return allProjects.filter((project) => {
      const endDate = new Date(project.endDate);
      const projectEndDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );
      return (
        projectEndDateOnly >= todayDateOnly &&
        projectEndDateOnly < tomorrowDateOnly
      );
    });
  } catch (error) {
    console.error("오늘 마감 프로젝트 조회 중 오류:", error);
    return [];
  }
};

// 연간 활동 통계 가져오기
export const fetchYearlyActivityStats = async (
  userId: string,
  year: number
): Promise<any> => {
  try {
    // 1. 완료된 챕터들 가져오기
    const allChapters = await fetchAllChaptersByUserId(userId);
    const completedChapters = allChapters.filter((chapter) => {
      const chapterYear = new Date(chapter.endDate).getFullYear();
      return chapterYear === year && getChapterStatus(chapter) === "ended";
    });

    // 2. 받은 보상 수 계산
    const totalRewards = completedChapters.reduce(
      (sum, chapter) => sum + (chapter.reward ? 1 : 0),
      0
    );

    // 3. Area별 활동 통계 계산
    const areas = await fetchAllAreasByUserId(userId);
    const areaStats: any = {};

    for (const area of areas) {
      const areaProjects = await fetchProjectsByAreaId(area.id);
      const yearProjects = areaProjects.filter((project) => {
        const projectYear = new Date(project.endDate).getFullYear();
        return projectYear === year;
      });

      const totalFocusTime = yearProjects.reduce(
        (sum, project) => sum + (project.targetCount || 0),
        0
      );

      const completedProjects = yearProjects.filter((project) => {
        const completionRate =
          project.targetCount && project.completedTasks
            ? (project.completedTasks / project.targetCount) * 100
            : 0;
        return completionRate >= 100;
      });

      const completionRate =
        yearProjects.length > 0
          ? Math.round((completedProjects.length / yearProjects.length) * 100)
          : 0;

      areaStats[area.id] = {
        name: area.name,
        focusTime: totalFocusTime,
        completionRate,
        projectCount: yearProjects.length,
      };
    }

    // 4. 월별 진행률 계산
    const monthlyProgress: any = {};
    for (let month = 1; month <= 12; month++) {
      const monthChapters = completedChapters.filter((chapter) => {
        const chapterMonth = new Date(chapter.endDate).getMonth() + 1;
        return chapterMonth === month;
      });

      const totalFocusTime = monthChapters.reduce(
        (sum, chapter) => sum + (chapter.targetCount || 0),
        0
      );

      const completionRate =
        monthChapters.length > 0
          ? Math.round(
              (monthChapters.filter(
                (chapter) =>
                  (chapter.targetCount || 0) > 0 &&
                  chapter.doneCount >= (chapter.targetCount || 0)
              ).length /
                monthChapters.length) *
                100
            )
          : 0;

      monthlyProgress[month] = {
        completionRate,
        focusTime: totalFocusTime,
        projectCount: monthChapters.length,
      };
    }

    // 5. 전체 통계 계산
    const totalFocusTime = completedChapters.reduce(
      (sum, chapter) => sum + (chapter.targetCount || 0),
      0
    );

    const averageCompletionRate =
      completedChapters.length > 0
        ? Math.round(
            completedChapters.reduce(
              (sum, chapter) =>
                sum +
                ((chapter.targetCount || 0) > 0
                  ? Math.round(
                      (chapter.doneCount / (chapter.targetCount || 0)) * 100
                    )
                  : 0),
              0
            ) / completedChapters.length
          )
        : 0;

    return {
      completedChapters: completedChapters.length,
      totalRewards,
      areaStats,
      monthlyProgress,
      totalFocusTime,
      averageCompletionRate,
    };
  } catch (error) {
    console.error("연간 활동 통계 조회 중 오류:", error);
    return {
      completedChapters: 0,
      totalRewards: 0,
      areaStats: {},
      monthlyProgress: {},
      totalFocusTime: 0,
      averageCompletionRate: 0,
    };
  }
};

// 모든 태스크의 날짜를 해당 프로젝트의 시작일로 수정하는 함수
export const updateAllTasksToProjectStartDate = async (
  userId: string
): Promise<{ updatedTasks: number; totalTasks: number }> => {
  try {
    console.log("🔄 모든 태스크 날짜를 프로젝트 시작일로 수정 시작");

    // 1. 사용자의 모든 프로젝트 가져오기
    const projects = await fetchAllProjectsByUserId(userId);
    console.log(`📋 총 ${projects.length}개의 프로젝트 발견`);

    // 2. 사용자의 모든 태스크 가져오기
    const allTasks = await fetchAllTasksByUserId(userId);
    console.log(`📝 총 ${allTasks.length}개의 태스크 발견`);

    let updatedTasks = 0;
    const batch = writeBatch(db);

    // 3. 각 태스크에 대해 해당 프로젝트의 시작일로 날짜 수정
    for (const task of allTasks) {
      const project = projects.find((p) => p.id === task.projectId);

      if (project) {
        const projectStartDate = new Date(project.startDate);
        const currentTaskDate = new Date(task.date);

        // 태스크 날짜가 프로젝트 시작일과 다른 경우에만 업데이트
        if (currentTaskDate.getTime() !== projectStartDate.getTime()) {
          const taskRef = doc(db, "tasks", task.id);
          batch.update(taskRef, {
            date: Timestamp.fromDate(projectStartDate),
            updatedAt: updateTimestamp(),
          });
          updatedTasks++;
          console.log(
            `✅ 태스크 "${task.title}" 날짜를 프로젝트 "${project.title}" 시작일로 수정`
          );
        }
      } else {
        console.warn(
          `⚠️ 태스크 "${task.title}"의 프로젝트를 찾을 수 없음 (projectId: ${task.projectId})`
        );
      }
    }

    // 4. 배치 업데이트 실행
    if (updatedTasks > 0) {
      await batch.commit();
      console.log(
        `🎉 총 ${updatedTasks}개의 태스크 날짜가 성공적으로 수정되었습니다.`
      );
    } else {
      console.log("ℹ️ 수정할 태스크가 없습니다.");
    }

    return { updatedTasks, totalTasks: allTasks.length };
  } catch (error) {
    console.error("❌ 태스크 날짜 수정 중 오류 발생:", error);
    throw new Error("태스크 날짜 수정에 실패했습니다.");
  }
};

// 특정 프로젝트의 모든 태스크 날짜를 프로젝트 시작일로 수정하는 함수
export const updateProjectTasksToStartDate = async (
  projectId: string
): Promise<{ updatedTasks: number; totalTasks: number }> => {
  try {
    console.log(`🔄 프로젝트 ${projectId}의 태스크 날짜를 시작일로 수정 시작`);

    // 1. 프로젝트 정보 가져오기
    const project = await fetchProjectById(projectId);
    console.log(`📋 프로젝트 "${project.title}" 정보 로드`);

    // 2. 프로젝트의 모든 태스크 가져오기
    const projectTasks = await fetchAllTasksByProjectId(projectId);
    console.log(`📝 프로젝트에 ${projectTasks.length}개의 태스크 발견`);

    if (projectTasks.length === 0) {
      console.log("ℹ️ 수정할 태스크가 없습니다.");
      return { updatedTasks: 0, totalTasks: 0 };
    }

    let updatedTasks = 0;
    const batch = writeBatch(db);
    const projectStartDate = new Date(project.startDate);

    // 3. 각 태스크의 날짜를 프로젝트 시작일로 수정
    for (const task of projectTasks) {
      const currentTaskDate = new Date(task.date);

      // 태스크 날짜가 프로젝트 시작일과 다른 경우에만 업데이트
      if (currentTaskDate.getTime() !== projectStartDate.getTime()) {
        const taskRef = doc(db, "tasks", task.id);
        batch.update(taskRef, {
          date: Timestamp.fromDate(projectStartDate),
          updatedAt: updateTimestamp(),
        });
        updatedTasks++;
        console.log(`✅ 태스크 "${task.title}" 날짜를 프로젝트 시작일로 수정`);
      }
    }

    // 4. 배치 업데이트 실행
    if (updatedTasks > 0) {
      await batch.commit();
      console.log(
        `🎉 프로젝트 "${project.title}"의 ${updatedTasks}개 태스크 날짜가 성공적으로 수정되었습니다.`
      );
    } else {
      console.log("ℹ️ 수정할 태스크가 없습니다.");
    }

    return { updatedTasks, totalTasks: projectTasks.length };
  } catch (error) {
    console.error("❌ 프로젝트 태스크 날짜 수정 중 오류 발생:", error);
    throw new Error("프로젝트 태스크 날짜 수정에 실패했습니다.");
  }
};

// 페이징을 위한 프로젝트 조회 함수
export const fetchProjectsByUserIdWithPaging = async (
  userId: string,
  pageLimit: number = 10,
  lastDoc?: any,
  sortBy: string = "latest"
): Promise<{
  projects: Project[];
  lastDoc: any;
  hasMore: boolean;
}> => {
  try {
    let q = query(collection(db, "projects"), where("userId", "==", userId));

    // 정렬 기준에 따라 쿼리 구성
    switch (sortBy) {
      case "latest":
        q = query(q, orderBy("createdAt", "desc"));
        break;
      case "oldest":
        q = query(q, orderBy("createdAt", "asc"));
        break;
      case "name":
        q = query(q, orderBy("title", "asc"));
        break;
      default:
        q = query(q, orderBy("createdAt", "desc"));
    }

    // 페이징 적용
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(pageLimit + 1)); // 다음 페이지 존재 여부 확인을 위해 +1

    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Project;
    });

    const hasMore = projects.length > pageLimit;
    const projectsToReturn = hasMore ? projects.slice(0, pageLimit) : projects;
    const newLastDoc = hasMore ? querySnapshot.docs[pageLimit - 1] : null;

    return {
      projects: projectsToReturn,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching projects with paging:", error);
    throw new Error("프로젝트 조회에 실패했습니다.");
  }
};

// 페이징을 위한 리소스 조회 함수
export const fetchResourcesByUserIdWithPaging = async (
  userId: string,
  pageLimit: number = 10,
  lastDoc?: any,
  sortBy: string = "latest"
): Promise<{
  resources: Resource[];
  lastDoc: any;
  hasMore: boolean;
}> => {
  try {
    let q = query(collection(db, "resources"), where("userId", "==", userId));

    // 정렬 기준에 따라 쿼리 구성
    switch (sortBy) {
      case "latest":
        q = query(q, orderBy("createdAt", "desc"));
        break;
      case "oldest":
        q = query(q, orderBy("createdAt", "asc"));
        break;
      case "name":
        q = query(q, orderBy("name", "asc"));
        break;
      default:
        q = query(q, orderBy("createdAt", "desc"));
    }

    // 페이징 적용
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(pageLimit + 1)); // 다음 페이지 존재 여부 확인을 위해 +1

    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Resource;
    });

    const hasMore = resources.length > pageLimit;
    const resourcesToReturn = hasMore
      ? resources.slice(0, pageLimit)
      : resources;
    const newLastDoc = hasMore ? querySnapshot.docs[pageLimit - 1] : null;

    return {
      resources: resourcesToReturn,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching resources with paging:", error);
    throw new Error("리소스 조회에 실패했습니다.");
  }
};

// 리소스와 연결된 영역 정보를 함께 가져오는 함수
export const fetchResourcesWithAreasByUserIdWithPaging = async (
  userId: string,
  pageLimit: number = 10,
  lastDoc?: any,
  sortBy: string = "latest"
): Promise<{
  resources: Array<Resource & { area?: { id: string; name: string } }>;
  lastDoc: any;
  hasMore: boolean;
}> => {
  try {
    // 먼저 리소스들을 가져옴
    const resourcesResult = await fetchResourcesByUserIdWithPaging(
      userId,
      pageLimit,
      lastDoc,
      sortBy
    );

    // 리소스들의 고유한 areaId들을 수집
    const areaIds = [
      ...new Set(
        resourcesResult.resources
          .map((resource) => resource.areaId)
          .filter((areaId) => areaId) // null/undefined 제거
      ),
    ];

    // 영역 정보를 배치로 가져오기
    const areasMap = new Map<string, { id: string; name: string }>();

    if (areaIds.length > 0) {
      const areasQuery = query(
        collection(db, "areas"),
        where("__name__", "in", areaIds)
      );
      const areasSnapshot = await getDocs(areasQuery);

      areasSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        areasMap.set(doc.id, {
          id: doc.id,
          name: data.name || "기타",
        });
      });
    }

    // 리소스에 영역 정보 추가
    const resourcesWithAreas = resourcesResult.resources.map((resource) => ({
      ...resource,
      area: resource.areaId ? areasMap.get(resource.areaId) : undefined,
    })) as Array<Resource & { area?: { id: string; name: string } }>;

    console.log(
      "PARA: Resources with areas:",
      resourcesWithAreas.map((r) => ({
        name: r.name,
        areaId: r.areaId,
        areaName: r.area?.name,
      }))
    );

    return {
      resources: resourcesWithAreas,
      lastDoc: resourcesResult.lastDoc,
      hasMore: resourcesResult.hasMore,
    };
  } catch (error) {
    console.error("Error fetching resources with areas:", error);
    throw new Error("리소스와 영역 정보 조회에 실패했습니다.");
  }
};

// 영역별 프로젝트와 리소스 개수만 가져오는 함수 (최적화)
export const fetchAreaCountsByUserId = async (
  userId: string
): Promise<{
  [areaId: string]: {
    projectCount: number;
    resourceCount: number;
  };
}> => {
  try {
    // Firestore 집계 쿼리로 개수만 계산
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);

    const resourcesQuery = query(
      collection(db, "resources"),
      where("userId", "==", userId)
    );
    const resourcesSnapshot = await getDocs(resourcesQuery);

    // 영역별 개수 계산 (클라이언트에서 최소한의 계산)
    const stats: {
      [areaId: string]: { projectCount: number; resourceCount: number };
    } = {};

    // 프로젝트 개수 계산
    projectsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const areaId = data.areaId;
      if (areaId) {
        if (!stats[areaId]) {
          stats[areaId] = { projectCount: 0, resourceCount: 0 };
        }
        stats[areaId].projectCount++;
      }
    });

    // 리소스 개수 계산
    resourcesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const areaId = data.areaId;
      if (areaId) {
        if (!stats[areaId]) {
          stats[areaId] = { projectCount: 0, resourceCount: 0 };
        }
        stats[areaId].resourceCount++;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error fetching area counts:", error);
    throw new Error("영역별 개수 조회에 실패했습니다.");
  }
};

// 페이징을 위한 아카이브 조회 함수
export const fetchArchivesByUserIdWithPaging = async (
  userId: string,
  pageLimit: number = 10,
  lastDoc?: any,
  sortBy: string = "latest"
): Promise<{
  archives: Retrospective[];
  lastDoc: any;
  hasMore: boolean;
}> => {
  try {
    let q = query(
      collection(db, "retrospectives"),
      where("userId", "==", userId)
    );

    // 정렬 기준에 따라 쿼리 구성
    switch (sortBy) {
      case "latest":
        q = query(q, orderBy("createdAt", "desc"));
        break;
      case "oldest":
        q = query(q, orderBy("createdAt", "asc"));
        break;
      case "rating":
        q = query(q, orderBy("userRating", "desc"));
        break;
      default:
        q = query(q, orderBy("createdAt", "desc"));
    }

    // 페이징 적용
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    q = query(q, limit(pageLimit + 1)); // 다음 페이지 존재 여부 확인을 위해 +1

    const querySnapshot = await getDocs(q);
    const archives = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Retrospective;
    });

    const hasMore = archives.length > pageLimit;
    const archivesToReturn = hasMore ? archives.slice(0, pageLimit) : archives;
    const newLastDoc = hasMore ? querySnapshot.docs[pageLimit - 1] : null;

    return {
      archives: archivesToReturn,
      lastDoc: newLastDoc,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching archives with paging:", error);
    throw new Error("아카이브 조회에 실패했습니다.");
  }
};

// 전체 프로젝트 개수만 가져오는 함수
export const fetchProjectCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    return projectsSnapshot.size;
  } catch (error) {
    console.error("Error fetching project count:", error);
    throw new Error("프로젝트 개수 조회에 실패했습니다.");
  }
};

// 전체 리소스 개수만 가져오는 함수
export const fetchResourceCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const resourcesQuery = query(
      collection(db, "resources"),
      where("userId", "==", userId)
    );
    const resourcesSnapshot = await getDocs(resourcesQuery);
    return resourcesSnapshot.size;
  } catch (error) {
    console.error("Error fetching resource count:", error);
    throw new Error("리소스 개수 조회에 실패했습니다.");
  }
};

// 전체 아카이브 개수만 가져오는 함수
export const fetchArchiveCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const archivesQuery = query(
      collection(db, "retrospectives"),
      where("userId", "==", userId)
    );
    const archivesSnapshot = await getDocs(archivesQuery);
    return archivesSnapshot.size;
  } catch (error) {
    console.error("Error fetching archive count:", error);
    throw new Error("아카이브 개수 조회에 실패했습니다.");
  }
};

// 챕터와 프로젝트 개수를 한 번에 효율적으로 조회하는 함수
export const fetchChaptersWithProjectCounts = async (
  userId: string
): Promise<(Chapter & { projectCount: number })[]> => {
  // 1. 모든 챕터 조회
  const chapters = await fetchAllChaptersByUserId(userId);

  if (chapters.length === 0) return [];

  // 2. 모든 프로젝트를 한 번에 조회하여 챕터별 개수 계산
  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId)
  );
  const projectsSnapshot = await getDocs(projectsQuery);

  // 3. 챕터별 프로젝트 개수 계산
  const projectCounts: { [chapterId: string]: number } = {};

  console.log("🔍 프로젝트 개수 계산 시작");
  console.log("총 프로젝트 수:", projectsSnapshot.size);

  projectsSnapshot.docs.forEach((doc) => {
    const projectData = doc.data();
    const connectedChapters = projectData.connectedChapters || [];

    console.log(
      `프로젝트 "${projectData.title}"의 connectedChapters:`,
      connectedChapters
    );

    // 이제 단순 ID 배열이므로 직접 사용
    connectedChapters.forEach((chapterId: string) => {
      console.log("챕터 ID:", chapterId);
      if (chapterId) {
        projectCounts[chapterId] = (projectCounts[chapterId] || 0) + 1;
        console.log(
          `챕터 ${chapterId}에 프로젝트 추가. 현재 개수: ${projectCounts[chapterId]}`
        );
      }
    });
  });

  console.log("최종 프로젝트 개수:", projectCounts);

  // 4. 챕터에 프로젝트 개수 추가
  return chapters.map((chapter) => ({
    ...chapter,
    projectCount: projectCounts[chapter.id] || 0,
  }));
};

// 챕터 ID 배열로 챕터 정보 가져오기
export const fetchChaptersByIds = async (
  chapterIds: string[]
): Promise<Chapter[]> => {
  if (chapterIds.length === 0) return [];

  const connectedChapters: Chapter[] = [];

  // 배치로 챕터 정보 가져오기 (Firestore는 'in' 쿼리에서 최대 10개만 지원)
  const batchSize = 10;
  for (let i = 0; i < chapterIds.length; i += batchSize) {
    const batch = chapterIds.slice(i, i + batchSize);

    const q = query(collection(db, "chapters"), where("__name__", "in", batch));

    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach((doc) => {
      const chapterData = doc.data();
      connectedChapters.push({
        id: doc.id,
        userId: chapterData.userId,
        title: chapterData.title,
        startDate: chapterData.startDate.toDate(),
        endDate: chapterData.endDate.toDate(),
        focusAreas: chapterData.focusAreas || [],
        reward: chapterData.reward,
        createdAt: chapterData.createdAt.toDate(),
        updatedAt: chapterData.updatedAt.toDate(),
        doneCount: chapterData.doneCount || 0,
        targetCount: chapterData.targetCount || 0,
        connectedProjects: chapterData.connectedProjects || [],
        retrospective: chapterData.retrospective,
        note: chapterData.note,
      });
    });
  }

  // 날짜순으로 정렬
  connectedChapters.sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  return connectedChapters;
};

// 오늘 날짜의 task들을 가져오는 함수
export const getTodayTasks = async (
  userId: string,
  currentChapterId?: string
): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 현재 챕터의 프로젝트들을 먼저 가져오기
    let projectIds: string[] = [];

    if (currentChapterId) {
      // 특정 챕터의 프로젝트들만
      const projects = await fetchProjectsByChapterId(currentChapterId, userId);
      projectIds = projects.map((p) => p.id);
    } else {
      // 현재 진행 중인 챕터의 프로젝트들
      const chapters = await fetchAllChaptersByUserId(userId);
      const currentChapter = chapters.find((chapter) => {
        const status = getChapterStatus(chapter);
        return status === "in_progress";
      });

      if (currentChapter) {
        const projects = await fetchProjectsByChapterId(
          currentChapter.id,
          userId
        );
        projectIds = projects.map((p) => p.id);
      }
    }

    if (projectIds.length === 0) {
      return [];
    }

    // 각 프로젝트에서 오늘 날짜의 task들을 가져오기
    const todayTasks: Task[] = [];

    for (const projectId of projectIds) {
      try {
        const tasks = await fetchAllTasksByProjectId(projectId);
        const projectTodayTasks = tasks.filter((task) => {
          const taskDate = new Date(task.date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate >= today && taskDate < tomorrow;
        });
        todayTasks.push(...projectTodayTasks);
      } catch (error) {
        console.error(`프로젝트 ${projectId}의 task 조회 실패:`, error);
      }
    }

    return sortTasksByDateAndTitle(todayTasks);
  } catch (error) {
    console.error("오늘 task 조회 실패:", error);
    return [];
  }
};
