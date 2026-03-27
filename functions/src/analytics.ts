// functions/src/analytics.ts
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { db } from "./admin";

export const trackApiUsage = onCall(async (request) => {
  if (!request.auth) return;

  const { type, tokensUsed, cost } = request.data as {
    type?: string;
    tokensUsed?: number;
    cost?: number;
  };

  await db.collection("apiUsage").add({
    userId: request.auth.uid,
    type,
    tokensUsed,
    estimatedCost: cost,
    timestamp: FieldValue.serverTimestamp(),
  });
});

// 월별 사용량 집계
export const getMonthlyUsage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "로그인 필요");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const snapshot = await db
    .collection("apiUsage")
    .where("userId", "==", request.auth.uid)
    .where("timestamp", ">=", startOfMonth)
    .get();

  let totalCost = 0;
  let totalRequests = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    totalCost += data.estimatedCost || 0;
    totalRequests += 1;
  });

  return {
    totalCost,
    totalRequests,
    period: {
      start: startOfMonth,
      end: now,
    },
  };
});
