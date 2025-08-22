import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Monthly, Project } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 브라우저의 실제 로케일을 감지
 */
export const getBrowserLocale = (): string => {
  if (typeof window === "undefined") return "en-UK";

  const locale = navigator.language || navigator.languages?.[0] || "en-UK";

  return locale;
};

// 타임존 캐시 변수
let cachedTimeZone: string | null = null;

/**
 * 사용자의 타임존을 가져오는 함수 (캐싱)
 */
export const getUserTimeZone = (): string => {
  // 이미 캐시된 타임존이 있으면 반환
  if (cachedTimeZone) {
    return cachedTimeZone;
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 타임존을 캐시에 저장
  cachedTimeZone = timeZone;

  return timeZone;
};

/**
 * 타임존 캐시를 초기화하는 함수
 * 사용자 로그인 후 또는 설정 변경 시 호출
 */
export const resetTimeZoneCache = (): void => {
  cachedTimeZone = null;
};

/**
 * 언어 설정에 따른 날짜 로케일 결정
 */
export const getDateLocale = (language: "ko" | "en"): string => {
  switch (language) {
    case "ko":
      return "ko-KR";
    case "en":
      return "en-UK";
    default:
      return "en-UK";
  }
};

/**
 * 타임존 안전한 날짜 생성 함수
 * @param year 년도
 * @param month 월 (1-12)
 * @param day 일 (1-31)
 * @returns 해당 날짜의 Date 객체 (로컬 타임존 기준)
 */
export const createLocalDate = (
  year: number,
  month: number,
  day: number
): Date => {
  // month는 0-based이므로 1을 빼줌
  // 타임존 오프셋 추가하지 않고 순수하게 로컬 날짜로 생성
  return new Date(year, month - 1, day);
};

/**
 * 특정 월의 첫 번째 날짜 생성
 * @param year 년도
 * @param month 월 (1-12)
 * @returns 해당 월의 첫 번째 날짜
 */
export const getMonthStartDate = (year: number, month: number): Date => {
  return createLocalDate(year, month, 1);
};

/**
 * 특정 월의 마지막 날짜 생성
 * @param year 년도
 * @param month 월 (1-12)
 * @returns 해당 월의 마지막 날짜 (23:59:59)
 */
export const getMonthEndDate = (year: number, month: number): Date => {
  // 해당 월의 마지막 날을 23:59:59로 설정
  const lastDay = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날
  return new Date(year, month - 1, lastDay, 23, 59, 59);
};

/**
 * 날짜를 언어 설정에 맞는 형식으로 포맷팅 (현지 시간대 적용)
 * @param dateInput Date 객체, 문자열, Timestamp 또는 null/undefined
 * @param language 언어 설정 ("ko" | "en")
 * @returns 해당 언어의 날짜 형식 또는 "날짜 없음"
 */
export const formatDate = (
  dateInput: Date | string | any | null | undefined,
  language: "ko" | "en" = "ko"
): string => {
  if (!dateInput) return language === "ko" ? "날짜 없음" : "No date";

  let date: Date;

  // Timestamp 객체인 경우 (Firestore)
  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  // 언어 설정에 따른 로케일 결정
  const locale = getDateLocale(language);
  const timeZone = getUserTimeZone();

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: timeZone, // 현지 시간대 적용
  });
};

/**
 * 날짜를 짧은 형식으로 포맷팅 (언어 설정 기반)
 */
export const formatDateShort = (
  dateInput: Date | string | any | null | undefined,
  language: "ko" | "en" = "ko"
): string => {
  if (!dateInput) return language === "ko" ? "날짜 없음" : "No date";

  let date: Date;

  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  if (isNaN(date.getTime())) {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  // 언어 설정에 따른 로케일 결정
  const locale = getDateLocale(language);
  const timeZone = getUserTimeZone();

  return date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: timeZone, // 현지 시간대 적용
  });
};

/**
 * 날짜를 HTML input[type="date"]용 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
 */
