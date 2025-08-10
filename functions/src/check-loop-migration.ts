// loop 컬렉션 확인 및 마이그레이션 스크립트
// functions/src/check-loop-migration.ts

import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

/**
 * loop 컬렉션이 존재하는지 확인하고, 있다면 chapter로 마이그레이션합니다.
 */
export const checkAndMigrateLoopToChapter = async (): Promise<void> => {
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

    // 각 loop 문서를 chapter로 마이그레이션
    for (const doc of loopSnapshot.docs) {
      try {
        const loopData = doc.data();
        console.log(`🔄 loop 문서 "${doc.id}" 마이그레이션 중...`);

        // chapter 컬렉션에 동일한 ID로 문서 생성
        const chapterRef = db.collection("chapters").doc(doc.id);
        const chapterDoc = await chapterRef.get();

        if (chapterDoc.exists) {
          console.log(
            `⚠️ chapter 문서 "${doc.id}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // loop 데이터를 chapter 형식으로 변환
        const chapterData = {
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

        // chapter 문서 생성
        await chapterRef.set(chapterData);
        console.log(`✅ loop "${doc.id}"을 chapter로 마이그레이션 완료`);

        // loop 문서 삭제
        await doc.ref.delete();
        console.log(`🗑️ loop 문서 "${doc.id}" 삭제 완료`);
      } catch (error) {
        console.error(`❌ loop 문서 "${doc.id}" 마이그레이션 실패:`, error);
      }
    }

    console.log("🎉 loop to chapter 마이그레이션이 완료되었습니다.");
  } catch (error) {
    console.error("❌ loop 마이그레이션 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 프로젝트의 loopId를 chapterId로 업데이트합니다.
 */
export const migrateProjectLoopIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 loopId를 chapterId로 마이그레이션 중...");

    // loopId가 있는 프로젝트들 조회
    const projectsSnapshot = await db.collection("projects").get();
    let migratedCount = 0;

    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();

      if (projectData.loopId && !projectData.chapterId) {
        try {
          console.log(
            `🔄 프로젝트 "${doc.id}"의 loopId를 chapterId로 변경 중...`
          );

          // loopId를 chapterId로 변경
          await doc.ref.update({
            chapterId: projectData.loopId,
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
 * 프로젝트의 loopId를 기반으로 chapter 문서를 생성합니다.
 */
export const createChaptersFromProjectLoopIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 loopId를 기반으로 chapter 문서 생성 중...");

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

    // 각 loopId에 대해 chapter 문서 생성
    for (const [loopId, projects] of loopIdToProjects) {
      try {
        console.log(`🔄 loopId "${loopId}"에 대한 chapter 생성 중...`);

        // chapter 문서가 이미 존재하는지 확인
        const chapterRef = db.collection("chapters").doc(loopId);
        const chapterDoc = await chapterRef.get();

        if (chapterDoc.exists) {
          console.log(
            `⚠️ chapter 문서 "${loopId}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // 프로젝트들의 공통 정보를 기반으로 chapter 데이터 생성
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

        // chapter 데이터 생성
        const chapterData = {
          userId: userId,
          title: `Chapter ${loopId.slice(0, 8)}`, // loopId의 앞 8자리를 사용
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

        // chapter 문서 생성
        await chapterRef.set(chapterData);
        console.log(`✅ loopId "${loopId}"에 대한 chapter 생성 완료`);
      } catch (error) {
        console.error(`❌ loopId "${loopId}" chapter 생성 실패:`, error);
      }
    }

    console.log("🎉 프로젝트 loopId 기반 chapter 생성이 완료되었습니다.");
  } catch (error) {
    console.error("❌ chapter 생성 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 프로젝트의 chapterId를 기반으로 chapter 문서를 생성합니다.
 */
export const createChaptersFromProjectChapterIds = async (): Promise<void> => {
  try {
    console.log("🔍 프로젝트의 chapterId를 기반으로 chapter 문서 생성 중...");

    // chapterId가 있는 프로젝트들 조회
    const projectsSnapshot = await db.collection("projects").get();
    const chapterIdToProjects = new Map<string, any[]>();

    // chapterId별로 프로젝트 그룹화
    for (const doc of projectsSnapshot.docs) {
      const projectData = doc.data();
      if (projectData.chapterId) {
        if (!chapterIdToProjects.has(projectData.chapterId)) {
          chapterIdToProjects.set(projectData.chapterId, []);
        }
        chapterIdToProjects.get(projectData.chapterId)!.push({
          id: doc.id,
          ...projectData,
        });
      }
    }

    console.log(
      `📋 ${chapterIdToProjects.size}개의 고유한 chapterId를 발견했습니다.`
    );

    // 각 chapterId에 대해 chapter 문서 생성
    for (const [chapterId, projects] of chapterIdToProjects) {
      try {
        console.log(`🔄 chapterId "${chapterId}"에 대한 chapter 생성 중...`);

        // chapter 문서가 이미 존재하는지 확인
        const chapterRef = db.collection("chapters").doc(chapterId);
        const chapterDoc = await chapterRef.get();

        if (chapterDoc.exists) {
          console.log(
            `⚠️ chapter 문서 "${chapterId}"가 이미 존재합니다. 건너뜁니다.`
          );
          continue;
        }

        // 프로젝트들의 공통 정보를 기반으로 chapter 데이터 생성
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

        // chapter 데이터 생성
        const chapterData = {
          userId: userId,
          title: `Chapter ${chapterId.slice(0, 8)}`, // chapterId의 앞 8자리를 사용
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

        // chapter 문서 생성
        await chapterRef.set(chapterData);
        console.log(`✅ chapterId "${chapterId}"에 대한 chapter 생성 완료`);
      } catch (error) {
        console.error(`❌ chapterId "${chapterId}" chapter 생성 실패:`, error);
      }
    }

    console.log("🎉 프로젝트 chapterId 기반 chapter 생성이 완료되었습니다.");
  } catch (error) {
    console.error("❌ chapter 생성 중 오류 발생:", error);
    throw error;
  }
};

/**
 * 전체 loop to chapter 마이그레이션을 실행합니다.
 */
export const runLoopToChapterMigration = async (): Promise<void> => {
  console.log("🚀 loop to chapter 마이그레이션 시작...");

  try {
    // 1. loop 컬렉션을 chapter로 마이그레이션
    await checkAndMigrateLoopToChapter();

    // 2. 프로젝트의 loopId를 chapterId로 마이그레이션
    await migrateProjectLoopIds();

    // 3. 프로젝트의 loopId를 기반으로 chapter 문서 생성
    await createChaptersFromProjectLoopIds();

    console.log("🎉 전체 마이그레이션이 완료되었습니다!");
  } catch (error) {
    console.error("❌ 마이그레이션 실패:", error);
    throw error;
  }
};
