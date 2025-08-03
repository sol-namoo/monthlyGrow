// Cloud Functions for Firebase 크론 작업 예시
// functions/src/cronJobs.ts

import { functions } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { autoMigrateIncompleteProjects } from "./firebase-utils";

// Firebase Admin 초기화
initializeApp();
const db = getFirestore();

/**
 * 매월 1일 오전 4시에 실행되는 크론 작업
 * 완료된 루프의 미완료 프로젝트를 자동으로 다음 루프로 이관
 */
export const checkCompletedLoops = functions
  .region("asia-northeast3") // 서울 리전
  .pubsub.schedule("0 4 1 * *") // 매월 1일 오전 4시 (KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("Starting monthly loop completion check...");

    try {
      // 어제 날짜 계산
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999); // 어제 마지막 시간

      // 어제 완료된 모든 루프 찾기
      const loopsSnapshot = await db
        .collection("loops")
        .where("endDate", "<=", yesterday)
        .get();

      const processedUsers = new Set<string>();
      let totalMigrations = 0;

      for (const loopDoc of loopsSnapshot.docs) {
        const loopData = loopDoc.data();
        const userId = loopData.userId;
        const loopId = loopDoc.id;

        // 이미 처리된 사용자는 건너뛰기 (한 사용자당 한 번만 처리)
        if (processedUsers.has(userId)) {
          continue;
        }

        console.log(
          `Processing incomplete projects for user ${userId}, loop ${loopId}`
        );

        try {
          // 미완료 프로젝트 자동 이관
          await autoMigrateIncompleteProjects(userId, loopId);
          processedUsers.add(userId);
          totalMigrations++;

          console.log(`Successfully processed user ${userId}`);
        } catch (error) {
          console.error(`Failed to process user ${userId}:`, error);
        }
      }

      console.log(
        `Monthly loop check completed. Processed ${totalMigrations} users.`
      );
      return { success: true, processedUsers: totalMigrations };
    } catch (error) {
      console.error("Error in monthly loop check:", error);
      throw error;
    }
  });

/**
 * 테스트용 HTTP 함수 (개발 중에만 사용)
 * https://your-project.cloudfunctions.net/testProjectMigration?userId=YOUR_USER_ID&loopId=YOUR_LOOP_ID
 */
export const testProjectMigration = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    if (process.env.NODE_ENV === "production") {
      res.status(403).send("This function is only available in development");
      return;
    }

    const { userId, loopId } = req.query;

    if (!userId || !loopId) {
      res.status(400).send("Missing userId or loopId parameter");
      return;
    }

    try {
      await autoMigrateIncompleteProjects(userId as string, loopId as string);
      res.json({
        success: true,
        message: `Migration completed for user ${userId}, loop ${loopId}`,
      });
    } catch (error) {
      console.error("Test migration failed:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

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
