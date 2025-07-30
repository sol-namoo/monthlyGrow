import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 프로젝트 상태를 계산합니다
 * @param project 프로젝트 객체
 * @returns "planned" | "in_progress" | "completed"
 */
export const getProjectStatus = (project: {
  startDate: Date | string;
  endDate: Date | string;
}): "planned" | "in_progress" | "completed" => {
  const today = new Date();
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);

  if (today < startDate) return "planned";
  if (today >= startDate && today <= endDate) return "in_progress";
  return "completed";
};

/**
 * 프로젝트가 진행 중인지 확인합니다
 */
export const isProjectInProgress = (project: {
  startDate: Date | string;
  endDate: Date | string;
}): boolean => {
  return getProjectStatus(project) === "in_progress";
};

/**
 * 프로젝트가 예정인지 확인합니다
 */
export const isProjectPlanned = (project: {
  startDate: Date | string;
  endDate: Date | string;
}): boolean => {
  return getProjectStatus(project) === "planned";
};

/**
 * 프로젝트가 완료되었는지 확인합니다
 */
export const isProjectCompleted = (project: {
  startDate: Date | string;
  endDate: Date | string;
}): boolean => {
  return getProjectStatus(project) === "completed";
};
