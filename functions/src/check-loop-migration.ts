// loop 컬렉션 확인 및 마이그레이션 스크립트
// functions/src/check-loop-migration.ts

import { db } from "./admin";

/**
 * loop 컬렉션이 존재하는지 확인하고, 있다면 monthly로 마이그레이션합니다.
 */
export const checkAndMigrateLoopToMonthly = async (): Promise<void> => {
  try {
    console.log("🔍 loop 컬렉션 확인 중...");

    // loop 컬렉션 조회
    const loopSnapshot = await db.collection("loop").get();

    if (loopSnapshot.empty) {
      console.log(
        "✅ loop 컬렉션이 존재하지 않습니다. 마이그레이션이 완료되었거나 필요하지 않습니다."
      );
      return;
    }

    console.log(
      `📋 loop 컬렉션에서 ${loopSnapshot.size}개의 문서를 발견했습니다.`
    );

    // 각 loop 문서를 monthly로 마이그레이션
    for (const doc of loopSnapshot.docs) {
      try {
        const loopData = doc.data();
        console.log(`🔄 loop 문서 "${doc.id}" 마이그레이션 중...`);

        // monthly 컬렉션에 동일한 ID로 문서 생성
        const monthlyRef = db.collection("monthlies").doc(doc.id);
        const monthlyDoc = await monthlyRef.get();

        if (monthlyDoc.exists) {
          console.log(
            `⚠️ monthly 문서 "${doc.id}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // loop 데이터를 monthly 형식으로 변환
        const monthlyData = {
          userId: loopData.userId,
          title: loopData.title || `Loop ${doc.id}`,
          startDate: loopData.startDate || new Date(),
          endDate: loopData.endDate || new Date(),
          focusAreas: loopData.focusAreas || [],
          reward: loopData.reward || "",
          doneCount: loopData.doneCount || 0,
          targetCount: loopData.targetCount || 0,
          projectIds: loopData.projectIds || [],
          connectedProjects: loopData.connectedProjects || [],
          retrospective: loopData.retrospective || null,
          note: loopData.note || null,
          createdAt: loopData.createdAt || new Date(),
          updatedAt: new Date(),
        };

        // monthly 문서 생성
        await monthlyRef.set(monthlyData);
        console.log(`✅ loop "${doc.id}"을 monthly로 마이그레이션 완료`);

        // loop 문서 삭제
        await doc.ref.delete();
        console.log(`🗑️ loop 문서 "${doc.id}" 삭제 완료`);
      } catch (error) {
        console.error(`❌ loop 문서 "${doc.id}" 마이그레이션 실패:`, error);
      }
    }

    console.log("🎉 loop to monthly 마이그레이션이 완료되었습니다.");
  } catch (error) {
    console.error("❌ loop 마이그레이션 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 프로젝트의 loopId를 monthlyId로 업데이트합니다.
 */
export const migrateProjectLoopIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 loopId를 monthlyId로 마이그레이션 중...");

    // loopId가 있는 프로젝트들 조회
    const projectsSnapshot = await db.collection("projects").get();
    let migratedCount = 0;

    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();

      if (projectData.loopId && !projectData.monthlyId) {
        try {
          console.log(
            `🔄 프로젝트 "${doc.id}"의 loopId를 monthlyId로 변경 중...`
          );

          // loopId를 monthlyId로 변경
          await doc.ref.update({
            monthlyId: projectData.loopId,
            loopId: null, // 기존 loopId 제거
            updatedAt: new Date(),
          });

          migratedCount++;
          console.log(`✅ 프로젝트 "${doc.id}" 마이그레이션 완료`);
        } catch (error) {
          console.error(`❌ 프로젝트 "${doc.id}" 마이그레이션 실패:`, error);
        }
      }
    }

    console.log(
      `🎉 총 ${migratedCount}개의 프로젝트가 마이그레이션되었습니다.`
    );
  } catch (error) {
    console.error("❌ 프로젝트 loopId 마이그레이션 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 프로젝트의 loopId를 기반으로 monthly 문서를 생성합니다.
 */
export const createMonthliesFromProjectLoopIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 loopId를 기반으로 monthly 문서 생성 중...");

    // loopId가 있는 프로젝트들 조회
    const projectsSnapshot = await db.collection("projects").get();
    const loopIdToProjects = new Map<string, any[]>();

    // loopId별로 프로젝트 그룹화
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      if (projectData.loopId) {
        if (!loopIdToProjects.has(projectData.loopId)) {
          loopIdToProjects.set(projectData.loopId, []);
        }
        loopIdToProjects.get(projectData.loopId)!.push({
          id: doc.id,
          ...projectData,
        });
      }
    }

    console.log(
      `📋 ${loopIdToProjects.size}개의 고유한 loopId를 발견했습니다.`
    );

    // 각 loopId에 대해 monthly 문서 생성
    for (const [loopId, projects] of loopIdToProjects) {
      try {
        console.log(`🔄 loopId "${loopId}"에 대한 monthly 생성 중...`);

        // monthly 문서가 이미 존재하는지 확인
        const monthlyRef = db.collection("monthlies").doc(loopId);
        const monthlyDoc = await monthlyRef.get();

        if (monthlyDoc.exists) {
          console.log(
            `⚠️ monthly 문서 "${loopId}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // 프로젝트들의 공통 정보를 기반으로 monthly 데이터 생성
        const firstProject = projects[0];
        const userId = firstProject.userId;

        // 프로젝트들의 날짜 범위 계산
        let earliestStart = new Date();
        let latestEnd = new Date(0);

        projects.forEach((project) => {
          if (project.startDate) {
            const startDate = project.startDate.toDate
              ? project.startDate.toDate()
              : new Date(project.startDate);
            if (startDate < earliestStart) {
              earliestStart = startDate;
            }
          }
          if (project.endDate) {
            const endDate = project.endDate.toDate
              ? project.endDate.toDate()
              : new Date(project.endDate);
            if (endDate > latestEnd) {
              latestEnd = endDate;
            }
          }
        });

        // monthly 데이터 생성
        const monthlyData = {
          userId: userId,
          title: `Monthly ${loopId.slice(0, 8)}`, // loopId의 앞 8자리를 사용
          startDate: earliestStart,
          endDate: latestEnd,
          focusAreas: [],
          reward: "",
          doneCount: 0,
          targetCount: projects.length,
          projectIds: projects.map((p) => p.id),
          connectedProjects: [],
          retrospective: null,
          note: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // monthly 문서 생성
        await monthlyRef.set(monthlyData);
        console.log(`✅ loopId "${loopId}"에 대한 monthly 생성 완료`);
      } catch (error) {
        console.error(`❌ loopId "${loopId}" monthly 생성 실패:`, error);
      }
    }

    console.log("🎉 프로젝트 loopId 기반 monthly 생성이 완료되었습니다.");
  } catch (error) {
    console.error("❌ monthly 생성 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 프로젝트의 monthlyId를 기반으로 monthly 문서를 생성합니다.
 */
export const createMonthliesFromProjectMonthlyIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 monthlyId를 기반으로 monthly 문서 생성 중...");

    // monthlyId가 있는 프로젝트들 조회
    const projectsSnapshot = await db.collection("projects").get();
    const monthlyIdToProjects = new Map<string, any[]>();

    // monthlyId별로 프로젝트 그룹화
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      if (projectData.monthlyId) {
        if (!monthlyIdToProjects.has(projectData.monthlyId)) {
          monthlyIdToProjects.set(projectData.monthlyId, []);
        }
        monthlyIdToProjects.get(projectData.monthlyId)!.push({
          id: doc.id,
          ...projectData,
        });
      }
    }

    console.log(
      `📋 ${monthlyIdToProjects.size}개의 고유한 monthlyId를 발견했습니다.`
    );

    // 각 monthlyId에 대해 monthly 문서 생성
    for (const [monthlyId, projects] of monthlyIdToProjects) {
      try {
        console.log(`🔄 monthlyId "${monthlyId}"에 대한 monthly 생성 중...`);

        // monthly 문서가 이미 존재하는지 확인
        const monthlyRef = db.collection("monthlies").doc(monthlyId);
        const monthlyDoc = await monthlyRef.get();

        if (monthlyDoc.exists) {
          console.log(
            `⚠️ monthly 문서 "${monthlyId}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // 프로젝트들의 공통 정보를 기반으로 monthly 데이터 생성
        const firstProject = projects[0];
        const userId = firstProject.userId;

        // 프로젝트들의 날짜 범위 계산
        let earliestStart = new Date();
        let latestEnd = new Date(0);

        projects.forEach((project) => {
          if (project.startDate) {
            const startDate = project.startDate.toDate
              ? project.startDate.toDate()
              : new Date(project.startDate);
            if (startDate < earliestStart) {
              earliestStart = startDate;
            }
          }
          if (project.endDate) {
            const endDate = project.endDate.toDate
              ? project.endDate.toDate()
              : new Date(project.endDate);
            if (endDate > latestEnd) {
              latestEnd = endDate;
            }
          }
        });

        // monthly 데이터 생성
        const monthlyData = {
          userId: userId,
          title: `Monthly ${monthlyId.slice(0, 8)}`, // monthlyId의 앞 8자리를 사용
          startDate: earliestStart,
          endDate: latestEnd,
          focusAreas: [],
          reward: "",
          doneCount: 0,
          targetCount: projects.length,
          projectIds: projects.map((p) => p.id),
          connectedProjects: [],
          retrospective: null,
          note: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // monthly 문서 생성
        await monthlyRef.set(monthlyData);
        console.log(`✅ monthlyId "${monthlyId}"에 대한 monthly 생성 완료`);
      } catch (error) {
        console.error(`❌ monthlyId "${monthlyId}" monthly 생성 실패:`, error);
      }
    }

    console.log("🎉 프로젝트 monthlyId 기반 monthly 생성이 완료되었습니다.");
  } catch (error) {
    console.error("❌ monthly 생성 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 전체 loop to monthly 마이그레이션을 실행합니다.
 */
export const runLoopToMonthlyMigration = async (): Promise<void> => {
  console.log("🚀 loop to monthly 마이그레이션 시작...");

  try {
    // 1. loop 컬렉션을 monthly로 마이그레이션
    await checkAndMigrateLoopToMonthly();

    // 2. 프로젝트의 loopId를 monthlyId로 마이그레이션
    await migrateProjectLoopIds();

    // 3. 프로젝트의 loopId를 기반으로 monthly 문서 생성
    await createMonthliesFromProjectLoopIds();

    console.log("🎉 전체 마이그레이션이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
    throw error;
  }
};
