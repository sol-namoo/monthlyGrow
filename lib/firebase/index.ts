// Firebase 설정 및 초기화
export { db, auth, googleAuthProvider, storage } from "./config";

// 유틸리티 함수들
export {
  createTimestamp,
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";

// 타입 import
import type { Monthly, UnifiedArchive } from "../types";

// 필요한 함수들 직접 import
import { fetchActivitySnapshotsByUserId } from "./analytics";
import { fetchAllMonthliesByUserId } from "./monthlies";
import { getMonthlyStatus } from "../utils";
import { fetchUnifiedArchivesWithPaging } from "./unified-archives";

// Area 관련 함수들
export {
  fetchAllAreasByUserId,
  fetchAreaById,
  createArea,
  getOrCreateUncategorizedArea,
  updateArea,
  deleteAreaById,
} from "./areas";

// Resource 관련 함수들
export {
  fetchAllResourcesByUserId,
  fetchActiveResourcesByUserId,
  fetchArchivedResourcesByUserId,
  fetchResourceById,
  fetchResourceWithAreaById,
  fetchUncategorizedResourcesByUserId,
  createResource,
  updateResource,
  deleteResourceById,
} from "./resources";

// Project 관련 함수들
export {
  fetchAllProjectsByUserId,
  fetchProjectsOverlappingWithMonthly,
  fetchActiveProjectsByUserId,
  fetchArchivedProjectsByUserId,
  fetchProjectById,
  fetchProjectsByIds,
  fetchProjectsByAreaId,
  createProject,
  updateProject,
  deleteProjectById,
  updateProjectConnectedMonthlies,
} from "./projects";

// Task 관련 함수들
export {
  fetchAllTasksByUserId,
  fetchAllTasksByProjectId,
  getTaskCountsByProjectId,
  getTaskCountsForMultipleProjects,
  getTaskTimeStatsByProjectId,
  fetchTaskById,
  createTask,
  updateTask,
  addTaskToProject,
  updateTaskInProject,
  deleteTaskFromProject,
  toggleTaskCompletionInSubcollection,
  getTodayTasks,
  getCompletedTasksByMonthlyPeriod,
} from "./tasks";

// Monthly 관련 함수들
export {
  fetchAllMonthliesByUserId,
  fetchRecentMonthliesByUserId,
  fetchPastMonthliesByUserIdWithPaging,
  fetchMonthlyById,
  findMonthlyByMonth,
  createMonthly,
  updateMonthly,
  checkMonthlyExists,
  deleteMonthlyById,
  fetchProjectsByMonthlyId,
  fetchCurrentMonthlyProjects,
  fetchMonthliesByIds,
} from "./monthlies";

// User 관련 함수들
export {
  fetchUserById,
  createUser,
  updateUserProfile,
  updateUserSettings,
  updateUserPreferences,
  updateUserDisplayName,
  uploadProfilePicture,
  deleteProfilePicture,
  updateUserProfilePicture,
} from "./users";

// Analytics 관련 함수들
export {
  fetchActiveProjects,
  fetchCompletedProjects,
  getTodayDeadlineProjects,
  fetchYearlyActivityStats,
  fetchProjectsByUserIdWithPaging,
  fetchResourcesByUserIdWithPaging,
  fetchResourcesWithAreasByUserIdWithPaging,
  fetchAreaCountsByUserId,
  fetchArchivesByUserIdWithPaging,
  fetchProjectCountByUserId,
  fetchResourceCountByUserId,
  fetchArchiveCountByUserId,
  fetchActivitySnapshotsByUserId,
} from "./analytics";

// Utils 관련 함수들
export { getMonthlyStatus } from "../utils";

// Unified Archives 관련 함수들
export {
  fetchUnifiedArchivesWithPaging,
  fetchUnifiedArchiveCountByUserId,
  fetchUnifiedArchiveById,
  createUnifiedArchive,
  updateUnifiedArchive,
  deleteUnifiedArchive,
  fetchSingleArchive,
} from "./unified-archives";

// 마이그레이션 유틸리티
export {
  migrateTasksToSubcollections,
  checkMigrationStatus,
} from "./migration-utils";

// 실패 패턴 분석을 위한 통계 함수들
export const getFailurePatternStats = async (
  userId: string,
  timeRange: "monthly" | "yearly" = "yearly"
): Promise<{
  overallFailureRate: number;
  failureTrends: {
    period: string;
    failureRate: number;
    totalKeyResults: number;
    failedKeyResults: number;
  }[];
  reasonDistribution: {
    reason: string;
    label: string;
    count: number;
    percentage: number;
  }[];
  topFailureReasons: {
    reason: string;
    label: string;
    count: number;
  }[];
  suggestions: string[];
}> => {
  try {
    // 스냅샷 데이터 우선 조회 (성능 최적화)
    const snapshots = await fetchActivitySnapshotsByUserId(userId);

    if (snapshots && snapshots.length > 0) {
      return analyzeFailurePatternFromSnapshots(snapshots, timeRange);
    }

    // 스냅샷이 없는 경우 기존 방식으로 분석 (fallback)
    return analyzeFailurePatternFromArchives(userId, timeRange);
  } catch (error) {
    return {
      overallFailureRate: 0,
      failureTrends: [],
      reasonDistribution: [],
      topFailureReasons: [],
      suggestions: [],
    };
  }
};

// 스냅샷 데이터로부터 실패 패턴 분석 (새로 추가)
const analyzeFailurePatternFromSnapshots = (
  snapshots: any[],
  timeRange: "monthly" | "yearly"
): {
  overallFailureRate: number;
  failureTrends: any[];
  reasonDistribution: any[];
  topFailureReasons: any[];
  suggestions: string[];
} => {
  // 시간 범위에 따라 스냅샷 필터링
  const now = new Date();
  const filteredSnapshots = snapshots.filter((snapshot) => {
    const snapshotDate = new Date(snapshot.year, snapshot.month - 1);
    if (timeRange === "monthly") {
      // 최근 12개월
      const oneYearAgo = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      );
      return snapshotDate >= oneYearAgo;
    } else {
      // 최근 3년
      const threeYearsAgo = new Date(
        now.getFullYear() - 3,
        now.getMonth(),
        now.getDate()
      );
      return snapshotDate >= threeYearsAgo;
    }
  });

  // 전체 통계 계산
  let totalKeyResults = 0;
  let totalFailedKeyResults = 0;
  const allFailureReasons: Record<string, number> = {};

  filteredSnapshots.forEach((snapshot) => {
    if (snapshot.failureAnalysis) {
      totalKeyResults += snapshot.failureAnalysis.totalKeyResults || 0;
      totalFailedKeyResults += snapshot.failureAnalysis.failedKeyResults || 0;

      // 실패 이유별 집계
      if (snapshot.failureAnalysis.failureReasons) {
        snapshot.failureAnalysis.failureReasons.forEach((reason: any) => {
          allFailureReasons[reason.reason] =
            (allFailureReasons[reason.reason] || 0) + reason.count;
        });
      }
    }
  });

  const overallFailureRate =
    totalKeyResults > 0
      ? Math.round((totalFailedKeyResults / totalKeyResults) * 100)
      : 0;

  // 실패 이유별 분포 계산
  const reasonLabels: Record<string, string> = {
    unrealisticGoal: "목표 과다",
    timeManagement: "시간 관리",
    priorityMismatch: "우선순위",
    externalFactors: "외부 요인",
    motivation: "동기 부족",
    other: "기타",
  };

  const reasonDistribution = Object.entries(allFailureReasons)
    .map(([reason, count]) => ({
      reason,
      label: reasonLabels[reason] || reason,
      count,
      percentage: Math.round((count / totalFailedKeyResults) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  const topFailureReasons = reasonDistribution.slice(0, 3);

  // 기간별 트렌드 계산
  const failureTrends =
    timeRange === "monthly"
      ? calculateMonthlyTrendsFromSnapshots(filteredSnapshots)
      : calculateYearlyTrendsFromSnapshots(filteredSnapshots);

  // 개선 제안 생성
  const suggestions = generateImprovementSuggestions(topFailureReasons);

  return {
    overallFailureRate,
    failureTrends,
    reasonDistribution,
    topFailureReasons,
    suggestions,
  };
};

// 스냅샷 데이터로부터 월별 트렌드 계산 (새로 추가)
const calculateMonthlyTrendsFromSnapshots = (snapshots: any[]): any[] => {
  const monthlyStats: Record<string, { total: number; failed: number }> = {};

  snapshots.forEach((snapshot) => {
    const monthKey = `${snapshot.year}-${String(snapshot.month).padStart(
      2,
      "0"
    )}`;

    if (snapshot.failureAnalysis) {
      monthlyStats[monthKey] = {
        total: snapshot.failureAnalysis.totalKeyResults || 0,
        failed: snapshot.failureAnalysis.failedKeyResults || 0,
      };
    }
  });

  return Object.entries(monthlyStats)
    .map(([period, stats]) => ({
      period: `${period.split("-")[1]}월`,
      failureRate:
        stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      totalKeyResults: stats.total,
      failedKeyResults: stats.failed,
    }))
    .sort((a, b) => {
      const [aYear, aMonth] = a.period.split("-");
      const [bYear, bMonth] = b.period.split("-");
      return (
        new Date(parseInt(aYear), parseInt(aMonth) - 1).getTime() -
        new Date(parseInt(bYear), parseInt(bMonth) - 1).getTime()
      );
    })
    .slice(-12); // 최근 12개월
};

// 스냅샷 데이터로부터 연도별 트렌드 계산 (새로 추가)
const calculateYearlyTrendsFromSnapshots = (snapshots: any[]) => {
  const yearlyStats: Record<string, { total: number; failed: number }> = {};

  snapshots.forEach((snapshot) => {
    const yearKey = snapshot.year.toString();

    if (!yearlyStats[yearKey]) {
      yearlyStats[yearKey] = { total: 0, failed: 0 };
    }

    if (snapshot.failureAnalysis) {
      yearlyStats[yearKey].total +=
        snapshot.failureAnalysis.totalKeyResults || 0;
      yearlyStats[yearKey].failed +=
        snapshot.failureAnalysis.failedKeyResults || 0;
    }
  });

  return Object.entries(yearlyStats)
    .map(([period, stats]) => ({
      period: `${period}년`,
      failureRate:
        stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      totalKeyResults: stats.total,
      failedKeyResults: stats.failed,
    }))
    .sort((a, b) => parseInt(a.period) - parseInt(b.period));
};

// 기존 아카이브 기반 분석 (fallback)
const analyzeFailurePatternFromArchives = async (
  userId: string,
  timeRange: "monthly" | "yearly"
): Promise<{
  overallFailureRate: number;
  failureTrends: any[];
  reasonDistribution: any[];
  topFailureReasons: any[];
  suggestions: string[];
}> => {
  // 먼슬리 데이터 가져오기
  const monthlies = await fetchAllMonthliesByUserId(userId);

  // 완료된 먼슬리만 필터링
  const completedMonthlies = monthlies.filter((monthly: any) => {
    const status = getMonthlyStatus(monthly);
    return status === "ended";
  });

  // 시간 범위에 따라 필터링
  const now = new Date();
  const filteredMonthlies = completedMonthlies.filter((monthly: any) => {
    const endDate = new Date(monthly.endDate);
    if (timeRange === "monthly") {
      // 최근 12개월
      const oneYearAgo = new Date(
        now.getFullYear() - 1,
        now.getMonth(),
        now.getDate()
      );
      return endDate >= oneYearAgo;
    } else {
      // 최근 3년
      const threeYearsAgo = new Date(
        now.getFullYear() - 3,
        now.getMonth(),
        now.getDate()
      );
      return endDate >= threeYearsAgo;
    }
  });

  // 통합 아카이브에서 실패 이유 데이터 가져오기
  const archives = await fetchUnifiedArchivesWithPaging(
    userId,
    1000,
    undefined,
    "retrospective"
  );

  // 실패한 Key Results 데이터 수집
  const failedKeyResults: Array<{
    keyResultId: string;
    keyResultTitle: string;
    reason: string;
    customReason?: string;
    monthlyId: string;
    monthlyTitle: string;
    endDate: Date;
  }> = [];

  archives.archives.forEach((archive: any) => {
    if (archive.keyResultsReview?.failedKeyResults) {
      archive.keyResultsReview.failedKeyResults.forEach((failedKr: any) => {
        const monthly = filteredMonthlies.find(
          (m: any) => m.id === archive.parentId
        );
        if (monthly) {
          failedKeyResults.push({
            keyResultId: failedKr.keyResultId,
            keyResultTitle: failedKr.keyResultTitle,
            reason: failedKr.reason,
            customReason: failedKr.customReason,
            monthlyId: monthly.id,
            monthlyTitle: monthly.objective,
            endDate: new Date(monthly.endDate),
          });
        }
      });
    }
  });

  // 전체 통계 계산
  const totalKeyResults = filteredMonthlies.reduce(
    (total: number, monthly: any) => {
      return total + (monthly.keyResults?.length || 0);
    },
    0
  );

  const totalFailedKeyResults = failedKeyResults.length;
  const overallFailureRate =
    totalKeyResults > 0
      ? Math.round((totalFailedKeyResults / totalKeyResults) * 100)
      : 0;

  // 실패 이유별 분포 계산
  const reasonCounts: Record<string, number> = {};
  failedKeyResults.forEach((failedKr) => {
    reasonCounts[failedKr.reason] = (reasonCounts[failedKr.reason] || 0) + 1;
  });

  const reasonLabels: Record<string, string> = {
    unrealisticGoal: "목표 과다",
    timeManagement: "시간 관리",
    priorityMismatch: "우선순위",
    externalFactors: "외부 요인",
    motivation: "동기 부족",
    other: "기타",
  };

  const reasonDistribution = Object.entries(reasonCounts)
    .map(([reason, count]) => ({
      reason,
      label: reasonLabels[reason] || reason,
      count,
      percentage: Math.round((count / totalFailedKeyResults) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // 상위 실패 이유
  const topFailureReasons = reasonDistribution.slice(0, 3);

  // 기간별 트렌드 계산
  const failureTrends =
    timeRange === "monthly"
      ? calculateMonthlyTrends(filteredMonthlies, failedKeyResults)
      : calculateYearlyTrends(filteredMonthlies, failedKeyResults);

  // 개선 제안 생성
  const suggestions = generateImprovementSuggestions(topFailureReasons);

  return {
    overallFailureRate,
    failureTrends,
    reasonDistribution,
    topFailureReasons,
    suggestions,
  };
};

// 월별 트렌드 계산
const calculateMonthlyTrends = (
  monthlies: any[],
  failedKeyResults: any[]
): Array<{
  period: string;
  failureRate: number;
  totalKeyResults: number;
  failedKeyResults: number;
}> => {
  const monthlyStats: Record<string, { total: number; failed: number }> = {};

  // 월별 통계 수집
  monthlies.forEach((monthly) => {
    const endDate = new Date(monthly.endDate);
    const monthKey = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { total: 0, failed: 0 };
    }

    monthlyStats[monthKey].total += monthly.keyResults?.length || 0;
  });

  // 실패한 Key Results를 해당 월에 추가
  failedKeyResults.forEach((failedKr) => {
    const endDate = new Date(failedKr.endDate);
    const monthKey = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1
    ).padStart(2, "0")}`;

    if (monthlyStats[monthKey]) {
      monthlyStats[monthKey].failed += 1;
    }
  });

  // 결과 정렬 및 반환
  return Object.entries(monthlyStats)
    .map(([period, stats]) => ({
      period: `${period.split("-")[1]}월`,
      failureRate:
        stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      totalKeyResults: stats.total,
      failedKeyResults: stats.failed,
    }))
    .sort((a, b) => {
      const [aYear, aMonth] = a.period.split("-");
      const [bYear, bMonth] = b.period.split("-");
      return (
        new Date(parseInt(aYear), parseInt(aMonth) - 1).getTime() -
        new Date(parseInt(bYear), parseInt(bMonth) - 1).getTime()
      );
    })
    .slice(-12); // 최근 12개월
};

// 연도별 트렌드 계산
const calculateYearlyTrends = (
  monthlies: any[],
  failedKeyResults: any[]
): Array<{
  period: string;
  failureRate: number;
  totalKeyResults: number;
  failedKeyResults: number;
}> => {
  const yearlyStats: Record<string, { total: number; failed: number }> = {};

  // 연도별 통계 수집
  monthlies.forEach((monthly) => {
    const endDate = new Date(monthly.endDate);
    const yearKey = endDate.getFullYear().toString();

    if (!yearlyStats[yearKey]) {
      yearlyStats[yearKey] = { total: 0, failed: 0 };
    }

    yearlyStats[yearKey].total += monthly.keyResults?.length || 0;
  });

  // 실패한 Key Results를 해당 연도에 추가
  failedKeyResults.forEach((failedKr) => {
    const endDate = new Date(failedKr.endDate);
    const yearKey = endDate.getFullYear().toString();

    if (yearlyStats[yearKey]) {
      yearlyStats[yearKey].failed += 1;
    }
  });

  // 결과 정렬 및 반환
  return Object.entries(yearlyStats)
    .map(([period, stats]) => ({
      period: `${period}년`,
      failureRate:
        stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0,
      totalKeyResults: stats.total,
      failedKeyResults: stats.failed,
    }))
    .sort((a, b) => parseInt(a.period) - parseInt(b.period));
};

// 개선 제안 생성
const generateImprovementSuggestions = (
  topFailureReasons: Array<{ reason: string; label: string; count: number }>
): string[] => {
  const suggestions: string[] = [];

  topFailureReasons.forEach(({ reason, count }) => {
    switch (reason) {
      case "unrealisticGoal":
        suggestions.push("목표를 더 작은 단위로 분할하여 설정해보세요");
        break;
      case "timeManagement":
        suggestions.push("시간 블로킹 기법을 활용하여 일정을 관리해보세요");
        break;
      case "priorityMismatch":
        suggestions.push("우선순위 매트릭스를 사용하여 작업을 정렬해보세요");
        break;
      case "externalFactors":
        suggestions.push("외부 요인을 미리 고려하여 버퍼 시간을 확보해보세요");
        break;
      case "motivation":
        suggestions.push("작은 성취감을 느낄 수 있는 마일스톤을 추가해보세요");
        break;
      case "other":
        suggestions.push("실패 이유를 구체적으로 분석하여 개선점을 찾아보세요");
        break;
    }
  });

  return suggestions.slice(0, 2); // 최대 2개 제안
};
