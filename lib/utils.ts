import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Chapter, ConnectedProjectGoal, Project } from "./types";

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

  // 개발 환경에서 시간대 정보 출력 (한 번만)
  if (process.env.NODE_ENV === "development") {
    console.log("User timezone detected:", timeZone);
  }

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

  // 완료율 계산
  const completionRate =
    project.targetCount && project.completedTasks
      ? (project.completedTasks / project.targetCount) * 100
      : 0;

  // 완료된 경우 (완료율이 100% 이상)
  if (completionRate >= 100) {
    return "completed";
  }

  // 종료일이 지났지만 완료되지 않은 경우
  if (endDate < now && completionRate < 100) {
    return "overdue";
  }

  // 시작일이 미래인 경우
  if (startDate > now) {
    return "scheduled";
  }

  // 진행 중인 경우
  return "in_progress";
}

export function isProjectInProgress(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
}): boolean {
  return getProjectStatus(project) === "in_progress";
}

export function isProjectScheduled(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
}): boolean {
  return getProjectStatus(project) === "scheduled";
}

export function isProjectCompleted(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
}): boolean {
  return getProjectStatus(project) === "completed";
}

export function isProjectOverdue(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
}): boolean {
  return getProjectStatus(project) === "overdue";
}

// 프로젝트 완료율을 동적으로 계산하는 함수
export function getProjectCompletionRate(project: {
  completedTasks?: number;
  targetCount?: number;
}): number {
  if (!project.targetCount || project.targetCount === 0) return 0;
  if (!project.completedTasks) return 0;
  return Math.round((project.completedTasks / project.targetCount) * 100);
}

/**
 * 프로젝트의 전체 진행률을 계산합니다.
 * @param project 프로젝트 객체
 * @returns 진행률 (0-1 사이의 값)
 */
export function calculateProjectProgress(project: Project): number {
  if (!project.targetCount || project.targetCount === 0) {
    return 0;
  }
  return project.completedTasks / project.targetCount;
}

