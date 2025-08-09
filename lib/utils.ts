import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 브라우저의 실제 로케일을 감지
 */
export const getBrowserLocale = (): string => {
  if (typeof window === "undefined") return "en-UK";

  const locale = navigator.language || navigator.languages?.[0] || "en-UK";

  // 개발 환경에서 로케일 정보 출력
  if (process.env.NODE_ENV === "development") {
    console.log("Browser locale detected:", locale);
  }

  return locale;
};

/**
 * 사용자의 현재 시간대를 감지
 */
export const getUserTimeZone = (): string => {
  if (typeof window === "undefined") return "UTC";

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 개발 환경에서 시간대 정보 출력
  if (process.env.NODE_ENV === "development") {
    console.log("User timezone detected:", timeZone);
  }

  return timeZone;
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
  target?: number;
}): "scheduled" | "in_progress" | "completed" | "overdue" {
  const now = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  // 시작일이 미래인 경우
  if (startDate > now) {
    return "scheduled";
  }

  // 완료율 계산
  const completionRate =
    project.target && project.completedTasks
      ? (project.completedTasks / project.target) * 100
      : 0;

  // 완료된 경우 (완료율이 100% 이상)
  if (completionRate >= 100) {
    return "completed";
  }

  // 종료일이 지났지만 완료되지 않은 경우
  if (endDate < now && completionRate < 100) {
    return "overdue";
  }

  // 진행 중인 경우
  return "in_progress";
}

export function isProjectInProgress(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  target?: number;
}): boolean {
  return getProjectStatus(project) === "in_progress";
}

export function isProjectScheduled(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  target?: number;
}): boolean {
  return getProjectStatus(project) === "scheduled";
}

export function isProjectCompleted(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  target?: number;
}): boolean {
  return getProjectStatus(project) === "completed";
}

export function isProjectOverdue(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  target?: number;
}): boolean {
  return getProjectStatus(project) === "overdue";
}

// 프로젝트 완료율을 동적으로 계산하는 함수
export function getProjectCompletionRate(project: {
  completedTasks?: number;
  target?: number;
}): number {
  if (!project.target || project.target === 0) return 0;
  if (!project.completedTasks) return 0;
  return Math.round((project.completedTasks / project.target) * 100);
}

// 프로젝트가 활성 상태인지 확인하는 함수
export function isProjectActive(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  target?: number;
}): boolean {
  const status = getProjectStatus(project);
  return status === "in_progress" || status === "overdue";
}

// === 챕터 상태 관련 함수들 (새로 추가) ===

export function getChapterStatus(chapter: {
  startDate: Date;
  endDate: Date;
}): "planned" | "in_progress" | "ended" {
  const now = new Date();
  const startDate = new Date(chapter.startDate);
  const endDate = new Date(chapter.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "ended";
  }
}

export function isChapterInProgress(chapter: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getChapterStatus(chapter) === "in_progress";
}

export function isChapterEnded(chapter: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getChapterStatus(chapter) === "ended";
}

export function isChapterPlanned(chapter: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getChapterStatus(chapter) === "planned";
}
