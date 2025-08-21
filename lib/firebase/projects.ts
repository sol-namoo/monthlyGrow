import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Project } from "../types";

// Projects
export const fetchAllProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  console.log("🔍 fetchAllProjectsByUserId 호출:", { userId });

  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);

  console.log("🔍 fetchAllProjectsByUserId 결과:", {
    userId,
    docsCount: querySnapshot.docs.length,
    docs: querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    })),
  });

  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });
};

export const fetchProjectsOverlappingWithMonthly = async (
  userId: string,
  monthlyStartDate: Date,
  monthlyEndDate: Date
): Promise<Project[]> => {
  // Firestore 복합 쿼리 제약으로 인해 모든 프로젝트를 가져온 후 클라이언트에서 필터링
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const allProjects = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });

  // 먼슬리 기간과 겹치는 프로젝트만 필터링
  console.log("🔍 필터링 시작:", {
    monthlyStartDate: monthlyStartDate.toLocaleDateString("en-CA"),
    monthlyEndDate: monthlyEndDate.toLocaleDateString("en-CA"),
    totalProjects: allProjects.length,
    allProjects: allProjects.map((p) => ({
      title: p.title,
      start: p.startDate.toLocaleDateString("en-CA"),
      end: p.endDate.toLocaleDateString("en-CA"),
    })),
  });

  const filteredProjects = allProjects.filter((project) => {
    // 로컬 시간대로 날짜를 YYYY-MM-DD 형식으로 변환
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const monthlyStart = new Date(monthlyStartDate);
    const monthlyEnd = new Date(monthlyEndDate);

    // 로컬 시간대 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
    const projectStartStr = projectStart.toLocaleDateString("en-CA"); // YYYY-MM-DD 형식
    const projectEndStr = projectEnd.toLocaleDateString("en-CA");
    const monthlyStartStr = monthlyStart.toLocaleDateString("en-CA");
    const monthlyEndStr = monthlyEnd.toLocaleDateString("en-CA");

    // 문자열 비교로 날짜 비교 (더 안전함)
    const overlaps =
      projectStartStr <= monthlyEndStr && projectEndStr >= monthlyStartStr;

    console.log("📅 프로젝트 필터링:", {
      projectTitle: project.title,
      projectStart: projectStartStr,
      projectEnd: projectEndStr,
      monthlyStart: monthlyStartStr,
      monthlyEnd: monthlyEndStr,
      overlaps,
      condition1: projectStartStr <= monthlyEndStr,
      condition2: projectEndStr >= monthlyStartStr,
    });

    return overlaps;
  });

  console.log("✅ 필터링 결과:", {
    filteredCount: filteredProjects.length,
    projects: filteredProjects.map((p) => ({
      title: p.title,
      start: p.startDate.toISOString(),
      end: p.endDate.toISOString(),
    })),
  });

  return filteredProjects;
};

export const fetchActiveProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });
};

export const fetchArchivedProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "archived"),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
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
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  } else {
    throw new Error("Project not found");
  }
};

export const fetchProjectsByAreaId = async (
  areaId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("areaId", "==", areaId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });
};

export const fetchProjectsByMonthlyId = async (
  monthlyId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("connectedMonthlies", "array-contains", monthlyId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });
};

export const fetchCurrentMonthlyProjects = async (
  userId: string
): Promise<Project[]> => {
  // 현재 진행 중인 먼슬리를 찾기 위해 먼저 먼슬리 데이터를 가져와야 합니다
  // 이 함수는 임시로 모든 프로젝트를 반환하고, 클라이언트에서 필터링하도록 합니다
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      category: data.category,
      areaId: data.areaId,
      area: data.area,
      completedTasks: data.completedTasks || 0,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      connectedMonthlies: data.connectedMonthlies || [],
      target: data.target,
      targetCount: data.targetCount,
      isCarriedOver: data.isCarriedOver,
      originalMonthlyId: data.originalMonthlyId,
      carriedOverAt: data.carriedOverAt
        ? data.carriedOverAt.toDate()
        : undefined,
      migrationStatus: data.migrationStatus,
      notes: data.notes || [],
    } as Project;
  });
};

export const createProject = async (
  projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
): Promise<Project> => {
  try {
    if (!projectData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!projectData.title?.trim()) {
      throw new Error("프로젝트 제목을 입력해주세요.");
    }

    const baseData = createBaseData(projectData.userId);
    const newProject = {
      ...projectData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "projects"), newProject);

    return {
      id: docRef.id,
      userId: projectData.userId,
      title: projectData.title,
      description: projectData.description || "",
      category: projectData.category || "personal",
      areaId: projectData.areaId,
      area: projectData.area,
      completedTasks: projectData.completedTasks || 0,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      createdAt: new Date(),
      updatedAt: new Date(),
      connectedMonthlies: projectData.connectedMonthlies || [],
      target: projectData.target,
      targetCount: projectData.targetCount,
      isCarriedOver: projectData.isCarriedOver || false,
      originalMonthlyId: projectData.originalMonthlyId,
      carriedOverAt: projectData.carriedOverAt,
      migrationStatus: projectData.migrationStatus,
      notes: projectData.notes || [],
    } as Project;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`프로젝트 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("프로젝트 생성에 실패했습니다.");
  }
};

export const updateProject = async (
  projectId: string,
  updateData: Partial<Omit<Project, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "projects", projectId), filteredData);
  } catch (error) {
    throw new Error("프로젝트 업데이트에 실패했습니다.");
  }
};

export const deleteProjectById = async (projectId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "projects", projectId));
  } catch (error) {
    throw new Error("프로젝트 삭제에 실패했습니다.");
  }
};

export const updateProjectConnectedMonthlies = async (
  projectId: string,
  monthlyId: string,
  add: boolean
): Promise<void> => {
  try {
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      throw new Error("프로젝트를 찾을 수 없습니다.");
    }

    const projectData = projectSnap.data();
    const currentConnectedMonthlies = projectData.connectedMonthlies || [];

    let updatedConnectedMonthlies: string[];

    if (add) {
      // monthly ID 추가 (중복 방지)
      if (!currentConnectedMonthlies.includes(monthlyId)) {
        updatedConnectedMonthlies = [...currentConnectedMonthlies, monthlyId];
      } else {
        updatedConnectedMonthlies = currentConnectedMonthlies;
      }
    } else {
      // monthly ID 제거
      updatedConnectedMonthlies = currentConnectedMonthlies.filter(
        (id) => id !== monthlyId
      );
    }

    await updateDoc(projectRef, {
      connectedMonthlies: updatedConnectedMonthlies,
      updatedAt: updateTimestamp(),
    });
  } catch (error) {
    throw new Error("프로젝트 연결 업데이트에 실패했습니다.");
  }
};
