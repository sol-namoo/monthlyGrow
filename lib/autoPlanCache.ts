// utils/planCache.ts
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { GeneratedPlan } from "./types";

interface CachedPlan {
  plan: GeneratedPlan;
  hash: string;
  createdAt: Date;
  usageCount: number;
}

export class PlanCache {
  private static CACHE_DURATION = 24 * 60 * 60 * 1000; // 24시간

  static generateHash(userGoal: string, constraints: any): string {
    const input = JSON.stringify({ userGoal, constraints });
    return btoa(input)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32);
  }

  static async getCachedPlan(
    userGoal: string,
    constraints: any
  ): Promise<GeneratedPlan | null> {
    const hash = this.generateHash(userGoal, constraints);
    const db = getFirestore();

    try {
      const cacheDoc = await getDoc(doc(db, "planCache", hash));

      if (cacheDoc.exists()) {
        const cached = cacheDoc.data() as CachedPlan;
        const now = new Date();

        // 캐시가 유효한지 확인
        if (now.getTime() - cached.createdAt.getTime() < this.CACHE_DURATION) {
          // 사용 횟수 증가
          await setDoc(
            doc(db, "planCache", hash),
            {
              ...cached,
              usageCount: cached.usageCount + 1,
            },
            { merge: true }
          );

          return cached.plan;
        }
      }
    } catch (error) {
      // 캐시 조회 실패
    }

    return null;
  }

  static async cachePlan(
    userGoal: string,
    constraints: any,
    plan: GeneratedPlan
  ): Promise<void> {
    const hash = this.generateHash(userGoal, constraints);
    const db = getFirestore();

    try {
      await setDoc(doc(db, "planCache", hash), {
        plan,
        hash,
        createdAt: new Date(),
        usageCount: 1,
      });
    } catch (error) {
      // 캐시 저장 실패
    }
  }
}
