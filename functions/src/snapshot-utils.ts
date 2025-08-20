// Cloud Functions용 스냅샷 유틸리티 함수들
// functions/src/snapshot-utils.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// 타입 정의
interface Area {
  id: string;
  name: string;
  [key: string]: any;
}

// 사용자 활동 스냅샷 생성
export const createActivitySnapshotForUser = async (
  userId: string,
  year: number,
  month: number
) => {
  try {
    console.log(`📸 ${year}년 ${month}월 스냅샷 생성 시작 (사용자: ${userId})`);

    // 해당 월의 모든 먼슬리 찾기
    const monthliesSnapshot = await db
      .collection("monthlies")
      .where("userId", "==", userId)
      .get();

    const monthMonthlies = monthliesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((monthly: any) => {
        const monthlyYear = new Date(monthly.endDate.toDate()).getFullYear();
        const monthlyMonth = new Date(monthly.endDate.toDate()).getMonth() + 1;
        return monthlyYear === year && monthlyMonth === month;
      });

    if (monthMonthlies.length === 0) {
      console.log(`❌ ${year}년 ${month}월 먼슬리가 없습니다.`);
      return null;
    }

    console.log(
      `📋 ${year}년 ${month}월 먼슬리 ${monthMonthlies.length}개 발견`
    );

    // 모든 먼슬리의 프로젝트와 태스크 데이터 수집
    const allProjects = [];
    const allAreas = await db
      .collection("areas")
      .where("userId", "==", userId)
      .get();
    const areas = allAreas.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    for (const monthly of monthMonthlies) {
      const projectsSnapshot = await db
        .collection("projects")
        .where("monthlyId", "==", monthly.id)
        .get();
      const projects = projectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      allProjects.push(...projects);
    }

    console.log(`📋 총 ${allProjects.length}개 프로젝트 발견`);

    // 프로젝트별 태스크 개수 가져오기
    const projectIds = allProjects.map((p) => p.id);
    const taskCounts: {
      [projectId: string]: { totalTasks: number; completedTasks: number };
    } = {};

    for (const projectId of projectIds) {
      const tasksSnapshot = await db
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .get();
      const tasks = tasksSnapshot.docs.map((doc) => doc.data());
      taskCounts[projectId] = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((task: any) => task.done).length,
      };
    }

    // 완료된 프로젝트 계산
    const completedProjects = allProjects.filter((project: any) => {
      const counts = taskCounts[project.id];
      return counts && counts.completedTasks >= counts.totalTasks;
    });

    const totalProjects = allProjects.length;
    const overallCompletionRate =
      totalProjects > 0
        ? Math.round((completedProjects.length / totalProjects) * 100)
        : 0;

    // 총 태스크 및 완료된 태스크 계산
    const totalTasks = Object.values(taskCounts).reduce(
      (sum, counts) => sum + counts.totalTasks,
      0
    );
    const completedTasks = Object.values(taskCounts).reduce(
      (sum, counts) => sum + counts.completedTasks,
      0
    );

    // 집중 시간 계산 (완료된 태스크의 duration 합계)
    let totalFocusTime = 0;
    for (const projectId of projectIds) {
      const tasksSnapshot = await db
        .collection("projects")
        .doc(projectId)
        .collection("tasks")
        .where("done", "==", true)
        .get();
      const completedTasks = tasksSnapshot.docs.map((doc) => doc.data());
      totalFocusTime += completedTasks.reduce(
        (sum, task: any) => sum + (task.duration || 0),
        0
      );
    }

    // 영역별 통계 계산
    const areaStats: { [areaId: string]: any } = {};
    for (const project of allProjects) {
      const areaId = project.areaId;
      if (!areaId) continue;

      if (!areaStats[areaId]) {
        const area = areas.find((a) => a.id === areaId);
        areaStats[areaId] = {
          name: area?.name || "Unknown",
          projectCount: 0,
          completedProjectCount: 0,
          focusTime: 0,
          completionRate: 0,
        };
      }

      areaStats[areaId].projectCount++;
      const counts = taskCounts[project.id];
      if (counts && counts.completedTasks >= counts.totalTasks) {
        areaStats[areaId].completedProjectCount++;
      }

      // 영역별 집중 시간 계산
      const tasksSnapshot = await db
        .collection("projects")
        .doc(project.id)
        .collection("tasks")
        .where("done", "==", true)
        .get();
      const completedTasks = tasksSnapshot.docs.map((doc) => doc.data());
      areaStats[areaId].focusTime += completedTasks.reduce(
        (sum: number, task: any) => sum + (task.duration || 0),
        0
      );
    }

    // 영역별 완료율 계산
    for (const areaId in areaStats) {
      const stats = areaStats[areaId];
      stats.completionRate =
        stats.projectCount > 0
          ? Math.round((stats.completedProjectCount / stats.projectCount) * 100)
          : 0;
    }

    // 실패 분석 데이터 수집 (새로 추가)
    const failureAnalysis = await collectFailureAnalysisData(
      userId,
      monthMonthlies
    );

    // 보상 정보 (모든 먼슬리의 보상 합계)
    const rewards = monthMonthlies
      .filter((monthly: any) => monthly.reward)
      .map((monthly: any) => monthly.reward);

    // 스냅샷 데이터 생성
    const snapshotData = {
      userId,
      year,
      month,
      monthlyIds: monthMonthlies.map((l: any) => l.id),
      monthlyTitles: monthMonthlies.map((l: any) => l.title),
      completedProjects,
      totalProjects,
      completionRate: overallCompletionRate,
      focusTime: totalFocusTime,
      totalTasks,
      completedTasks,
      rewards,
      areaStats,
      failureAnalysis, // 실패 분석 데이터 추가
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Firestore에 스냅샷 저장
    const snapshotId = `${userId}_${year}_${month}`;
    await db.collection("activitySnapshots").doc(snapshotId).set(snapshotData);

    console.log(`✅ ${year}년 ${month}월 스냅샷 생성 완료:`);
    console.log(`- 먼슬리: ${monthMonthlies.length}개`);
    console.log(`- 프로젝트: ${completedProjects}/${totalProjects} 완료`);
    console.log(`- 태스크: ${completedTasks}/${totalTasks} 완료`);
    console.log(`- 완료율: ${overallCompletionRate}%`);
    console.log(`- 집중 시간: ${Math.round(totalFocusTime / 60)}시간`);
    console.log(`- 보상: ${rewards.length}개`);
    if (failureAnalysis) {
      console.log(`- 실패율: ${failureAnalysis.failureRate}%`);
      console.log(`- 실패 이유: ${failureAnalysis.failureReasons.length}개`);
    }

    return snapshotData;
  } catch (error) {
    console.error(`❌ ${year}년 ${month}월 스냅샷 생성 실패:`, error);
    return null;
  }
};

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
    }));

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

// 사용자의 모든 월 스냅샷 생성
export const createAllSnapshotsForUser = async (userId: string) => {
  console.log(`🎯 사용자 ${userId}의 모든 스냅샷 생성 시작...`);

  const year = 2025;
  const createdSnapshots = [];

  // 3월부터 7월까지 스냅샷 생성
  for (let month = 3; month <= 7; month++) {
    const snapshot = await createActivitySnapshotForUser(userId, year, month);
    if (snapshot) {
      createdSnapshots.push(snapshot);
    }
  }

  console.log(
    `🎉 사용자 ${userId} 스냅샷 생성 완료! 총 ${createdSnapshots.length}개 생성됨`
  );
  return createdSnapshots;
};
