// Cloud Functions용 스냅샷 유틸리티 함수들
// functions/src/snapshot-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// 타입 정의

interface Project {
  id: string;
  title: string;
  areaId?: string;
  [key: string]: any;
}

interface Archive {
  id: string;
  parentId: string;
  keyResultsReview?: {
    failedKeyResults?: Array<{
      keyResultId: string;
      keyResultTitle: string;
      reason: string;
      customReason?: string;
    }>;
  };
  [key: string]: any;
}

interface KeyResultSnapshot {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  targetCount?: number;
  completedCount?: number;
}

interface MonthlySnapshot {
  id: string;
  userId: string;
  yearMonth: string;
  snapshotDate: Date;
  monthly: {
    id: string;
    objective: string;
    objectiveDescription?: string;
    keyResults: KeyResultSnapshot[];
  };
  completedTasks: {
    projectId: string;
    projectTitle: string;
    areaName: string;
    tasks: {
      taskId: string;
      title: string;
      completedAt: Date;
    }[];
  }[];
  statistics: {
    totalCompletedTasks: number;
    totalProjects: number;
    totalAreas: number;
    keyResultsCompleted: number;
    keyResultsTotal: number;
  };
  failureAnalysis?: {
    totalKeyResults: number;
    failedKeyResults: number;
    failureRate: number;
    failureReasons: {
      reason: string;
      label: string;
      count: number;
      percentage: number;
    }[];
    failedKeyResultsDetail: {
      keyResultId: string;
      keyResultTitle: string;
      reason: string;
      customReason?: string;
    }[];
  };
}

// 레거시 함수 제거됨: createActivitySnapshotForUser
// 새로운 MonthlySnapshot 구조를 사용하는 createMonthlySnapshot으로 대체됨

// 실패 분석 데이터 수집 함수 (새로 추가)
const collectFailureAnalysisData = async (
  userId: string,
  monthlies: any[]
): Promise<any> => {
  try {
    // 통합 아카이브에서 실패 이유 데이터 가져오기
    const archivesSnapshot = await db
      .collection("unified_archives")
      .where("userId", "==", userId)
      .where("type", "in", ["monthly_retrospective", "project_retrospective"])
      .get();

    const archives = archivesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Archive[];

    // 실패한 Key Results 데이터 수집
    const failedKeyResults: Array<{
      keyResultId: string;
      keyResultTitle: string;
      reason: string;
      customReason?: string;
      monthlyId: string;
    }> = [];

    archives.forEach((archive) => {
      if (archive.keyResultsReview?.failedKeyResults) {
        archive.keyResultsReview.failedKeyResults.forEach((failedKr: any) => {
          // 해당 월의 먼슬리인지 확인
          const isMonthlyInTargetPeriod = monthlies.some(
            (monthly) => monthly.id === archive.parentId
          );

          if (isMonthlyInTargetPeriod) {
            failedKeyResults.push({
              keyResultId: failedKr.keyResultId,
              keyResultTitle: failedKr.keyResultTitle,
              reason: failedKr.reason,
              customReason: failedKr.customReason,
              monthlyId: archive.parentId,
            });
          }
        });
      }
    });

    // 전체 Key Results 개수 계산
    const totalKeyResults = monthlies.reduce((total, monthly) => {
      return total + (monthly.keyResults?.length || 0);
    }, 0);

    const failedKeyResultsCount = failedKeyResults.length;
    const failureRate =
      totalKeyResults > 0
        ? Math.round((failedKeyResultsCount / totalKeyResults) * 100)
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

    const failureReasons = Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        label: reasonLabels[reason] || reason,
        count,
        percentage: Math.round((count / failedKeyResultsCount) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalKeyResults,
      failedKeyResults: failedKeyResultsCount,
      failureRate,
      failureReasons,
      failedKeyResultsDetail: failedKeyResults,
    };
  } catch (error) {
    console.error("실패 분석 데이터 수집 실패:", error);
    return null;
  }
};