export const formatDateForInput = (
  dateInput: Date | string | any | null | undefined
): string => {
  let date: Date;

  if (!dateInput) {
    return "";
  }

  // Firestore Timestamp 처리
  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "";
  }

  if (isNaN(date.getTime())) {
    return "";
  }

  // 로컬 시간 기준으로 YYYY-MM-DD 형식 생성
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 숫자 형식으로 포맷팅 (예: "2024-01-15")
 */
export const formatDateNumeric = (
  dateInput: Date | string | any | null | undefined,
  language: "ko" | "en" = "ko"
): string => {
  if (!dateInput) return language === "ko" ? "날짜 없음" : "No date";

  let date: Date;

  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  if (isNaN(date.getTime())) {
    return language === "ko" ? "날짜 없음" : "No date";
  }

  // 언어 설정에 따른 로케일 결정
  const locale = getDateLocale(language);
  const timeZone = getUserTimeZone();

  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timeZone, // 현지 시간대 적용
  });
};

// === 기존 프로젝트 상태 관련 함수들 ===

export function getProjectStatus(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
}): "scheduled" | "in_progress" | "completed" | "overdue" {
  const now = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  // 시작일이 미래인 경우
  if (startDate > now) {
    return "scheduled";
  }

  // 종료일이 지났지만 완료되지 않은 경우 (overdue)
  if (endDate < now) {
    // targetCount가 있고 completedTasks가 targetCount보다 작으면 overdue
    if (project.targetCount && project.completedTasks !== undefined) {
      if (project.completedTasks < project.targetCount) {
        return "overdue";
      }
    }
    // targetCount가 없거나 completedTasks가 targetCount 이상이면 completed
    return "completed";
  }

  // 진행 중인 경우
  return "in_progress";
}

export function isProjectInProgress(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
}): boolean {
  return getProjectStatus(project) === "in_progress";
}

export function isProjectScheduled(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
}): boolean {
  return getProjectStatus(project) === "scheduled";
}

export function isProjectCompleted(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
}): boolean {
  return getProjectStatus(project) === "completed";
}

export function isProjectOverdue(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
}): boolean {
  return getProjectStatus(project) === "overdue";
}

// 프로젝트 완료율을 동적으로 계산하는 함수
export function getProjectCompletionRate(project: {
  completedTasks?: number;
}): number {
  if (!project.completedTasks) return 0;
  return project.completedTasks;
}

/**
 * 프로젝트의 전체 진행률을 계산합니다.
 * @param project 프로젝트 객체
 * @returns 진행률 (0-1 사이의 값)
 */
export function calculateProjectProgress(project: Project): number {
  // 새로운 구조에서는 targetCount가 없으므로 completedTasks만 반환
  return project.completedTasks || 0;
}

// 프로젝트가 활성 상태인지 확인하는 함수
export function isProjectActive(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
}): boolean {
  const status = getProjectStatus(project);
  return status === "in_progress" || status === "overdue";
}

// === 먼슬리 상태 관련 함수들 (새로 추가) ===

export function getMonthlyStatus(monthly: {
  startDate: Date;
  endDate: Date;
}): "planned" | "in_progress" | "ended" {
  const now = new Date();
  const startDate = new Date(monthly.startDate);
  const endDate = new Date(monthly.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "ended";
  }
}

export function isMonthlyInProgress(monthly: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getMonthlyStatus(monthly) === "in_progress";
}

export function isMonthlyEnded(monthly: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getMonthlyStatus(monthly) === "ended";
}

export function isMonthlyPlanned(monthly: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getMonthlyStatus(monthly) === "planned";
}

/**
 * 먼슬리별 프로젝트 목표치 관련 유틸리티 함수들
 */

/**
 * 월간 계획의 전체 달성률을 계산합니다 (Key Results 기반).
 * @param monthly 월간 계획 객체
 * @returns 달성률 (0-1 사이의 값)
 */
export function calculateMonthlyProgress(monthly: Monthly): number {
  if (!monthly.keyResults || monthly.keyResults.length === 0) {
    return 0;
  }

  const completedCount = monthly.keyResults.filter(
    (kr) => kr.isCompleted
  ).length;
  return completedCount / monthly.keyResults.length;
}

