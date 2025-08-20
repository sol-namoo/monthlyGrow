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
  limit,
  runTransaction,
  startAfter,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Monthly } from "../types";

// Monthlies
export const fetchAllMonthliesByUserId = async (
  userId: string
): Promise<Monthly[]> => {
  const q = query(collection(db, "monthlies"), where("userId", "==", userId));
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
    } as Monthly;
  });
};

export const fetchRecentMonthliesByUserId = async (
  userId: string,
  pageSize: number = 5
): Promise<Monthly[]> => {
  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    orderBy("endDate", "desc"),
    limit(pageSize)
  );
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
    } as Monthly;
  });
};

export const fetchPastMonthliesByUserIdWithPaging = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: QueryDocumentSnapshot,
  sortBy: "latest" | "oldest" | "completionRate" = "latest"
): Promise<{
  monthlies: Monthly[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> => {
  // 간단한 쿼리로 변경 (복합 인덱스 불필요)
  let q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    orderBy("endDate", "desc") // 기본적으로 최신순으로 정렬
  );

  // 페이지네이션 적용
  if (lastDoc) {
    q = query(q, startAfter(lastDoc), limit(pageSize * 2)); // 여유있게 가져와서 필터링
  } else {
    q = query(q, limit(pageSize * 2)); // 여유있게 가져와서 필터링
  }

  const querySnapshot = await getDocs(q);
  const allMonthlies = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Monthly;
  });

  // getMonthlyStatus를 사용하여 과거 먼슬리만 필터링
  const { getMonthlyStatus } = await import("../utils");
  const pastMonthlies = allMonthlies.filter((monthly) => getMonthlyStatus(monthly) === "ended");

  // 정렬 적용
  let sortedMonthlies = [...pastMonthlies];
  switch (sortBy) {
    case "latest":
      sortedMonthlies.sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
      break;
    case "oldest":
      sortedMonthlies.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
      break;
    case "completionRate":
      sortedMonthlies.sort((a, b) => {
        const aProgress = calculateMonthlyProgress(a);
        const bProgress = calculateMonthlyProgress(b);
        return bProgress - aProgress; // 내림차순 (높은 완료율이 위로)
      });
      break;
  }

  // 페이지 크기만큼 자르기
  const paginatedMonthlies = sortedMonthlies.slice(0, pageSize);

  return {
    monthlies: paginatedMonthlies,
    lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
    hasMore: paginatedMonthlies.length === pageSize && sortedMonthlies.length > pageSize,
  };
};

// 먼슬리 완료율 계산 헬퍼 함수
const calculateMonthlyProgress = (monthly: Monthly): number => {
  if (!monthly.keyResults || monthly.keyResults.length === 0) {
    return 0;
  }
  const completedCount = monthly.keyResults.filter((kr) => kr.isCompleted).length;
  return (completedCount / monthly.keyResults.length) * 100;
};

export const fetchMonthlyById = async (monthlyId: string): Promise<Monthly> => {
  const docRef = doc(db, "monthlies", monthlyId);
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
    } as Monthly;
  } else {
    throw new Error("Monthly not found");
  }
};

export const findMonthlyByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<Monthly | null> => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    where("startDate", "<=", endOfMonth),
    where("endDate", ">=", startOfMonth)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: data.startDate.toDate(),
    endDate: data.endDate.toDate(),
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
  } as Monthly;
};

export const findIncompleteProjectsInMonthly = async (
  monthlyId: string
): Promise<any[]> => {
  const monthlyRef = doc(db, "monthlies", monthlyId);
  const monthlySnap = await getDoc(monthlyRef);

  if (!monthlySnap.exists()) {
    throw new Error("Monthly not found");
  }

  const monthlyData = monthlySnap.data();
  const connectedProjects = monthlyData.connectedProjects || [];

  if (connectedProjects.length === 0) {
    return [];
  }

  const incompleteProjects: any[] = [];

  for (const projectId of connectedProjects) {
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        const isCompleted = projectData.isCompleted || false;

        if (!isCompleted) {
          incompleteProjects.push({
            id: projectSnap.id,
            ...projectData,
            startDate: projectData.startDate.toDate(),
            endDate: projectData.endDate.toDate(),
            createdAt: projectData.createdAt.toDate(),
            updatedAt:
              projectData.updatedAt?.toDate() || projectData.createdAt.toDate(),
            chapterId: projectData.chapterId,
            connectedMonthlies: projectData.connectedMonthlies || [],
            addedMidway: projectData.addedMidway,
            retrospective: projectData.retrospective,
            notes: projectData.notes || [],
            isCarriedOver: projectData.isCarriedOver,
            originalMonthlyId: projectData.originalMonthlyId,
            carriedOverAt: projectData.carriedOverAt?.toDate(),
            migrationStatus: projectData.migrationStatus,
            status: projectData.status || "in_progress",
          } as any);
        }
      }
    } catch (error) {
      console.error(`프로젝트 ${projectId} 조회 실패:`, error);
    }
  }

  return incompleteProjects;
};

