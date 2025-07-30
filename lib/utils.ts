import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === 날짜 포맷팅 유틸리티 ===

/**
 * 날짜를 한국어 형식으로 포맷팅 (시간 제외)
 * @param dateInput Date 객체, 문자열, Timestamp 또는 null/undefined
 * @returns "2024년 1월 15일" 형식의 문자열 또는 "날짜 없음"
 */
export const formatDate = (
  dateInput: Date | string | any | null | undefined
): string => {
  if (!dateInput) return "날짜 없음";

  let date: Date;

  // Timestamp 객체인 경우 (Firestore)
  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "날짜 없음";
  }

  // Invalid Date 체크
  if (isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * 날짜를 짧은 형식으로 포맷팅 (예: "1월 15일")
 */
export const formatDateShort = (
  dateInput: Date | string | any | null | undefined
): string => {
  if (!dateInput) return "날짜 없음";

  let date: Date;

  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "날짜 없음";
  }

  if (isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
};

/**
 * 날짜를 숫자 형식으로 포맷팅 (예: "2024-01-15")
 */
export const formatDateNumeric = (
  dateInput: Date | string | any | null | undefined
): string => {
  if (!dateInput) return "날짜 없음";

  let date: Date;

  if (dateInput && typeof dateInput.toDate === "function") {
    date = dateInput.toDate();
  } else if (typeof dateInput === "string") {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return "날짜 없음";
  }

  if (isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// === 기존 프로젝트 상태 관련 함수들 ===

export function getProjectStatus(project: {
  startDate: Date;
  endDate: Date;
}): "planned" | "in_progress" | "completed" {
  const now = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "completed";
  }
}

export function isProjectInProgress(project: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getProjectStatus(project) === "in_progress";
}

export function isProjectPlanned(project: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getProjectStatus(project) === "planned";
}

export function isProjectCompleted(project: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getProjectStatus(project) === "completed";
}

// === 루프 상태 관련 함수들 (새로 추가) ===

export function getLoopStatus(loop: {
  startDate: Date;
  endDate: Date;
}): "planned" | "in_progress" | "ended" {
  const now = new Date();
  const startDate = new Date(loop.startDate);
  const endDate = new Date(loop.endDate);

  if (now < startDate) {
    return "planned";
  } else if (now >= startDate && now <= endDate) {
    return "in_progress";
  } else {
    return "ended";
  }
}

export function isLoopInProgress(loop: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getLoopStatus(loop) === "in_progress";
}

export function isLoopEnded(loop: { startDate: Date; endDate: Date }): boolean {
  return getLoopStatus(loop) === "ended";
}

export function isLoopPlanned(loop: {
  startDate: Date;
  endDate: Date;
}): boolean {
  return getLoopStatus(loop) === "planned";
}
