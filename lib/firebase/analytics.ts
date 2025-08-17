import {
  collection,
  doc as docRef,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  startAfter,
  limit,
} from "firebase/firestore";
import { db } from "./config";
import { getMonthlyStatus } from "../utils";
import { Monthly } from "../types";

// Analytics & Statistics
export const fetchActiveProjects = async (userId: string): Promise<any[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc")
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

export const fetchCompletedProjects = async (
  userId: string
): Promise<any[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("status", "==", "completed"),
    orderBy("createdAt", "desc")
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

export const getTodayDeadlineProjects = async (
  userId: string
): Promise<any[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    where("endDate", ">=", today),
    where("endDate", "<", tomorrow),
    orderBy("endDate", "asc")
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

export const fetchYearlyActivityStats = async (
  userId: string,
  year: number
): Promise<any> => {
  try {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // 해당 연도의 모든 먼슬리 가져오기
    const monthliesQuery = query(
      collection(db, "monthlies"),
      where("userId", "==", userId),
      where("startDate", ">=", startOfYear),
      where("startDate", "<=", endOfYear)
    );
    const monthliesSnapshot = await getDocs(monthliesQuery);

    const monthlies = monthliesSnapshot.docs.map((doc) => {
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

    // 완료된 먼슬리 수 계산
    const completedMonthlies = monthlies.filter(
      (monthly) => getMonthlyStatus(monthly) === "ended"
    ).length;

    // 총 집중 시간 계산 (임시로 완료된 Key Results 수 사용)
    let totalFocusTime = 0;
    monthlies.forEach((monthly) => {
      if (monthly.keyResults) {
        const completedKeyResults = monthly.keyResults.filter(
          (kr: any) => kr.isCompleted
        ).length;
        totalFocusTime += completedKeyResults;
      }
    });

    // 평균 완료율 계산
    let totalCompletionRate = 0;
    let validMonthlies = 0;
    monthlies.forEach((monthly) => {
      if (monthly.keyResults && monthly.keyResults.length > 0) {
        const completedKeyResults = monthly.keyResults.filter(
          (kr: any) => kr.isCompleted
        ).length;
        const completionRate =
          (completedKeyResults / monthly.keyResults.length) * 100;
        totalCompletionRate += completionRate;
        validMonthlies++;
      }
    });

    const averageCompletionRate =
      validMonthlies > 0 ? totalCompletionRate / validMonthlies : 0;

    // 총 보상 계산
    let totalRewards = 0;
    monthlies.forEach((monthly) => {
      if (monthly.reward) {
        totalRewards += 1; // 보상이 있으면 1씩 카운트
      }
    });

    // 영역별 통계 계산
    const areaStats: Record<string, any> = {};
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("createdAt", ">=", startOfYear),
      where("createdAt", "<=", endOfYear)
    );
    const projectsSnapshot = await getDocs(projectsQuery);

    projectsSnapshot.docs.forEach((doc) => {
      const projectData = doc.data();
      const areaId = projectData.areaId || "uncategorized";

      if (!areaStats[areaId]) {
        areaStats[areaId] = {
          name: projectData.area || "미분류",
          focusTime: 0,
          completionRate: 0,
          projectCount: 0,
        };
      }

      areaStats[areaId].projectCount++;

      // 프로젝트 완료 여부에 따른 통계 업데이트
      if (projectData.isCompleted) {
        areaStats[areaId].focusTime += 1; // 임시로 완료된 프로젝트 수 사용
      }
    });

    // 각 영역의 완료율 계산
    Object.keys(areaStats).forEach((areaId) => {
      const stats = areaStats[areaId];
      stats.completionRate =
        stats.projectCount > 0
          ? (stats.focusTime / stats.projectCount) * 100
          : 0;
    });

    return {
      totalFocusTime,
      averageCompletionRate,
      completedMonthlies,
      totalRewards,
      areaStats,
    };
  } catch (error) {
    console.error("연간 활동 통계 조회 실패:", error);
    return {
      totalFocusTime: 0,
      averageCompletionRate: 0,
      completedMonthlies: 0,
      totalRewards: 0,
      areaStats: {},
    };
  }
};

export const fetchProjectsByUserIdWithPaging = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: any,
  sortBy?: string
): Promise<{ projects: any[]; lastDoc: any; hasMore: boolean }> => {
  try {
    // 정렬 기준 결정
    const orderByField = sortBy === "title" ? "title" : "createdAt";
    const orderDirection = sortBy === "title" ? "asc" : "desc";

    let q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      orderBy(orderByField, orderDirection),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        orderBy(orderByField, orderDirection),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    const projects = querySnapshot.docs.map((doc) => {
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

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === pageSize;

    return {
      projects,
      lastDoc: lastVisible,
      hasMore,
    };
  } catch (error) {
    console.error("프로젝트 페이징 조회 실패:", error);
    return {
      projects: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const fetchResourcesByUserIdWithPaging = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: any
): Promise<{ resources: any[]; lastDoc: any; hasMore: boolean }> => {
  try {
    let q = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, "resources"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    const resources = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as any;
    });

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === pageSize;

    return {
      resources,
      lastDoc: lastVisible,
      hasMore,
    };
  } catch (error) {
    console.error("리소스 페이징 조회 실패:", error);
    return {
      resources: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const fetchResourcesWithAreasByUserIdWithPaging = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: any,
  sortBy?: string
): Promise<{ resources: any[]; lastDoc: any; hasMore: boolean }> => {
  try {
    // 정렬 기준 결정
    const orderByField = sortBy === "name" ? "name" : "createdAt";
    const orderDirection = sortBy === "name" ? "asc" : "desc";

    let q = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      orderBy(orderByField, orderDirection),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, "resources"),
        where("userId", "==", userId),
        orderBy(orderByField, orderDirection),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    const resources = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const resource = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        } as any;

        // 영역 정보 가져오기
        if (resource.areaId) {
          try {
            const areaRef = docRef(db, "areas", resource.areaId as string);
            const areaSnap = await getDoc(areaRef);
            if (areaSnap.exists()) {
              const areaData = areaSnap.data() as { name?: string };
              resource.area = areaData.name || "기타";
            }
          } catch (error) {
            console.error("영역 정보 조회 실패:", error);
          }
        }

        return resource;
      })
    );

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const hasMore = querySnapshot.docs.length === pageSize;

    return {
      resources,
      lastDoc: lastVisible,
      hasMore,
    };
  } catch (error) {
    console.error("리소스 페이징 조회 실패:", error);
    return {
      resources: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const fetchAreaCountsByUserId = async (
  userId: string
): Promise<Record<string, { projectCount: number; resourceCount: number }>> => {
  try {
    const q = query(
      collection(db, "areas"),
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);

    const areaCounts: Record<
      string,
      { projectCount: number; resourceCount: number }
    > = {};

    // 각 영역별 프로젝트와 리소스 수 계산
    for (const areaDoc of querySnapshot.docs) {
      const areaId = areaDoc.id;

      // 프로젝트 수 계산
      const projectsQuery = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        where("areaId", "==", areaId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      // 리소스 수 계산
      const resourcesQuery = query(
        collection(db, "resources"),
        where("userId", "==", userId),
        where("areaId", "==", areaId)
      );
      const resourcesSnapshot = await getDocs(resourcesQuery);

      areaCounts[areaId] = {
        projectCount: projectsSnapshot.size,
        resourceCount: resourcesSnapshot.size,
      };
    }

    return areaCounts;
  } catch (error) {
    console.error("영역별 카운트 조회 실패:", error);
    return {};
  }
};

export const fetchArchivesByUserIdWithPaging = async (
  userId: string,
  pageSize: number = 10,
  lastDoc?: any,
  sortBy?: string
): Promise<{ archives: any[]; lastDoc: any; hasMore: boolean }> => {
  try {
    // 정렬 기준 결정
    const orderByField = sortBy === "title" ? "title" : "createdAt";
    const orderDirection = sortBy === "title" ? "asc" : "desc";

    // 아카이브된 프로젝트들
    let projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("status", "==", "archived"),
      orderBy(orderByField, orderDirection),
      limit(pageSize)
    );

    if (lastDoc) {
      projectsQuery = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        where("status", "==", "archived"),
        orderBy(orderByField, orderDirection),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const projectsSnapshot = await getDocs(projectsQuery);
    const archives = projectsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: "project",
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as any;
    });

    const lastVisible = projectsSnapshot.docs[projectsSnapshot.docs.length - 1];
    const hasMore = projectsSnapshot.docs.length === pageSize;

    return {
      archives,
      lastDoc: lastVisible,
      hasMore,
    };
  } catch (error) {
    console.error("아카이브 페이징 조회 실패:", error);
    return {
      archives: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

export const fetchProjectCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const q = query(collection(db, "projects"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("프로젝트 수 조회 실패:", error);
    return 0;
  }
};

export const fetchResourceCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const q = query(collection(db, "resources"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("리소스 수 조회 실패:", error);
    return 0;
  }
};

export const fetchArchiveCountByUserId = async (
  userId: string
): Promise<number> => {
  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("status", "==", "archived")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("아카이브 수 조회 실패:", error);
    return 0;
  }
};
