// Cloud Functions for Firebase 크론 작업 예시
// functions/src/cronJobs.ts

import * as functions from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {
  autoMigrateIncompleteProjects,
  isCarryOverEnabled,
} from "./firebase-utils";
import { createAllSnapshotsForUser } from "./snapshot-utils";

// Firebase Admin 초기화
initializeApp();
const db = getFirestore();

/**
 * 매월 1일 오전 4시에 실행되는 크론 작업
 * 완료된 챕터의 미완료 프로젝트를 자동으로 다음 챕터로 이관
 */
export const checkCompletedChapters = functions
  .region("asia-northeast3") // 서울 리전
  .pubsub.schedule("0 4 1 * *") // 매월 1일 오전 4시 (KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context: functions.EventContext) => {
    console.log("Starting monthly chapter completion check...");

    try {
      // 지난 달 완료된 챕터 찾기 (매월 1일 실행이므로 지난 달 챕터들)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      // 지난 달에 완료된 모든 챕터 찾기
      const chaptersSnapshot = await db
        .collection("chapters")
        .where("endDate", ">=", lastMonth)
        .where("endDate", "<", thisMonth)
        .get();

      const processedUsers = new Set<string>();
      let totalMigrations = 0;

      for (const chapterDoc of chaptersSnapshot.docs) {
        const chapterData = chapterDoc.data();
        const userId = chapterData.userId;
        const chapterId = chapterDoc.id;

        // 이미 처리된 사용자는 건너뛰기 (한 사용자당 한 번만 처리)
        if (processedUsers.has(userId)) {
          continue;
        }

        console.log(
          `Processing incomplete projects for user ${userId}, chapter ${chapterId}`
        );

        try {
          // 이월 설정 확인
          const carryOverEnabled = await isCarryOverEnabled(userId);

          if (carryOverEnabled) {
            // 미완료 프로젝트 자동 이관
            await autoMigrateIncompleteProjects(userId, chapterId);
            console.log(
              `Carry over enabled for user ${userId}. Migration processed.`
            );
          } else {
            console.log(
              `Carry over disabled for user ${userId}. Skipping migration.`
            );
          }

          // 활동 스냅샷 생성 (이월 설정과 관계없이 항상 실행)
          if (!processedUsers.has(userId)) {
            try {
              await createAllSnapshotsForUser(userId);
              console.log(`Successfully created snapshots for user ${userId}`);
            } catch (snapshotError) {
              console.error(
                `Failed to create snapshots for user ${userId}:`,
                snapshotError
              );
            }
          }

          processedUsers.add(userId);
          totalMigrations++;

          console.log(`Successfully processed user ${userId}`);
        } catch (error) {
          console.error(`Failed to process user ${userId}:`, error);
        }
      }

      console.log(
        `Monthly chapter check completed. Processed ${totalMigrations} users.`
      );
      return { success: true, processedUsers: totalMigrations };
    } catch (error) {
      console.error("Error in monthly chapter check:", error);
      throw error;
    }
  });

/**
 * 테스트용 HTTP 함수 (개발 중에만 사용)
 * https://your-project.cloudfunctions.net/testProjectMigration?userId=YOUR_USER_ID&chapterId=YOUR_CHAPTER_ID
 */
export const testProjectMigration = functions
  .region("asia-northeast3")
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      if (process.env.NODE_ENV === "production") {
        res.status(403).send("This function is only available in development");
        return;
      }

      const { userId, chapterId } = req.query;

      if (!userId || !chapterId) {
        res.status(400).send("Missing userId or chapterId parameter");
        return;
      }

      try {
        // 이월 설정 확인
        const carryOverEnabled = await isCarryOverEnabled(userId as string);

        if (carryOverEnabled) {
          await autoMigrateIncompleteProjects(
            userId as string,
            chapterId as string
          );
          res.json({
            success: true,
            message: `Migration completed for user ${userId}, chapter ${chapterId}`,
          });
        } else {
          res.json({
            success: true,
            message: `Carry over is disabled for user ${userId}. Migration skipped.`,
          });
        }
      } catch (error) {
        console.error("Test migration failed:", error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

/**
 * 비용 예상:
 * - Cloud Scheduler: $0.10/월 (1개 작업)
 * - Cloud Functions 호출: 무료 (월 2백만 건 한도 내)
 * - 컴퓨팅 시간: 거의 무료 (월 400K GB-seconds 한도 내)
 * - Pub/Sub: 거의 무료 (메시지 크기가 작음)
 *
 * 총 예상 비용: 월 $0.10 = 연간 $1.20
 *
 * 배포 방법:
 * 1. Firebase CLI 설치: npm install -g firebase-tools
 * 2. 프로젝트 초기화: firebase init functions
 * 3. 함수 배포: firebase deploy --only functions
 *
 * 모니터링:
 * - Firebase Console > Functions 탭에서 실행 로그 확인
 * - Cloud Logging에서 상세 로그 확인
 * - 실행 실패 시 이메일 알림 설정 가능
 */
