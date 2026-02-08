import {
  collection,
  doc,
  documentId,
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
  runTransaction,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { formatDateForInput } from "../utils";
import { Project, Monthly } from "../types";
import { getMonthlyStatus } from "../utils";

// 프로젝트 데이터 변환 헬퍼 함수 (denormalized 필드 포함)
export const mapProjectData = (doc: any): Project => {
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
    carriedOverAt: data.carriedOverAt ? data.carriedOverAt.toDate() : undefined,
    migrationStatus: data.migrationStatus,
    notes: data.notes || [],
    taskCounts: data.taskCounts,
    timeStats: data.timeStats,
  } as Project;
};

// Projects
export const fetchAllProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(mapProjectData);
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
  const allProjects = querySnapshot.docs.map(mapProjectData);

  // 먼슬리 기간과 겹치는 프로젝트만 필터링

  const filteredProjects = allProjects.filter((project) => {
    // 로컬 시간대로 날짜를 YYYY-MM-DD 형식으로 변환
    const projectStart = new Date(project.startDate);
    const projectEnd = new Date(project.endDate);
    const monthlyStart = new Date(monthlyStartDate);
    const monthlyEnd = new Date(monthlyEndDate);

    // 로컬 시간대 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
    const projectStartStr = formatDateForInput(projectStart);
    const projectEndStr = formatDateForInput(projectEnd);
    const monthlyStartStr = formatDateForInput(monthlyStart);
    const monthlyEndStr = formatDateForInput(monthlyEnd);

    // 문자열 비교로 날짜 비교 (더 안전함)
    const overlaps =
      projectStartStr <= monthlyEndStr && projectEndStr >= monthlyStartStr;

    return overlaps;
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
  return querySnapshot.docs.map(mapProjectData);
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
  return querySnapshot.docs.map(mapProjectData);
};

export const fetchProjectById = async (projectId: string): Promise<Project> => {
  const docRef = doc(db, "projects", projectId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return mapProjectData(docSnap);
  } else {
    throw new Error("Project not found");
  }
};

/** projectIds 순서대로 Project[] 반환 (없는 ID는 제외). Firestore 'in' 쿼리 30개 제한으로 청크 처리. */
export const fetchProjectsByIds = async (
  projectIds: string[]
): Promise<Project[]> => {
  if (projectIds.length === 0) return [];
  const uniq = [...new Set(projectIds)];
  const CHUNK = 30;
  const results: Project[] = [];
  for (let i = 0; i < uniq.length; i += CHUNK) {
    const chunk = uniq.slice(i, i + CHUNK);
    const q = query(
      collection(db, "projects"),
      where(documentId(), "in", chunk)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((d) => results.push(mapProjectData(d)));
  }
  // monthly.connectedProjects 순서 유지
  const byId = new Map(results.map((p) => [p.id, p]));
  return projectIds.map((id) => byId.get(id)).filter((p): p is Project => p != null);
};

export const fetchProjectsByAreaId = async (
  areaId: string,
  userId: string
): Promise<Project[]> => {
  try {
    // 인덱스가 아직 생성 중일 수 있으므로, orderBy 없이 먼저 시도
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("areaId", "==", areaId),
      orderBy("endDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(mapProjectData);
  } catch (error: any) {
    // 인덱스 에러인 경우 orderBy 없이 재시도
    if (
      error?.code === "failed-precondition" ||
      error?.message?.includes("index")
    ) {
      console.warn(
        "인덱스가 아직 생성 중입니다. orderBy 없이 쿼리합니다:",
        error
      );
      const qWithoutOrderBy = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        where("areaId", "==", areaId)
      );
      const querySnapshot = await getDocs(qWithoutOrderBy);
      const projects = querySnapshot.docs.map(mapProjectData);
      // 클라이언트 측에서 endDate 기준으로 정렬
      return projects.sort((a, b) => {
        if (!a.endDate || !b.endDate) return 0;
        return b.endDate.getTime() - a.endDate.getTime();
      });
    }
    // 다른 에러인 경우 로그를 남기고 재throw
    console.error("fetchProjectsByAreaId 에러:", error);
    throw error;
  }
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
  return querySnapshot.docs.map(mapProjectData);
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
  return querySnapshot.docs.map(mapProjectData);
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

    // 트랜잭션으로 프로젝트 생성과 Area counts 업데이트를 함께 처리
    const result = await runTransaction(db, async (transaction) => {
      const projectRef = doc(collection(db, "projects"));
      transaction.set(projectRef, newProject);

      // Area가 지정된 경우 Area의 projectCount 증가
      if (projectData.areaId) {
        const areaRef = doc(db, "areas", projectData.areaId);
        const areaSnap = await transaction.get(areaRef);

        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          const currentCounts = areaData.counts || {
            projectCount: 0,
            resourceCount: 0,
          };
          transaction.update(areaRef, {
            counts: {
              projectCount: currentCounts.projectCount + 1,
              resourceCount: currentCounts.resourceCount,
            },
            updatedAt: updateTimestamp(),
          });
        }
      }

      return projectRef.id;
    });

    return {
      id: result,
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
    // areaId가 변경되는 경우 Area counts 업데이트 필요
    if (updateData.areaId !== undefined) {
      await runTransaction(db, async (transaction) => {
        const projectRef = doc(db, "projects", projectId);
        const projectSnap = await transaction.get(projectRef);

        if (!projectSnap.exists()) {
          throw new Error("프로젝트를 찾을 수 없습니다.");
        }

        const projectData = projectSnap.data();
        const oldAreaId = projectData.areaId;
        const newAreaId = updateData.areaId;

        // 이전 Area의 projectCount 감소
        if (oldAreaId) {
          const oldAreaRef = doc(db, "areas", oldAreaId);
          const oldAreaSnap = await transaction.get(oldAreaRef);

          if (oldAreaSnap.exists()) {
            const oldAreaData = oldAreaSnap.data();
            const oldCounts = oldAreaData.counts || {
              projectCount: 0,
              resourceCount: 0,
            };
            transaction.update(oldAreaRef, {
              counts: {
                projectCount: Math.max(0, oldCounts.projectCount - 1),
                resourceCount: oldCounts.resourceCount,
              },
              updatedAt: updateTimestamp(),
            });
          }
        }

        // 새 Area의 projectCount 증가
        if (newAreaId && newAreaId !== oldAreaId) {
          const newAreaRef = doc(db, "areas", newAreaId);
          const newAreaSnap = await transaction.get(newAreaRef);

          if (newAreaSnap.exists()) {
            const newAreaData = newAreaSnap.data();
            const newCounts = newAreaData.counts || {
              projectCount: 0,
              resourceCount: 0,
            };
            transaction.update(newAreaRef, {
              counts: {
                projectCount: newCounts.projectCount + 1,
                resourceCount: newCounts.resourceCount,
              },
              updatedAt: updateTimestamp(),
            });
          }
        }

        // 프로젝트 업데이트
        const filteredData = filterUndefinedValues({
          ...updateData,
          updatedAt: updateTimestamp(),
        });
        transaction.update(projectRef, filteredData);
      });
    } else {
      // areaId가 변경되지 않는 경우 일반 업데이트
      const filteredData = filterUndefinedValues({
        ...updateData,
        updatedAt: updateTimestamp(),
      });

      await updateDoc(doc(db, "projects", projectId), filteredData);
    }
  } catch (error) {
    throw new Error("프로젝트 업데이트에 실패했습니다.");
  }
};

export const deleteProjectById = async (projectId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const projectRef = doc(db, "projects", projectId);
      const projectDoc = await transaction.get(projectRef);

      if (!projectDoc.exists()) {
        throw new Error("프로젝트를 찾을 수 없습니다.");
      }

      const projectData = projectDoc.data();
      const areaId = projectData.areaId;
      const connectedMonthlies: string[] = projectData.connectedMonthlies || [];

      // 1. 연결된 모든 먼슬리의 connectedProjects에서 이 프로젝트 제거 (SSOT 동기화)
      for (const monthlyId of connectedMonthlies) {
        const monthlyRef = doc(db, "monthlies", monthlyId);
        const monthlySnap = await transaction.get(monthlyRef);
        if (monthlySnap.exists()) {
          const monthlyData = monthlySnap.data();
          const list = monthlyData.connectedProjects || [];
          const normalized = list.map((c: any) =>
            typeof c === "string"
              ? { projectId: c, monthlyTargetCount: 1, monthlyDoneCount: 0 }
              : {
                  projectId: c.projectId,
                  monthlyTargetCount: c.monthlyTargetCount ?? 1,
                  monthlyDoneCount: c.monthlyDoneCount ?? 0,
                }
          );
          const next = normalized.filter(
            (item: { projectId: string }) => item.projectId !== projectId
          );
          transaction.update(monthlyRef, {
            connectedProjects: next,
            updatedAt: updateTimestamp(),
          });
        }
      }

      // 2. 프로젝트의 모든 태스크 서브컬렉션 삭제
      const tasksQuery = query(collection(db, "projects", projectId, "tasks"));
      const tasksSnapshot = await getDocs(tasksQuery);

      // 트랜잭션 내에서 태스크들 삭제
      tasksSnapshot.docs.forEach((taskDoc) => {
        transaction.delete(taskDoc.ref);
      });

      // 3. Area의 projectCount 감소
      if (areaId) {
        const areaRef = doc(db, "areas", areaId);
        const areaSnap = await transaction.get(areaRef);

        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          const currentCounts = areaData.counts || {
            projectCount: 0,
            resourceCount: 0,
          };
          transaction.update(areaRef, {
            counts: {
              projectCount: Math.max(0, currentCounts.projectCount - 1),
              resourceCount: currentCounts.resourceCount,
            },
            updatedAt: updateTimestamp(),
          });
        }
      }

      // 4. 프로젝트 문서 삭제
      transaction.delete(projectRef);
    });
  } catch (error) {
    console.error(`❌ 프로젝트 삭제 실패: ${projectId}`, error);
    throw new Error("프로젝트 삭제에 실패했습니다.");
  }
};

export const updateProjectConnectedMonthlies = async (
  projectId: string,
  monthlyId: string,
  add: boolean
): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await transaction.get(projectRef);

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
          (id: string) => id !== monthlyId
        );
      }

      transaction.update(projectRef, {
        connectedMonthlies: updatedConnectedMonthlies,
        updatedAt: updateTimestamp(),
      });
    });
  } catch (error) {
    throw new Error("프로젝트 연결 업데이트에 실패했습니다.");
  }
};
