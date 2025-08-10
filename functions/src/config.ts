/**
 * functions/src/config.ts
 *
 * monthlyGrow 서버에서 사용할 기본 설정값
 * (민감정보는 firebase functions:secrets:set 사용)
 */

export const CONFIG = {
  defaults: {
    durationWeeks: 4, // 기본 목표 기간 (주 단위)
    dailyHours: 1.5, // 기본 하루 가용 시간(시간)
    weeklyDays: 5, // 기본 주당 작업일 수
    maxTaskMinutes: 60, // 기본 태스크 최대 시간(분)
  },
  firestore: {
    collections: {
      areas: "areas",
      projects: "projects",
      tasks: "tasks",
      loops: "loops",
    },
  },
  // 로깅 레벨
  logLevel: "info" as "debug" | "info" | "warn" | "error",
};
