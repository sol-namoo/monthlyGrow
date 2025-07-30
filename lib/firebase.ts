// src/lib/firebase.ts

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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
} from "firebase/firestore";
import {
  Area,
  Resource,
  Project,
  Task,
  Loop,
  Retrospective,
  User,
  UserProfile,
  UserSettings,
  UserPreferences,
} from "./types"; // lib/types.ts에서 타입 import

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

// Set persistence to LOCAL (localStorage)
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence 설정 실패:", error);
});

// --- Utility Functions ---

// 데이터 생성 시 타임스탬프 설정 유틸리티
export const createTimestamp = () => new Date();

// 데이터 생성 시 기본 필드 설정
export const createBaseData = (userId: string) => ({
  userId,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(), // 생성 시에는 createdAt과 동일
});

// 데이터 수정 시 updatedAt 필드 업데이트
export const updateTimestamp = () => new Date();

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
    } as Project;
  });
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Project;
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
    } as Project;
  });
};

export const fetchProjectsByLoopId = async (
  loopId: string
): Promise<Project[]> => {
  const loop = await fetchLoopById(loopId);
  if (!loop || !loop.projectIds) {
    return [];
  }
  const projectsPromises = loop.projectIds.map((projectId: string) =>
    fetchProjectById(projectId)
  );
  const projects = await Promise.all(projectsPromises);
  return projects;
};

// Tasks
export const fetchAllTasksByUserId = async (
  userId: string
): Promise<Task[]> => {
  const q = query(collection(db, "tasks"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
};

export const fetchAllTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Task[];
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

// Loops
export const fetchAllLoopsByUserId = async (
  userId: string
): Promise<Loop[]> => {
  const q = query(collection(db, "loops"), where("userId", "==", userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      // status 필드 제거 - 클라이언트에서 날짜 기반으로 계산
      focusAreas: data.focusAreas,
      projectIds: data.projectIds,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      doneCount: data.doneCount,
      targetCount: data.targetCount,
      reward: data.reward,
    } as Loop;
  });
};

export const fetchLoopById = async (loopId: string): Promise<Loop> => {
  const docRef = doc(db, "loops", loopId);
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
    } as Loop;
  } else {
    throw new Error("Loop not found");
  }
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

export const fetchRetrospectivesByLoopId = async (
  loopId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("loopId", "==", loopId)
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
  return { id: docRef.id, ...newArea } as Area;
};

export const updateArea = async (
  areaId: string,
  updateData: Partial<Omit<Area, "id" | "userId" | "createdAt">>
): Promise<void> => {
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
  return { id: docRef.id, ...newResource } as Resource;
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
  const newProject = {
    ...projectData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "projects"), newProject);
  return { id: docRef.id, ...newProject } as Project;
};

export const updateProject = async (
  projectId: string,
  updateData: Partial<Omit<Project, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "projects", projectId);
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: updateTimestamp(),
  });
};

// Tasks
export const createTask = async (
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> => {
  const baseData = createBaseData(taskData.userId);
  const newTask = {
    ...taskData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "tasks"), newTask);
  return { id: docRef.id, ...newTask } as Task;
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

// Loops
export const createLoop = async (
  loopData: Omit<Loop, "id" | "createdAt" | "updatedAt">
): Promise<Loop> => {
  const baseData = createBaseData(loopData.userId);
  const newLoop = {
    ...loopData,
    ...baseData,
  };

  const docRef = await addDoc(collection(db, "loops"), newLoop);
  return { id: docRef.id, ...newLoop } as Loop;
};

export const updateLoop = async (
  loopId: string,
  updateData: Partial<Omit<Loop, "id" | "userId" | "createdAt">>
): Promise<void> => {
  const docRef = doc(db, "loops", loopId);
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
  return { id: docRef.id, ...newRetrospective } as Retrospective;
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
    carryOver: true,
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

  return {
    id: userId,
    ...userDoc,
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
  await updateDoc(docRef, {
    settings: updateData,
  });
};

export const updateUserPreferences = async (
  userId: string,
  updateData: Partial<UserPreferences>
): Promise<void> => {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, {
    preferences: updateData,
  });
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
