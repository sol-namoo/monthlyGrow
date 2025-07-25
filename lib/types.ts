// types.ts (updated for new structure)

export interface Area {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: "active" | "archived";
  createdAt: Date;
}

export interface Resource {
  id: string;
  userId: string;
  name: string;
  areaId?: string;
  description: string;
  status: "active" | "archived";
  createdAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  areaId: string;
  title: string;
  description: string;
  targetCount: number;
  doneCount: number;
  status: "active" | "archived";
  loopIds: string[];
  createdAt: Date;
  dueDate: Date;
  addedMidway?: boolean;
  progress: number;
  total: number;
  retrospectiveId?: string;
  note?: string; // 단일 자유 노트
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  date: Date;
  duration: number;
  done: boolean;
  status?: "active" | "archived";
  createdAt: Date;
}

export interface Loop {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  status: "in_progress" | "ended";
  focusAreas: string[];
  projectIds: string[];
  reward?: string;
  createdAt: Date;
  completed?: boolean;
  areas: string[];
  doneCount: number;
  targetCount: number;
  retrospectiveId?: string;
  note?: string; // 단일 자유 노트
}

export interface Snapshot {
  id: string;
  loopId: string;
  projectId: string;
  year: number;
  month: number;
  snapshotDate: Date;
  doneCount: number;
  targetCount: number;
  reward: string;
}

export interface OfficialRetrospective {
  id: string;
  loopId?: string;
  projectId?: string;
  userId: string;
  content?: string; // 자유 회고 포함
  createdAt: string;

  // 루프용 템플릿
  bestMoment?: string;
  routineAdherence?: string;
  unexpectedObstacles?: string;
  nextLoopApplication?: string;

  // 프로젝트용 템플릿
  goalAchieved?: string;
  memorableTask?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;

  // 공통 정보
  userRating?: number;
  bookmarked?: boolean;
  title?: string;
  summary?: string;
}
