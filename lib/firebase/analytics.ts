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

    // 총 집중 시간 계산 (실제 시간 단위로 계산)
    let totalFocusTime = 0;
    monthlies.forEach((monthly) => {
      if (monthly.keyResults) {
        const completedKeyResults = monthly.keyResults.filter(
          (kr: any) => kr.isCompleted
        );
        // 각 완료된 Key Result의 예상 시간을 합산 (기본값: 2시간 = 120분)
        completedKeyResults.forEach((kr: any) => {
          totalFocusTime += kr.estimatedHours ? kr.estimatedHours * 60 : 120; // 기본 2시간
        });
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

    // 영역별 통계 계산 (실제 영역 데이터 사용)
    const areaStats: Record<string, any> = {};

    // 모든 영역 가져오기
    const areasQuery = query(
      collection(db, "areas"),
      where("userId", "==", userId)
    );
    const areasSnapshot = await getDocs(areasQuery);
    const areas = areasSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as any)
    );

    // 각 영역별로 프로젝트 수 계산
    for (const area of areas) {
      const areaProjectsQuery = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        where("areaId", "==", area.id)
      );
      const areaProjectsSnapshot = await getDocs(areaProjectsQuery);

      const projectCount = areaProjectsSnapshot.docs.length;
      let completedCount = 0;

      // 완료된 프로젝트 수 계산
      areaProjectsSnapshot.docs.forEach((doc) => {
        const projectData = doc.data();
        if (projectData.isCompleted) {
          completedCount++;
        }
      });

      areaStats[area.id] = {
        name: area.name || "미분류",
        focusTime: completedCount, // 완료된 프로젝트 수
        completionRate:
          projectCount > 0 ? (completedCount / projectCount) * 100 : 0,
        projectCount: projectCount,
      };
    }

    // 미분류 영역도 추가
    const uncategorizedProjectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      where("areaId", "==", null)
    );
    const uncategorizedProjectsSnapshot = await getDocs(
      uncategorizedProjectsQuery
    );

    if (uncategorizedProjectsSnapshot.docs.length > 0) {
      let uncategorizedCompletedCount = 0;
      uncategorizedProjectsSnapshot.docs.forEach((doc) => {
        const projectData = doc.data();
        if (projectData.isCompleted) {
          uncategorizedCompletedCount++;
        }
      });

      areaStats["uncategorized"] = {
        name: "미분류",
        focusTime: uncategorizedCompletedCount,
        completionRate:
          uncategorizedProjectsSnapshot.docs.length > 0
            ? (uncategorizedCompletedCount /
                uncategorizedProjectsSnapshot.docs.length) *
              100
            : 0,
        projectCount: uncategorizedProjectsSnapshot.docs.length,
      };
    }

    // 이전 연도와 비교하여 증가율 계산
    let focusTimeIncrease = 0;
    let completionRateIncrease = 0;

    try {
      const previousYear = year - 1;
      const previousYearStart = new Date(previousYear, 0, 1);
      const previousYearEnd = new Date(previousYear, 11, 31, 23, 59, 59, 999);

      // 이전 연도 데이터만 조회 (재귀 호출 방지)
      const previousMonthliesQuery = query(
        collection(db, "monthlies"),
        where("userId", "==", userId),
        where("startDate", ">=", previousYearStart),
        where("startDate", "<=", previousYearEnd)
      );
      const previousMonthliesSnapshot = await getDocs(previousMonthliesQuery);

      let previousTotalFocusTime = 0;
      let previousTotalCompletionRate = 0;
      let previousValidMonthlies = 0;

      previousMonthliesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const monthly = {
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
        } as any;

        if (monthly.keyResults) {
          const completedKeyResults = monthly.keyResults.filter(
            (kr: any) => kr.isCompleted
          );
          completedKeyResults.forEach((kr: any) => {
            previousTotalFocusTime += kr.estimatedHours
              ? kr.estimatedHours * 60
              : 120;
          });

          if (monthly.keyResults.length > 0) {
            const completionRate =
              (completedKeyResults.length / monthly.keyResults.length) * 100;
            previousTotalCompletionRate += completionRate;
            previousValidMonthlies++;
          }
        }
      });

      const previousAverageCompletionRate =
        previousValidMonthlies > 0
          ? previousTotalCompletionRate / previousValidMonthlies
          : 0;

      // 증가율 계산
      focusTimeIncrease =
        previousTotalFocusTime > 0
          ? ((totalFocusTime - previousTotalFocusTime) /
              previousTotalFocusTime) *
            100
          : 100;

      completionRateIncrease =
        previousAverageCompletionRate > 0
          ? ((averageCompletionRate - previousAverageCompletionRate) /
              previousAverageCompletionRate) *
            100
          : 100;
    } catch (error) {
      console.error("이전 연도 통계 조회 실패:", error);
      focusTimeIncrease = 0;
      completionRateIncrease = 0;
    }

    return {
      totalFocusTime,
      averageCompletionRate,
      completedMonthlies,
      totalRewards,
      areaStats,
      focusTimeIncrease: Math.round(focusTimeIncrease),
      completionRateIncrease: Math.round(completionRateIncrease),
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

    // mapProjectData를 사용하여 denormalized 필드 포함
    const { mapProjectData } = await import("./projects");
    const projects = querySnapshot.docs.map((doc) =>
      mapProjectData(doc as any)
    );

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
    // Area 문서에서 denormalized counts 가져오기 (추가 쿼리 불필요)
    const q = query(collection(db, "areas"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const areaCounts: Record<
      string,
      { projectCount: number; resourceCount: number }
    > = {};

    // denormalized 필드가 없는 Area들을 수집하여 fallback 계산
    const areasNeedingCalculation: Array<{ areaId: string; userId: string }> =
      [];

    for (const areaDoc of querySnapshot.docs) {
      const areaId = areaDoc.id;
      const areaData = areaDoc.data();
      const counts = areaData.counts;

      if (counts) {
        // denormalized 필드 사용
        areaCounts[areaId] = {
          projectCount: counts.projectCount || 0,
          resourceCount: counts.resourceCount || 0,
        };
      } else {
        // denormalized 필드가 없는 경우 fallback 계산 필요
        areasNeedingCalculation.push({
          areaId,
          userId: areaData.userId,
        });
      }
    }

    // denormalized 필드가 없는 Area들은 실제 쿼리로 계산 (하위호환성)
    if (areasNeedingCalculation.length > 0) {
      await Promise.all(
        areasNeedingCalculation.map(async ({ areaId, userId }) => {
          try {
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
          } catch (error) {
            console.error(`Area ${areaId} 카운트 계산 실패:`, error);
            areaCounts[areaId] = {
              projectCount: 0,
              resourceCount: 0,
            };
          }
        })
      );
    }

    return areaCounts;
  } catch (error) {
    console.error("영역별 카운트 조회 실패:", error);
    return {};
  }
};

// 아카이브된 프로젝트와 먼슬리 회고를 각각 10개씩 가져와서 합치는 함수
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

    // 완료된 프로젝트들 10개씩 가져오기 (endDate가 지난 프로젝트들)
    // 종료일 기준으로 정렬
    let projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      orderBy("endDate", "desc"),
      limit(pageSize * 2) // 더 많이 가져와서 클라이언트에서 필터링
    );

    if (lastDoc) {
      projectsQuery = query(
        collection(db, "projects"),
        where("userId", "==", userId),
        orderBy("endDate", "desc"),
        startAfter(lastDoc),
        limit(pageSize * 2)
      );
    }

    const projectsSnapshot = await getDocs(projectsQuery);
    const projectArchives = projectsSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        return data.endDate && data.endDate.toDate() <= new Date();
      })
      .slice(0, pageSize)
      .map((doc) => {
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

    // unified_archives 컬렉션에서 회고와 노트 데이터 가져오기
    let archivesQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      archivesQuery = query(
        collection(db, "unified_archives"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const archivesSnapshot = await getDocs(archivesQuery);

    // denormalized 필드에서 parent 정보 가져오기
    // denormalized 필드가 없는 경우 fallback으로 parent 문서 조회
    const archives = await Promise.all(
      archivesSnapshot.docs.map(async (archiveDoc) => {
        const archiveData = archiveDoc.data();

        // 먼슬리 관련 아카이브인 경우
        if (
          archiveData.type === "monthly_retrospective" ||
          archiveData.type === "monthly_note"
        ) {
          // denormalized 필드가 있으면 사용
          if (archiveData.parentTitle) {
            return {
              id: archiveDoc.id,
              type:
                archiveData.type === "monthly_retrospective"
                  ? "monthly"
                  : "note",
              title: archiveData.parentTitle,
              summary: archiveData.content || "",
              userRating: archiveData.userRating || 0,
              bookmarked: archiveData.bookmarked || false,
              monthlyId: archiveData.parentId,
              startDate: archiveData.parentStartDate?.toDate(),
              endDate: archiveData.parentEndDate?.toDate(),
              createdAt: archiveData.createdAt.toDate(),
              updatedAt: archiveData.updatedAt.toDate(),
            } as any;
          } else {
            // fallback: Monthly 문서 조회 (하위호환성)
            try {
              const monthlyRef = docRef(db, "monthlies", archiveData.parentId);
              const monthlySnap = await getDoc(monthlyRef);
              if (monthlySnap.exists()) {
                const monthlyData = monthlySnap.data();
                return {
                  id: archiveDoc.id,
                  type:
                    archiveData.type === "monthly_retrospective"
                      ? "monthly"
                      : "note",
                  title:
                    monthlyData.objective || monthlyData.objectiveDescription,
                  summary: archiveData.content || "",
                  userRating: archiveData.userRating || 0,
                  bookmarked: archiveData.bookmarked || false,
                  monthlyId: archiveData.parentId,
                  startDate: monthlyData.startDate.toDate(),
                  endDate: monthlyData.endDate.toDate(),
                  createdAt: archiveData.createdAt.toDate(),
                  updatedAt: archiveData.updatedAt.toDate(),
                } as any;
              }
            } catch (error) {
              console.error(
                `Monthly ${archiveData.parentId} 조회 실패:`,
                error
              );
            }
            return null;
          }
        }
        // 프로젝트 관련 아카이브인 경우
        else if (
          archiveData.type === "project_retrospective" ||
          archiveData.type === "project_note"
        ) {
          // denormalized 필드가 있으면 사용
          if (archiveData.parentTitle) {
            return {
              id: archiveDoc.id,
              type:
                archiveData.type === "project_retrospective"
                  ? "project"
                  : "note",
              title: archiveData.parentTitle,
              summary: archiveData.content || "",
              userRating: archiveData.userRating || 0,
              bookmarked: archiveData.bookmarked || false,
              projectId: archiveData.parentId,
              startDate: archiveData.parentStartDate?.toDate(),
              endDate: archiveData.parentEndDate?.toDate(),
              createdAt: archiveData.createdAt.toDate(),
              updatedAt: archiveData.updatedAt.toDate(),
            } as any;
          } else {
            // fallback: Project 문서 조회 (하위호환성)
            try {
              const projectRef = docRef(db, "projects", archiveData.parentId);
              const projectSnap = await getDoc(projectRef);
              if (projectSnap.exists()) {
                const projectData = projectSnap.data();
                return {
                  id: archiveDoc.id,
                  type:
                    archiveData.type === "project_retrospective"
                      ? "project"
                      : "note",
                  title: projectData.title || "",
                  summary: archiveData.content || "",
                  userRating: archiveData.userRating || 0,
                  bookmarked: archiveData.bookmarked || false,
                  projectId: archiveData.parentId,
                  startDate: projectData.startDate.toDate(),
                  endDate: projectData.endDate.toDate(),
                  createdAt: archiveData.createdAt.toDate(),
                  updatedAt: archiveData.updatedAt.toDate(),
                } as any;
              }
            } catch (error) {
              console.error(
                `Project ${archiveData.parentId} 조회 실패:`,
                error
              );
            }
            return null;
          }
        }

        return null;
      })
    );

    // null 값 제거
    const validArchives = archives.filter((archive) => archive !== null);

    // 프로젝트와 통합 아카이브 합치기
    const allArchives = [...projectArchives, ...validArchives];

    // 정렬 기준에 따라 정렬
    if (sortBy === "rating") {
      allArchives.sort((a, b) => (b.userRating || 0) - (a.userRating || 0));
    } else {
      allArchives.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const lastVisible = projectsSnapshot.docs[projectsSnapshot.docs.length - 1];
    const hasMore =
      projectArchives.length === pageSize || validArchives.length === pageSize;

    return {
      archives: allArchives,
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
    // 완료된 프로젝트 수 (endDate가 지난 프로젝트들)
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectCount = projectsSnapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.endDate && data.endDate.toDate() <= new Date();
    }).length;

    // unified_archives 컬렉션에서 아카이브 수 계산
    const archivesQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId)
    );
    const archivesSnapshot = await getDocs(archivesQuery);
    const archiveCount = archivesSnapshot.size;

    return projectCount + archiveCount;
  } catch (error) {
    console.error("아카이브 수 조회 실패:", error);
    return 0;
  }
};

// 활동 스냅샷 조회 함수 (새로 추가)
export const fetchActivitySnapshotsByUserId = async (
  userId: string
): Promise<any[]> => {
  try {
    const snapshotsQuery = query(
      collection(db, "activitySnapshots"),
      where("userId", "==", userId),
      orderBy("year", "desc"),
      orderBy("month", "desc")
    );

    const snapshot = await getDocs(snapshotsQuery);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        year: data.year,
        month: data.month,
        failureAnalysis: data.failureAnalysis,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
  } catch (error) {
    console.error("활동 스냅샷 조회 실패:", error);
    return [];
  }
};
