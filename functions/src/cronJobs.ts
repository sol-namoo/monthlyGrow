// Cloud Functions for Firebase 크론 작업 예시
// functions/src/cronJobs.ts

import * as functions from "firebase-functions";
import { getFirestore } from "firebase-admin/firestore";
import { createAllSnapshotsForUser } from "./snapshot-utils";

// Firebase Admin 초기화 (이미 index.ts에서 초기화됨)
const db = getFirestore();

/**
 * 매월 1일 오전 4시에 실행되는 크론 작업
 * 완료된 먼슬리의 스냅샷을 자동으로 생성
 */
export const checkCompletedMonthlies = functions
  .region("asia-northeast3") // 서울 리전
  .pubsub.schedule("0 4 1 * *") // 매월 1일 오전 4시 (KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context: functions.EventContext) => {
    console.log("Starting monthly snapshot creation...");

    try {
      // 지난 달 완료된 먼슬리 찾기 (매월 1일 실행이므로 지난 달 먼슬리들)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      lastMonth.setHours(0, 0, 0, 0);

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      // 지난 달에 완료된 모든 먼슬리 찾기
      const monthliesSnapshot = await db
        .collection("monthlies")
        .where("endDate", ">=", lastMonth)
        .where("endDate", "<", thisMonth)
        .get();

      const processedUsers = new Set<string>();
      let totalSnapshots = 0;

      for (const monthlyDoc of monthliesSnapshot.docs) {
        const monthlyData = monthlyDoc.data();
        const userId = monthlyData.userId;

        // 이미 처리된 사용자는 건너뛰기 (한 사용자당 한 번만 처리)
        if (processedUsers.has(userId)) {
          continue;
        }

        console.log(`Creating snapshots for user ${userId}`);

        try {
          // 스냅샷 생성
          const snapshots = await createAllSnapshotsForUser(userId);
          console.log(
            `Successfully created ${snapshots.length} snapshots for user ${userId}`
          );

          processedUsers.add(userId);
          totalSnapshots += snapshots.length;

          console.log(`Successfully processed user ${userId}`);
        } catch (error) {
          console.error(`Failed to process user ${userId}:`, error);
        }
      }

      console.log(
        `Monthly snapshot creation completed. Processed ${processedUsers.size} users, created ${totalSnapshots} snapshots.`
      );
      return {
        success: true,
        processedUsers: processedUsers.size,
        totalSnapshots,
      };
    } catch (error) {
      console.error("Error in monthly snapshot creation:", error);
      throw error;
    }
  });

/**
 * 테스트용 HTTP 함수 (개발 중에만 사용)
 * https://your-project.cloudfunctions.net/testSnapshotCreation?userId=YOUR_USER_ID
 */
export const testSnapshotCreation = functions
  .region("asia-northeast3")
  .https.onRequest(
    async (req: functions.https.Request, res: functions.Response) => {
      if (process.env.NODE_ENV === "production") {
        res.status(403).send("This function is only available in development");
        return;
      }

      const { userId } = req.query;

      if (!userId) {
        res.status(400).send("Missing userId parameter");
        return;
      }

      try {
        const snapshots = await createAllSnapshotsForUser(userId as string);
        res.json({
          success: true,
          message: `Snapshot creation completed for user ${userId}`,
          snapshotsCreated: snapshots.length,
          snapshots: snapshots.map((s) => ({
            id: s.id,
            yearMonth: s.yearMonth,
            statistics: s.statistics,
          })),
        });
      } catch (error) {
        console.error("Test snapshot creation failed:", error);
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
 *
 * 주요 변경사항:
 * - 프로젝트 이관 로직 제거 (현재 구조에서는 불필요)
 * - 스냅샷 생성만 수행 (새로운 MonthlySnapshot 구조 사용)
 * - 실패 패턴 분석 데이터 포함
 */
