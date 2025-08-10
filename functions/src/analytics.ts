// functions/src/analytics.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const trackApiUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) return;

  const { type, tokensUsed, cost } = data;

  await admin.firestore().collection("apiUsage").add({
    userId: context.auth.uid,
    type, // 'generation', 'refinement', etc.
    tokensUsed,
    estimatedCost: cost,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
});

// 월별 사용량 집계
export const getMonthlyUsage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "로그인 필요");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const snapshot = await admin
    .firestore()
    .collection("apiUsage")
    .where("userId", "==", context.auth.uid)
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
