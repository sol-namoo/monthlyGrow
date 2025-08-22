import { onRequest } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { updateMonthlyProgress } from "./firebase-utils";
import { migrateEntireDatabase, migrateUserData } from "./migration-utils";
import {
  runLoopToMonthlyMigration,
  createMonthliesFromProjectLoopIds,
  createMonthliesFromProjectMonthlyIds,
} from "./check-loop-migration";

// 태스크 완료 시 먼슬리별 진행률 업데이트
export const onTaskCompleted = onDocumentUpdated(
  "projects/{projectId}/tasks/{taskId}",
  async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // 태스크가 완료되지 않은 상태에서 완료된 상태로 변경된 경우
    if (beforeData?.done === false && afterData?.done === true) {
      const projectId = event.params.projectId;
      const userId = afterData?.userId;

      if (userId) {
        try {
          await updateMonthlyProgress(userId, projectId, 1);
        } catch (error) {
          console.error(
            `Failed to update monthly progress for task ${event.params.taskId}:`,
            error
          );
        }
      }
    }
  }
);

// 마이그레이션 상태 확인
export const checkMigrationStatus = onRequest(async (req, res) => {
  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();

    // 전체 먼슬리 수 확인
    const monthliesSnapshot = await db.collection("monthlies").get();
    const totalMonthlies = monthliesSnapshot.docs.length;

    // connectedProjects가 있는 먼슬리 수 확인
    let migratedMonthlies = 0;
    let totalProjects = 0;
    let migratedProjects = 0;

    for (const doc of monthliesSnapshot.docs) {
      const data = doc.data();
      if (data.connectedProjects && data.connectedProjects.length > 0) {
        migratedMonthlies++;
        totalProjects += data.connectedProjects.length;
      }
    }

    // 전체 프로젝트 수 확인
    const projectsSnapshot = await db.collection("projects").get();
    const totalAllProjects = projectsSnapshot.docs.length;

    // connectedMonthlies가 있는 프로젝트 수 확인
    for (const doc of projectsSnapshot.docs) {
      const data = doc.data();
      if (data.connectedMonthlies && data.connectedMonthlies.length > 0) {
        migratedProjects++;
      }
    }

    res.json({
      success: true,
      migrationStatus: {
        monthlies: {
          total: totalMonthlies,
          migrated: migratedMonthlies,
          percentage:
            totalMonthlies > 0
              ? Math.round((migratedMonthlies / totalMonthlies) * 100)
              : 0,
        },
        projects: {
          total: totalAllProjects,
          migrated: migratedProjects,
          percentage:
            totalAllProjects > 0
              ? Math.round((migratedProjects / totalAllProjects) * 100)
              : 0,
        },
        connectedProjects: {
          total: totalProjects,
        },
      },
    });
  } catch (error) {
    console.error("Migration status check failed:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// 마이그레이션 함수들
export const migrateDatabase = onRequest(async (req, res) => {
  try {
    await migrateEntireDatabase();
    res.json({ success: true, message: "Database migration completed" });
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export const migrateUser = onRequest(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ success: false, error: "userId is required" });
    return;
  }

  try {
    await migrateUserData(userId);
    res.json({ success: true, message: `User ${userId} migration completed` });
  } catch (error) {
    console.error(`User ${userId} migration failed:`, error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// loop to monthly 마이그레이션
export const migrateLoopToMonthly = onRequest(async (req, res) => {
  try {
    await runLoopToMonthlyMigration();
    res.json({ success: true, message: "Loop to monthly migration completed" });
  } catch (error) {
    console.error("Loop to monthly migration failed:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// monthly 문서 생성 (loopId 기반)
export const createMonthliesFromLoopIds = onRequest(async (req, res) => {
  try {
    await createMonthliesFromProjectLoopIds();
    res.json({
      success: true,
      message: "Monthlies created from project loopIds",
    });
  } catch (error) {
    console.error("Monthly creation failed:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// monthly 문서 생성 (monthlyId 기반)
export const createMonthliesFromMonthlyIds = onRequest(async (req, res) => {
  try {
    await createMonthliesFromProjectMonthlyIds();
    res.json({
      success: true,
      message: "Monthlies created from project monthlyIds",
    });
  } catch (error) {
    console.error("Monthly creation failed:", error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