// 새로운 MonthlySnapshot 구조에 맞는 스냅샷 생성
export const createMonthlySnapshot = async (
  userId: string,
  monthlyId: string
): Promise<MonthlySnapshot | null> => {
  try {
    console.log(
      `📸 먼슬리 스냅샷 생성 시작 (사용자: ${userId}, 먼슬리: ${monthlyId})`
    );

    // 먼슬리 데이터 조회
    const monthlyDoc = await db.collection("monthlies").doc(monthlyId).get();
    if (!monthlyDoc.exists) {
      console.log(`❌ 먼슬리 ${monthlyId}를 찾을 수 없습니다.`);
      return null;
    }

    const monthlyData = monthlyDoc.data();
    if (!monthlyData) {
      console.log(`❌ 먼슬리 ${monthlyId} 데이터가 없습니다.`);
      return null;
    }

    // Key Results를 KeyResultSnapshot 형태로 변환
    const keyResults: KeyResultSnapshot[] = (monthlyData.keyResults || []).map(
      (kr: any) => ({
        id: kr.id,
        title: kr.title,
        description: kr.description,
        isCompleted: kr.isCompleted || false,
        targetCount: kr.targetCount,
        completedCount: kr.completedCount,
      })
    );

    // 연결된 프로젝트들 조회 (connectedMonthlies 배열에서 해당 monthlyId를 포함하는 프로젝트들)
    const projectsSnapshot = await db
      .collection("projects")
      .where("connectedMonthlies", "array-contains", monthlyId)
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];

    console.log(`📋 연결된 프로젝트 ${projects.length}개 발견`);

    // 완료된 태스크들을 프로젝트별로 그룹핑
    const completedTasks: {
      projectId: string;
      projectTitle: string;
      areaName: string;
      tasks: {
        taskId: string;
        title: string;
        completedAt: Date;
      }[];
    }[] = [];

    let totalCompletedTasks = 0;
    const areaIds = new Set<string>();

    for (const project of projects) {
      // 프로젝트의 완료된 태스크들 조회
      const tasksSnapshot = await db
        .collection("projects")
        .doc(project.id)
        .collection("tasks")
        .where("done", "==", true)
        .get();

      const completedProjectTasks = tasksSnapshot.docs.map((doc) => {
        const taskData = doc.data();
        return {
          taskId: doc.id,
          title: taskData.title,
          completedAt: taskData.completedAt?.toDate() || new Date(),
        };
      });

      if (completedProjectTasks.length > 0) {
        // Area 정보 조회
        const areaDoc = await db
          .collection("areas")
          .doc(project.areaId || "")
          .get();
        const areaName = areaDoc.exists
          ? areaDoc.data()?.name || "미분류"
          : "미분류";

        completedTasks.push({
          projectId: project.id,
          projectTitle: project.title,
          areaName,
          tasks: completedProjectTasks,
        });

        totalCompletedTasks += completedProjectTasks.length;
        if (project.areaId) {
          areaIds.add(project.areaId);
        }
      }
    }

    // 통계 정보 계산
    const statistics = {
      totalCompletedTasks,
      totalProjects: projects.length,
      totalAreas: areaIds.size,
      keyResultsCompleted: keyResults.filter((kr) => kr.isCompleted).length,
      keyResultsTotal: keyResults.length,
    };

    // 실패 분석 데이터 수집
    const failureAnalysis = await collectFailureAnalysisData(userId, [
      monthlyData,
    ]);

    // 년월 문자열 생성
    const endDate = monthlyData.endDate.toDate();
    const yearMonth = `${endDate.getFullYear()}-${String(
      endDate.getMonth() + 1
    ).padStart(2, "0")}`;

    // MonthlySnapshot 데이터 생성
    const snapshotData: MonthlySnapshot = {
      id: `${userId}_${yearMonth}`,
      userId,
      yearMonth,
      snapshotDate: new Date(),
      monthly: {
        id: monthlyId,
        objective: monthlyData.objective,
        objectiveDescription: monthlyData.objectiveDescription,
        keyResults,
      },
      completedTasks,
      statistics,
      failureAnalysis: failureAnalysis || undefined,
    };

    // Firestore에 스냅샷 저장
    await db
      .collection("monthly_snapshots")
      .doc(snapshotData.id)
      .set(snapshotData);

    console.log(`✅ 먼슬리 스냅샷 생성 완료:`);
    console.log(`- 먼슬리: ${monthlyData.objective}`);
    console.log(
      `- Key Results: ${statistics.keyResultsCompleted}/${statistics.keyResultsTotal} 완료`
    );
    console.log(`- 프로젝트: ${statistics.totalProjects}개`);
    console.log(`- 완료된 태스크: ${statistics.totalCompletedTasks}개`);
    console.log(`- 영역: ${statistics.totalAreas}개`);
    if (failureAnalysis) {
      console.log(`- 실패율: ${failureAnalysis.failureRate}%`);
    }

    return snapshotData;
  } catch (error) {
    console.error(`❌ 먼슬리 스냅샷 생성 실패:`, error);
    return null;
  }
};

// 사용자의 모든 월 스냅샷 생성 (새로운 구조)
export const createAllSnapshotsForUser = async (userId: string) => {
  console.log(`🎯 사용자 ${userId}의 모든 스냅샷 생성 시작...`);

  try {
    // 지난 달 완료된 먼슬리들 찾기
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthliesSnapshot = await db
      .collection("monthlies")
      .where("userId", "==", userId)
      .where("endDate", ">=", lastMonth)
      .where("endDate", "<", thisMonth)
      .get();

    const createdSnapshots = [];

    for (const monthlyDoc of monthliesSnapshot.docs) {
      const monthlyId = monthlyDoc.id;
      const snapshot = await createMonthlySnapshot(userId, monthlyId);
      if (snapshot) {
        createdSnapshots.push(snapshot);
      }
    }

    console.log(
      `🎉 사용자 ${userId} 스냅샷 생성 완료! 총 ${createdSnapshots.length}개 생성됨`
    );
    return createdSnapshots;
  } catch (error) {
    console.error(`❌ 사용자 ${userId} 스냅샷 생성 실패:`, error);
    return [];
  }
};