// 프로젝트가 활성 상태인지 확인하는 함수
export function isProjectActive(project: {
  startDate: Date;
  endDate: Date;
  completedTasks?: number;
  targetCount?: number;
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

/**
 * 챕터별 프로젝트 목표치 관련 유틸리티 함수들
 */

/**
 * 챕터의 전체 달성률을 계산합니다.
 * @param chapter 챕터 객체
 * @returns 달성률 (0-1 사이의 값)
 */
export function calculateChapterProgress(chapter: Chapter): number {
  if (!chapter.connectedProjects || chapter.connectedProjects.length === 0) {
    return 0;
  }

  const totalTarget = chapter.connectedProjects.reduce(
    (sum, project) => sum + project.chapterTargetCount,
    0
  );
  const totalDone = chapter.connectedProjects.reduce(
    (sum, project) => sum + project.chapterDoneCount,
    0
  );

  return totalTarget > 0 ? totalDone / totalTarget : 0;
}

/**
 * 챕터의 전체 목표 수를 계산합니다.
 * @param chapter 챕터 객체
 * @returns 전체 목표 수
 */
export function calculateChapterTargetCounts(chapter: Chapter): number {
  if (!chapter.connectedProjects || chapter.connectedProjects.length === 0) {
    return 0;
  }

  return chapter.connectedProjects.reduce(
    (sum, project) => sum + project.chapterTargetCount,
    0
  );
}

/**
 * 챕터의 전체 완료 수를 계산합니다.
 * @param chapter 챕터 객체
 * @returns 전체 완료 수
 */
export function calculateChapterDoneCounts(chapter: Chapter): number {
  if (!chapter.connectedProjects || chapter.connectedProjects.length === 0) {
    return 0;
  }

  return chapter.connectedProjects.reduce(
    (sum, project) => sum + project.chapterDoneCount,
    0
  );
}

/**
 * 챕터의 진행률 정보를 계산합니다.
 * @param chapter 챕터 객체
 * @returns 진행률 정보 객체
 */
export function calculateChapterProgressInfo(chapter: Chapter): {
  progress: number;
  targetCounts: number;
  doneCounts: number;
} {
  const targetCounts = calculateChapterTargetCounts(chapter);
  const doneCounts = calculateChapterDoneCounts(chapter);
  const progress = targetCounts > 0 ? doneCounts / targetCounts : 0;

  return {
    progress,
    targetCounts,
    doneCounts,
  };
}

/**
 * 특정 프로젝트의 챕터별 진행률을 계산합니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @returns 진행률 (0-1 사이의 값), 프로젝트가 연결되지 않은 경우 0
 */
export function calculateProjectChapterProgress(
  chapter: Chapter,
  projectId: string
): number {
  if (!chapter.connectedProjects) {
    return 0;
  }

  const projectGoal = chapter.connectedProjects.find(
    (goal) => goal.projectId === projectId
  );

  if (!projectGoal || projectGoal.chapterTargetCount === 0) {
    return 0;
  }

  return projectGoal.chapterDoneCount / projectGoal.chapterTargetCount;
}

/**
 * 프로젝트가 챕터에 연결되어 있는지 확인합니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @returns 연결 여부
 */
export function isProjectConnectedToChapter(
  chapter: Chapter,
  projectId: string
): boolean {
  return (
    chapter.connectedProjects?.some((goal) => goal.projectId === projectId) ??
    false
  );
}

/**
 * 챕터에서 프로젝트 목표치를 가져옵니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @returns 프로젝트 목표치 객체, 연결되지 않은 경우 null
 */
export function getProjectGoalFromChapter(
  chapter: Chapter,
  projectId: string
): ConnectedProjectGoal | null {
  return (
    chapter.connectedProjects?.find((goal) => goal.projectId === projectId) ??
    null
  );
}

/**
 * 챕터에 프로젝트를 연결하고 목표치를 설정합니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @param targetCount 챕터별 목표치
 * @returns 업데이트된 챕터 객체
 */
export function connectProjectToChapter(
  chapter: Chapter,
  projectId: string,
  targetCount: number
): Chapter {
  const existingGoal = chapter.connectedProjects?.find(
    (goal) => goal.projectId === projectId
  );

  if (existingGoal) {
    // 기존 목표치 업데이트
    existingGoal.chapterTargetCount = targetCount;
    return chapter;
  }

  // 새로운 프로젝트 연결
  const newGoal: ConnectedProjectGoal = {
    projectId,
    chapterTargetCount: targetCount,
    chapterDoneCount: 0,
  };

  return {
    ...chapter,
    connectedProjects: [...(chapter.connectedProjects || []), newGoal],
  };
}

/**
 * 챕터에서 프로젝트 연결을 해제합니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @returns 업데이트된 챕터 객체
 */
export function disconnectProjectFromChapter(
  chapter: Chapter,
  projectId: string
): Chapter {
  return {
    ...chapter,
    connectedProjects:
      chapter.connectedProjects?.filter(
        (goal) => goal.projectId !== projectId
      ) || [],
  };
}

/**
 * 태스크 완료 시 챕터별 진행률을 업데이트합니다.
 * @param chapter 챕터 객체
 * @param projectId 프로젝트 ID
 * @param increment 증가할 완료 수 (기본값: 1)
 * @returns 업데이트된 챕터 객체
 */
export function updateChapterProgress(
  chapter: Chapter,
  projectId: string,
  increment: number = 1
): Chapter {
  if (!chapter.connectedProjects) {
    return chapter;
  }

  const updatedProjects = chapter.connectedProjects.map((goal) => {
    if (goal.projectId === projectId) {
      return {
        ...goal,
        chapterDoneCount: Math.min(
          goal.chapterDoneCount + increment,
          goal.chapterTargetCount
        ),
      };
    }
    return goal;
  });

  return {
    ...chapter,
    connectedProjects: updatedProjects,
  };
}

/**
 * 챕터별 목표치의 기본값을 계산합니다.
 * 프로젝트의 전체 목표치를 챕터 기간에 비례하여 분배합니다.
 * @param project 프로젝트 객체
 * @param chapterStartDate 챕터 시작일
 * @param chapterEndDate 챕터 종료일
 * @returns 챕터별 목표치
 */
export function calculateDefaultChapterTarget(
  project: Project,
  chapterStartDate: Date,
  chapterEndDate: Date
): number {
  const projectStart = new Date(project.startDate);
  const projectEnd = new Date(project.endDate);
  const chapterStart = new Date(chapterStartDate);
  const chapterEnd = new Date(chapterEndDate);

  // 프로젝트와 챕터의 겹치는 기간 계산
  const overlapStart = new Date(
    Math.max(projectStart.getTime(), chapterStart.getTime())
  );
  const overlapEnd = new Date(
    Math.min(projectEnd.getTime(), chapterEnd.getTime())
  );

  if (overlapEnd <= overlapStart) {
    return 0; // 겹치는 기간이 없음
  }

  // 전체 프로젝트 기간
  const totalProjectDays =
    (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
  // 겹치는 기간
  const overlapDays =
    (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);

  // 비례하여 목표치 계산
  const ratio = overlapDays / totalProjectDays;
  // project.target은 string이므로 숫자로 변환 필요
  const targetNumber = typeof project.target === "number" ? project.target : 0;
  return Math.round(targetNumber * ratio);
}
