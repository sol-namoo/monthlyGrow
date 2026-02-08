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
import { Monthly, ConnectedProjectGoal } from "../types";
import { updateProjectConnectedMonthlies } from "./projects";

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
  const pastMonthlies = allMonthlies.filter(
    (monthly) => getMonthlyStatus(monthly) === "ended"
  );

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
    hasMore:
      paginatedMonthlies.length === pageSize &&
      sortedMonthlies.length > pageSize,
  };
};

// 먼슬리 완료율 계산 헬퍼 함수
const calculateMonthlyProgress = (monthly: Monthly): number => {
  if (!monthly.keyResults || monthly.keyResults.length === 0) {
    return 0;
  }
  const completedCount = monthly.keyResults.filter(
    (kr) => kr.isCompleted
  ).length;
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

  // 기존 인덱스를 사용하는 단순한 쿼리
  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    orderBy("startDate", "asc")
  );
  const querySnapshot = await getDocs(q);

  // 클라이언트에서 필터링
  const monthlies = querySnapshot.docs.map((doc) => {
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

  // 해당 월과 겹치는 먼슬리 찾기
  const matchingMonthly = monthlies.find((monthly) => {
    return monthly.startDate <= endOfMonth && monthly.endDate >= startOfMonth;
  });

  return matchingMonthly || null;
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

    const connectedProjects: ConnectedProjectGoal[] = (
      monthlyData.connectedProjects || []
    ).map((cp: any) =>
      typeof cp === "string"
        ? { projectId: cp, monthlyTargetCount: 1, monthlyDoneCount: 0 }
        : {
            projectId: cp.projectId,
            monthlyTargetCount: cp.monthlyTargetCount ?? 1,
            monthlyDoneCount: cp.monthlyDoneCount ?? 0,
          }
    );

    const payload = filterUndefinedValues({
      ...monthlyData,
      ...createBaseData(monthlyData.userId),
      connectedProjects: connectedProjects.length ? connectedProjects : undefined,
    });

    const docRef = await addDoc(collection(db, "monthlies"), payload);

    // Project.connectedMonthlies 동기화 (상세 페이지 쿼리와 일치)
    for (const cp of connectedProjects) {
      try {
        await updateProjectConnectedMonthlies(cp.projectId, docRef.id, true);
      } catch (e) {
        console.warn(`프로젝트 ${cp.projectId} connectedMonthlies 동기화 실패:`, e);
      }
    }

    // connectedProjects가 있고 Monthly가 활성 상태이면 관련 프로젝트들의 currentMonthlyProgress 업데이트
    if (connectedProjects.length > 0) {
      const { getMonthlyStatus } = await import("../utils");
      const monthly: Monthly = {
        id: docRef.id,
        ...monthlyData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Monthly;
      const status = getMonthlyStatus(monthly);
      const isActive = status === "in_progress";

      if (isActive) {
        for (const cp of connectedProjects) {
          const projectRef = doc(db, "projects", cp.projectId);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            const monthlyTargetCount = cp.monthlyTargetCount ?? 0;
            const monthlyDoneCount = cp.monthlyDoneCount ?? 0;
            const progressRate =
              monthlyTargetCount > 0
                ? (monthlyDoneCount / monthlyTargetCount) * 100
                : 0;

            await updateDoc(projectRef, {
              currentMonthlyProgress: {
                monthlyId: docRef.id,
                monthlyTitle: monthlyData.objective || "",
                monthlyTargetCount,
                monthlyDoneCount,
                progressRate,
              },
              updatedAt: updateTimestamp(),
            });
          }
        }
      }
    }

    return {
      id: docRef.id,
      userId: monthlyData.userId,
      objective: monthlyData.objective,
      keyResults: monthlyData.keyResults || [],
      connectedProjects,
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

function toProjectIds(connectedProjects: ConnectedProjectGoal[] | undefined): string[] {
  if (!connectedProjects?.length) return [];
  return connectedProjects.map((cp) => cp.projectId);
}

export const updateMonthly = async (
  monthlyId: string,
  updateData: Partial<Omit<Monthly, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const monthlyRef = doc(db, "monthlies", monthlyId);

    // connectedProjects 변경 시 Project.connectedMonthlies 동기화를 위해 이전 연결 목록 조회
    let prevProjectIds: string[] = [];
    if (updateData.connectedProjects !== undefined) {
      const beforeSnap = await getDoc(monthlyRef);
      if (beforeSnap.exists()) {
        const data = beforeSnap.data();
        const prevConnected = data.connectedProjects as ConnectedProjectGoal[] | undefined;
        prevProjectIds = toProjectIds(prevConnected);
      }
    }

    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(monthlyRef, filteredData);

    // Project.connectedMonthlies 동기화 (추가/제거)
    if (updateData.connectedProjects !== undefined) {
      const nextList = updateData.connectedProjects as (ConnectedProjectGoal | string)[];
      const nextProjectIds =
        nextList?.length
          ? nextList.map((cp) => (typeof cp === "string" ? cp : cp.projectId))
          : [];
      const toAdd = nextProjectIds.filter((id) => !prevProjectIds.includes(id));
      const toRemove = prevProjectIds.filter((id) => !nextProjectIds.includes(id));
      for (const projectId of toAdd) {
        try {
          await updateProjectConnectedMonthlies(projectId, monthlyId, true);
        } catch (e) {
          console.warn(`프로젝트 ${projectId} connectedMonthlies 추가 실패:`, e);
        }
      }
      for (const projectId of toRemove) {
        try {
          await updateProjectConnectedMonthlies(projectId, monthlyId, false);
        } catch (e) {
          console.warn(`프로젝트 ${projectId} connectedMonthlies 제거 실패:`, e);
        }
      }
    }

    // connectedProjects가 변경된 경우 관련 프로젝트들의 currentMonthlyProgress 업데이트
    if (updateData.connectedProjects !== undefined) {
      const monthlySnap = await getDoc(monthlyRef);
      if (monthlySnap.exists()) {
        const monthlyData = monthlySnap.data();
        const monthly: Monthly = {
          id: monthlySnap.id,
          ...monthlyData,
          startDate: monthlyData.startDate.toDate(),
          endDate: monthlyData.endDate.toDate(),
          createdAt: monthlyData.createdAt.toDate(),
          updatedAt:
            monthlyData.updatedAt?.toDate() || monthlyData.createdAt.toDate(),
        } as Monthly;

        const { getMonthlyStatus } = await import("../utils");
        const status = getMonthlyStatus(monthly);
        const isActive = status === "in_progress";

        const connectedProjects = monthlyData.connectedProjects || [];
        const projectIds = connectedProjects.map((cp: any) =>
          typeof cp === "string" ? cp : cp.projectId
        );

        // 관련 프로젝트들의 currentMonthlyProgress 업데이트
        for (const projectId of projectIds) {
          const projectRef = doc(db, "projects", projectId);
          const projectSnap = await getDoc(projectRef);
          if (projectSnap.exists()) {
            const projectData = projectSnap.data();
            const connectedMonthlies = projectData.connectedMonthlies || [];

            if (connectedMonthlies.includes(monthlyId)) {
              // 프로젝트가 이 Monthly에 연결되어 있으면 업데이트
              if (isActive) {
                const projectConnection = connectedProjects.find(
                  (cp: any) =>
                    (typeof cp === "string" ? cp : cp.projectId) === projectId
                );
                const monthlyTargetCount =
                  projectConnection?.monthlyTargetCount || 0;
                const monthlyDoneCount =
                  projectConnection?.monthlyDoneCount || 0;
                const progressRate =
                  monthlyTargetCount > 0
                    ? (monthlyDoneCount / monthlyTargetCount) * 100
                    : 0;

                await updateDoc(projectRef, {
                  currentMonthlyProgress: {
                    monthlyId: monthlyId,
                    monthlyTitle: monthlyData.objective || "",
                    monthlyTargetCount,
                    monthlyDoneCount,
                    progressRate,
                  },
                  updatedAt: updateTimestamp(),
                });
              } else {
                // 활성 상태가 아니면 currentMonthlyProgress 제거 (다른 활성 Monthly가 있는지 확인)
                const now = new Date();
                let activeMonthlyId: string | null = null;

                for (const mid of connectedMonthlies) {
                  if (mid === monthlyId) continue;
                  const otherMonthlyRef = doc(db, "monthlies", mid);
                  const otherMonthlySnap = await getDoc(otherMonthlyRef);
                  if (otherMonthlySnap.exists()) {
                    const otherMonthlyData = otherMonthlySnap.data();
                    const startDate = otherMonthlyData.startDate.toDate();
                    const endDate = otherMonthlyData.endDate.toDate();

                    if (startDate <= now && now <= endDate) {
                      activeMonthlyId = mid;
                      break;
                    }
                  }
                }

                if (activeMonthlyId) {
                  // 다른 활성 Monthly가 있으면 그것으로 업데이트
                  const activeMonthlyRef = doc(
                    db,
                    "monthlies",
                    activeMonthlyId
                  );
                  const activeMonthlySnap = await getDoc(activeMonthlyRef);
                  if (activeMonthlySnap.exists()) {
                    const activeMonthlyData = activeMonthlySnap.data();
                    const activeConnectedProjects =
                      activeMonthlyData.connectedProjects || [];
                    const activeProjectConnection =
                      activeConnectedProjects.find(
                        (cp: any) =>
                          (typeof cp === "string" ? cp : cp.projectId) ===
                          projectId
                      );
                    const monthlyTargetCount =
                      activeProjectConnection?.monthlyTargetCount || 0;
                    const monthlyDoneCount =
                      activeProjectConnection?.monthlyDoneCount || 0;
                    const progressRate =
                      monthlyTargetCount > 0
                        ? (monthlyDoneCount / monthlyTargetCount) * 100
                        : 0;

                    await updateDoc(projectRef, {
                      currentMonthlyProgress: {
                        monthlyId: activeMonthlyId,
                        monthlyTitle: activeMonthlyData.objective || "",
                        monthlyTargetCount,
                        monthlyDoneCount,
                        progressRate,
                      },
                      updatedAt: updateTimestamp(),
                    });
                  }
                } else {
                  // 활성 Monthly가 없으면 제거
                  await updateDoc(projectRef, {
                    currentMonthlyProgress: null,
                    updatedAt: updateTimestamp(),
                  });
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    throw new Error("먼슬리 업데이트에 실패했습니다.");
  }
};

export const checkMonthlyExists = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> => {
  // 기존 인덱스를 사용하는 단순한 쿼리
  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    orderBy("startDate", "asc")
  );
  const querySnapshot = await getDocs(q);

  // 클라이언트에서 필터링
  const monthlies = querySnapshot.docs.map((doc) => {
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

  // 기간이 겹치는 먼슬리가 있는지 확인
  const hasOverlap = monthlies.some((monthly) => {
    return monthly.startDate <= endDate && monthly.endDate >= startDate;
  });

  return hasOverlap;
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