export const moveProjectToMonthly = async (
  projectId: string,
  fromMonthlyId: string,
  toMonthlyId: string
): Promise<void> => {
  const projectRef = doc(db, "projects", projectId);
  const projectSnap = await getDoc(projectRef);

  if (!projectSnap.exists()) {
    throw new Error("Project not found");
  }

  const projectData = projectSnap.data();
  const connectedMonthlies = projectData.connectedMonthlies || [];

  // 기존 먼슬리에서 제거하고 새 먼슬리에 추가
  const updatedConnectedMonthlies = connectedMonthlies
    .filter((monthlyId: string) => monthlyId !== fromMonthlyId)
    .concat([toMonthlyId]);

  // 프로젝트 업데이트
  await updateDoc(projectRef, {
    connectedMonthlies: updatedConnectedMonthlies,
    isCarriedOver: true,
    originalMonthlyId: fromMonthlyId,
    carriedOverAt: new Date(),
    migrationStatus: "migrated",
    updatedAt: new Date(),
  });
};

export const createMonthly = async (
  monthlyData: Omit<Monthly, "id" | "createdAt" | "updatedAt">
): Promise<Monthly> => {
  try {
    if (!monthlyData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!monthlyData.objective?.trim()) {
      throw new Error("먼슬리 목표를 입력해주세요.");
    }

    // 중복 먼슬리 체크
    const existingMonthly = await checkMonthlyExists(
      monthlyData.userId,
      monthlyData.startDate,
      monthlyData.endDate
    );

    if (existingMonthly) {
      throw new Error("해당 기간에 이미 먼슬리가 존재합니다.");
    }

    const baseData = createBaseData(monthlyData.userId);
    const newMonthly = {
      ...monthlyData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "monthlies"), newMonthly);


    return {
      id: docRef.id,
      userId: monthlyData.userId,
      objective: monthlyData.objective,
      keyResults: monthlyData.keyResults || [],
      startDate: monthlyData.startDate,
      endDate: monthlyData.endDate,
      reward: monthlyData.reward,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Monthly;
  } catch (error) {

    if (error instanceof Error) {
      throw new Error(`먼슬리 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("먼슬리 생성에 실패했습니다.");
  }
};

export const updateMonthly = async (
  monthlyId: string,
  updateData: Partial<Omit<Monthly, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "monthlies", monthlyId), filteredData);

  } catch (error) {

    throw new Error("먼슬리 업데이트에 실패했습니다.");
  }
};

export const checkMonthlyExists = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    where("startDate", "<=", endDate),
    where("endDate", ">=", startDate)
  );
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
};

export const deleteMonthlyById = async (monthlyId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const monthlyRef = doc(db, "monthlies", monthlyId);
      const monthlyDoc = await transaction.get(monthlyRef);

      if (!monthlyDoc.exists()) {
        throw new Error("먼슬리를 찾을 수 없습니다.");
      }

      // 해당 먼슬리에 연결된 프로젝트들의 참조 제거
      const projectsQuery = query(
        collection(db, "projects"),
        where("connectedMonthlies", "array-contains", monthlyId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      // 프로젝트들의 connectedMonthlies 배열에서 해당 먼슬리 ID 제거
      projectsSnapshot.docs.forEach((projectDoc) => {
        const projectData = projectDoc.data();
        const updatedConnectedMonthlies = (
          projectData.connectedMonthlies || []
        ).filter((id: string) => id !== monthlyId);

        transaction.update(projectDoc.ref, {
          connectedMonthlies: updatedConnectedMonthlies,
          updatedAt: updateTimestamp(),
        });
      });

      // 먼슬리 삭제
      transaction.delete(monthlyRef);
    });


  } catch (error) {

    if (error instanceof Error) {
      throw new Error(`먼슬리 삭제에 실패했습니다: ${error.message}`);
    }
    throw new Error("먼슬리 삭제에 실패했습니다.");
  }
};

export const fetchProjectsByMonthlyId = async (
  monthlyId: string
): Promise<any[]> => {
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
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as any;
  });
};

export const fetchCurrentMonthlyProjects = async (
  userId: string
): Promise<any[]> => {
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
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as any;
  });
};

export const fetchMonthliesByIds = async (
  monthlyIds: string[]
): Promise<any[]> => {
  try {
    if (monthlyIds.length === 0) {
      return [];
    }

    const monthlies: any[] = [];

    // Firestore의 'in' 쿼리는 최대 10개만 지원하므로 배치로 처리
    const batchSize = 10;
    for (let i = 0; i < monthlyIds.length; i += batchSize) {
      const batch = monthlyIds.slice(i, i + batchSize);

      const q = query(
        collection(db, "monthlies"),
        where("__name__", "in", batch)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        monthlies.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        });
      });
    }

    return monthlies;
  } catch (error) {
    console.error("먼슬리 ID로 조회 실패:", error);
    return [];
  }
};
