export interface Area {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon?: string; // 아이콘 ID
  color?: string; // 색상 코드
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  userId: string;
  name: string;
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  areaColor?: string; // Area 색상 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  description: string;
  text?: string; // 리소스 텍스트 내용
  link?: string; // 리소스 링크
  createdAt: Date;
  updatedAt: Date;
}

export interface ConnectedLoop {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  progress: number;
  total: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  loopId?: string; // 현재 연결된 루프 ID (legacy)
  connectedLoops?: ConnectedLoop[]; // 연결된 루프 정보
  addedMidway?: boolean; // 루프 중간에 추가된 프로젝트 여부
  retrospective?: Retrospective;
  notes: Note[];
  // tasks는 서브컬렉션으로 관리: projects/{projectId}/tasks/{taskId}

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "completed"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  date: Date;
  duration: number; // 소요일수
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Loop {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  focusAreas: string[]; // Area ID 배열
  projectIds: string[]; // Project ID 배열
  reward?: string;
  createdAt: Date;
  updatedAt: Date;
  doneCount: number;
  targetCount: number;
  retrospective?: Retrospective; // 루프 회고
  note?: Note; // 루프 노트 (선택)

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
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

export interface Retrospective {
  id: string;
  userId: string;
  loopId?: string; // 루프 회고인 경우
  projectId?: string; // 프로젝트 회고인 경우
  createdAt: Date;
  updatedAt: Date;
  content?: string; // 자유 회고

  // 루프용 필드
  bestMoment?: string;
  routineAdherence?: string;
  unexpectedObstacles?: string;
  nextLoopApplication?: string;

  // 프로젝트용 필드
  goalAchieved?: string;
  memorableTask?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;

  // 공통
  userRating?: number; // 별점 (1~5)
  bookmarked?: boolean;
  title?: string;
  summary?: string;
}

// 자유 메모용 Note 컬렉션
export interface Note {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 관련 타입 정의
export interface UserProfile {
  displayName: string;
  email: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettings {
  defaultReward?: string;
  defaultRewardEnabled: boolean;
  carryOver: boolean;
  aiRecommendations: boolean;
  notifications: boolean;
  theme: "light" | "dark" | "system";
  language: "ko" | "en";
  // Firebase Auth에서 제공하는 정보는 제외:
  // - email (user.email)
  // - displayName (user.displayName)
  // - photoURL (user.photoURL)
}

export interface UserPreferences {
  timezone: string;
  dateFormat: string;
  weeklyStartDay: "monday" | "sunday";
}

export interface User {
  id: string;
  profile: UserProfile;
  settings: UserSettings;
  preferences: UserPreferences;
}

// Archive는 Loop나 Project의 완료된 상태를 나타내는 뷰
// 별도 컬렉션이 아닌 기존 데이터의 필터링된 뷰
