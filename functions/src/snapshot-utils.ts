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

    // 해당 월의 모든 루프 찾기
    const loopsSnapshot = await db
      .collection("loops")
      .where("userId", "==", userId)
      .get();

    const monthLoops = loopsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((loop: any) => {
        const loopYear = new Date(loop.endDate.toDate()).getFullYear();
        const loopMonth = new Date(loop.endDate.toDate()).getMonth() + 1;
        return loopYear === year && loopMonth === month;
      });

    if (monthLoops.length === 0) {
      console.log(`❌ ${year}년 ${month}월 루프가 없습니다.`);
      return null;
    }

    console.log(`📋 ${year}년 ${month}월 루프 ${monthLoops.length}개 발견`);

    // 모든 루프의 프로젝트와 태스크 데이터 수집
    const allProjects = [];
    const allAreas = await db
      .collection("areas")
      .where("userId", "==", userId)
      .get();
    const areas = allAreas.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    for (const loop of monthLoops) {
      const projectsSnapshot = await db
        .collection("projects")
        .where("loopId", "==", loop.id)
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

      const tasks = tasksSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(
        (task: any) => task.status === "completed"
      ).length;

      taskCounts[projectId] = { totalTasks, completedTasks };
    }

    // Area별 통계 계산
    const areaStats: any = {};
    let totalFocusTime = 0;
    let totalProjects = allProjects.length;
    let completedProjects = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    for (const area of areas) {
      const areaProjects = allProjects.filter((p: any) => p.areaId === area.id);
      if (areaProjects.length > 0) {
        const areaFocusTime = areaProjects.reduce(
          (sum, p: any) => sum + (p.estimatedTime || 0),
          0
        );
        const areaCompletedProjects = areaProjects.filter(
          (p: any) => p.status === "completed"
        ).length;

        // 해당 Area의 태스크 개수 계산
        const areaProjectIds = areaProjects.map((p: any) => p.id);
        const areaTaskCounts = areaProjectIds.reduce(
          (sum, projectId) => {
            const counts = taskCounts[projectId];
            return {
              total: sum.total + (counts?.totalTasks || 0),
              completed: sum.completed + (counts?.completedTasks || 0),
            };
          },
          { total: 0, completed: 0 }
        );

        const areaCompletionRate = Math.round(
          (areaCompletedProjects / areaProjects.length) * 100
        );

        areaStats[area.id] = {
          name: (area as unknown as Area).name,
          focusTime: areaFocusTime,
          completionRate: areaCompletionRate,
          projectCount: areaProjects.length,
          taskCount: areaTaskCounts.total,
          completedTasks: areaTaskCounts.completed,
        };

        totalFocusTime += areaFocusTime;
        completedProjects += areaCompletedProjects;
        totalTasks += areaTaskCounts.total;
        completedTasks += areaTaskCounts.completed;
      }
    }

    // 전체 완료율 계산
    const overallCompletionRate =
      totalProjects > 0
        ? Math.round((completedProjects / totalProjects) * 100)
        : 0;

    // 보상 정보 (모든 루프의 보상 합계)
    const rewards = monthLoops
      .filter((loop: any) => loop.reward)
      .map((loop: any) => loop.reward);

    // 스냅샷 데이터 생성
    const snapshotData = {
      userId,
      year,
      month,
      loopIds: monthLoops.map((l: any) => l.id),
      loopTitles: monthLoops.map((l: any) => l.title),
      completedProjects,
      totalProjects,
      completionRate: overallCompletionRate,
      focusTime: totalFocusTime,
      totalTasks,
      completedTasks,
      rewards,
      areaStats,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Firestore에 스냅샷 저장
    const snapshotId = `${userId}_${year}_${month}`;
    await db.collection("activitySnapshots").doc(snapshotId).set(snapshotData);

    console.log(`✅ ${year}년 ${month}월 스냅샷 생성 완료:`);
    console.log(`- 루프: ${monthLoops.length}개`);
    console.log(`- 프로젝트: ${completedProjects}/${totalProjects} 완료`);
    console.log(`- 태스크: ${completedTasks}/${totalTasks} 완료`);
    console.log(`- 완료율: ${overallCompletionRate}%`);
    console.log(`- 집중 시간: ${Math.round(totalFocusTime / 60)}시간`);
    console.log(`- 보상: ${rewards.length}개`);

    return snapshotData;
  } catch (error) {
    console.error(`❌ ${year}년 ${month}월 스냅샷 생성 실패:`, error);
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