/**
 * 월간 계획의 전체 Key Results 수를 계산합니다.
 * @param monthly 월간 계획 객체
 * @returns 전체 Key Results 수
 */
export function calculateMonthlyTargetCounts(monthly: Monthly): number {
  return monthly.keyResults?.length || 0;
}

/**
 * 월간 계획의 전체 완료된 Key Results 수를 계산합니다.
 * @param monthly 월간 계획 객체
 * @returns 전체 완료 수
 */
export function calculateMonthlyDoneCounts(monthly: Monthly): number {
  if (!monthly.keyResults || monthly.keyResults.length === 0) {
    return 0;
  }

  return monthly.keyResults.filter((kr) => kr.isCompleted).length;
}

/**
 * 월간 계획의 진행률 정보를 계산합니다.
 * @param monthly 월간 계획 객체
 * @returns 진행률 정보 객체
 */
export function calculateMonthlyProgressInfo(monthly: Monthly): {
  progress: number;
  targetCounts: number;
  doneCounts: number;
} {
  const targetCounts = calculateMonthlyTargetCounts(monthly);
  const doneCounts = calculateMonthlyDoneCounts(monthly);
  const progress = targetCounts > 0 ? doneCounts / targetCounts : 0;

  return {
    progress,
    targetCounts,
    doneCounts,
  };
}

/**
 * 새로운 구조에서는 프로젝트별 진행률 계산이 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @returns 항상 0 (새로운 구조에서는 사용하지 않음)
 */
export function calculateProjectMonthlyProgress(
  monthly: Monthly,
  projectId: string
): number {
  return 0;
}

/**
 * 새로운 구조에서는 프로젝트 연결 확인이 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @returns 항상 false (새로운 구조에서는 사용하지 않음)
 */
export function isProjectConnectedToMonthly(
  monthly: Monthly,
  projectId: string
): boolean {
  return false;
}

/**
 * 새로운 구조에서는 프로젝트 목표치가 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @returns 항상 null (새로운 구조에서는 사용하지 않음)
 */
export function getProjectGoalFromMonthly(
  monthly: Monthly,
  projectId: string
): any | null {
  return null;
}

/**
 * 새로운 구조에서는 프로젝트 연결이 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @param targetCount 먼슬리별 목표치
 * @returns 업데이트된 월간 계획 객체
 */
export function connectProjectToMonthly(
  monthly: Monthly,
  projectId: string,
  targetCount: number
): Monthly {
  // 새로운 구조에서는 프로젝트 연결이 필요 없으므로 그대로 반환
  return monthly;
}

/**
 * 새로운 구조에서는 프로젝트 연결 해제가 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @returns 업데이트된 월간 계획 객체
 */
export function disconnectProjectFromMonthly(
  monthly: Monthly,
  projectId: string
): Monthly {
  // 새로운 구조에서는 프로젝트 연결이 필요 없으므로 그대로 반환
  return monthly;
}

/**
 * 새로운 구조에서는 태스크 완료 시 진행률 업데이트가 필요 없음
 * @param monthly 월간 계획 객체
 * @param projectId 프로젝트 ID
 * @param increment 증가할 완료 수 (기본값: 1)
 * @returns 업데이트된 월간 계획 객체
 */
export function updateMonthlyProgress(
  monthly: Monthly,
  projectId: string,
  increment: number = 1
): Monthly {
  // 새로운 구조에서는 자동 진행률 업데이트가 필요 없으므로 그대로 반환
  return monthly;
}

/**
 * 새로운 구조에서는 기본 목표치 계산이 필요 없음
 * @param project 프로젝트 객체
 * @param monthlyStartDate 월간 계획 시작일
 * @param monthlyEndDate 월간 계획 종료일
 * @returns 항상 0 (새로운 구조에서는 사용하지 않음)
 */
export function calculateDefaultMonthlyTarget(
  project: Project,
  monthlyStartDate: Date,
  monthlyEndDate: Date
): number {
  // 새로운 구조에서는 프로젝트별 목표치가 필요 없으므로 0 반환
  return 0;
}

// Monthly 데이터를 AI 계획 생성용으로 추출하는 함수
export function extractMonthlyDataForAI(monthly: Monthly): {
  objective: string;
  objectiveDescription: string;
  keyResults: Array<{
    title: string;
    description?: string;
    targetCount?: number;
  }>;
  focusAreas: string[];
  reward?: string;
} {
  return {
    objective: monthly.objective,
    objectiveDescription: monthly.objectiveDescription || "",
    keyResults: monthly.keyResults.map((kr) => ({
      title: kr.title,
      description: kr.description,
      targetCount: kr.targetCount,
    })),
    focusAreas: monthly.focusAreas,
    reward: monthly.reward,
  };
}

// Monthly 기간을 주 단위로 계산하는 함수
export function calculateMonthlyWeeks(monthly: Monthly): number {
  const startDate =
    monthly.startDate instanceof Date
      ? monthly.startDate
      : (monthly.startDate as any).toDate();
  const endDate =
    monthly.endDate instanceof Date
      ? monthly.endDate
      : (monthly.endDate as any).toDate();

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.ceil(diffDays / 7);

  return diffWeeks;
}

// Monthly 데이터를 AI 프롬프트에 포함할 형태로 변환하는 함수
export function formatMonthlyDataForPrompt(monthly: Monthly): string {
  const data = extractMonthlyDataForAI(monthly);

  let prompt = `\n\n=== 선택된 Monthly 정보 ===\n`;
  prompt += `목표: ${data.objective}\n`;

  if (data.objectiveDescription) {
    prompt += `목표 설명: ${data.objectiveDescription}\n`;
  }

  if (data.keyResults.length > 0) {
    prompt += `\n주요 성과 지표 (Key Results):\n`;
    data.keyResults.forEach((kr, index) => {
      prompt += `${index + 1}. ${kr.title}`;
      if (kr.description) {
        prompt += ` - ${kr.description}`;
      }
      if (kr.targetCount) {
        prompt += ` (목표: ${kr.targetCount}회)`;
      }
      prompt += `\n`;
    });
  }

  if (data.focusAreas.length > 0) {
    prompt += `\n중점 영역: ${data.focusAreas.join(", ")}\n`;
  }

  if (data.reward) {
    prompt += `보상: ${data.reward}\n`;
  }

  prompt += `\n위 Monthly 정보를 바탕으로 구체적인 프로젝트와 태스크를 생성해주세요.`;
  prompt += `\n=== Monthly 정보 끝 ===\n`;

  return prompt;
}

/**
 * 노트의 자동 제목을 생성합니다.
 * @param archiveType 아카이브 타입 (monthly_note, project_note)
 * @param parentData 부모 데이터 (Monthly 또는 Project)
 * @param language 언어 ('ko' 또는 'en')
 * @returns 생성된 제목
 */
export function generateNoteTitle(
  archiveType: string,
  parentData: any,
  language: string = "ko"
): string {
  if (archiveType === "monthly_note" && parentData) {
    const year =
      parentData.startDate?.toDate?.()?.getFullYear() ||
      new Date(parentData.startDate).getFullYear();
    const month =
      parentData.startDate?.toDate?.()?.getMonth() ||
      new Date(parentData.startDate).getMonth();

    if (language === "ko") {
      return `${year}년 ${month + 1}월 먼슬리 노트`;
    } else {
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      return `${monthNames[month]} ${year} Monthly Note`;
    }
  } else if (archiveType === "project_note" && parentData) {
    if (language === "ko") {
      return `${parentData.title || "프로젝트"} 노트`;
    } else {
      return `${parentData.title || "Project"} Note`;
    }
  }

  // 기본값
  if (language === "ko") {
    return archiveType.includes("monthly") ? "먼슬리 노트" : "프로젝트 노트";
  } else {
    return archiveType.includes("monthly") ? "Monthly Note" : "Project Note";
  }
}
