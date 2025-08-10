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

// 챕터별 프로젝트 목표치 인터페이스
export interface ConnectedProjectGoal {
  projectId: string;
  chapterTargetCount: number; // 이번 루프에서 목표로 하는 태스크 수
  chapterDoneCount: number; // 이번 루프에서 실제 완료한 태스크 수
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: "repetitive" | "task_based"; // 프로젝트 유형
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  target: string; // 목표 설명 (작업형: "완성된 이력서 1부", 반복형: "주요 개념 정리")
  targetCount?: number; // 반복형일 때만 사용 (목표 개수)
  completedTasks: number; // 전체 실제 완료된 태스크 수
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  chapterId?: string; // 현재 연결된 챕터 ID (legacy)
  connectedChapters?: string[]; // 연결된 챕터 ID 배열

  addedMidway?: boolean; // 챕터 중간에 추가된 프로젝트 여부
  retrospective?: Retrospective;
  notes: Note[];
  // tasks는 서브컬렉션으로 관리: projects/{projectId}/tasks/{taskId}

  // 미완료 프로젝트 이관 관련 필드
  isCarriedOver?: boolean; // 이전 챕터에서 이관된 프로젝트 여부
  originalChapterId?: string; // 원래 챕터 ID (이관된 경우)
  carriedOverAt?: Date; // 이관된 날짜
  migrationStatus?: "pending" | "migrated" | "ignored"; // 이관 상태

  // 프로젝트 상태는 동적으로 계산됨 (DB에 저장되지 않음)
  // getProjectStatus() 함수를 사용하여 실시간 계산
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

export interface Chapter {
  id: string;
  userId: string;
  title: string;
  startDate: Date;
  endDate: Date;
  focusAreas: string[]; // Area ID 배열
  reward?: string;
  createdAt: Date;
  updatedAt: Date;
  doneCount: number; // 전체 완료 수 (legacy - 하위 호환성)
  targetCount: number; // 전체 목표 수 (legacy - 하위 호환성)
  connectedProjects?: ConnectedProjectGoal[]; // 챕터별 프로젝트 목표치
  retrospective?: Retrospective; // 챕터 회고
  note?: Note; // 챕터 노트 (선택)

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

export interface Snapshot {
  id: string;
  chapterId: string;
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
  chapterId?: string; // 챕터 회고인 경우
  projectId?: string; // 프로젝트 회고인 경우
  createdAt: Date;
  updatedAt: Date;
  content?: string; // 자유 회고

  // 챕터용 필드
  bestMoment?: string;
  routineAdherence?: string;
  unexpectedObstacles?: string;
  nextChapterApplication?: string;

  // 프로젝트용 필드
  goalAchieved?: string;
  memorableTask?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;

  // 스마트 회고 필드 (완료율 90% 미만 시)
  incompleteAnalysis?: {
    planningNeedsImprovement?: boolean;
    executionNeedsImprovement?: boolean;
    otherReason?: string;
  };

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

// AI 계획 생성 관련 타입들
export interface PlanConstraints {
  projectWeeks?: number; // 프로젝트 기간 (주) - 설정되지 않으면 maxProjectWeeks 사용
  maxProjectWeeks?: number; // 프로젝트 최대 기간 (주) - 제약사항이 없을 때 사용
  dailyTimeSlots?: {
    minutesPerDay?: number; // 일일 가용 시간 (분) - 설정되지 않으면 maxMinutesPerDay 사용
    maxMinutesPerDay?: number; // 일일 최대 가용 시간 (분) - 제약사항이 없을 때 사용
    daysPerWeek?: number; // 주당 가능한 일수 - 설정되지 않으면 maxDaysPerWeek 사용
    maxDaysPerWeek?: number; // 주당 최대 가능한 일수 - 제약사항이 없을 때 사용
    preferredTimes?: string[]; // 선호 시간대
  };
  difficulty?: "beginner" | "intermediate" | "advanced"; // 현재 수준
  focusIntensity?: "light" | "moderate" | "intensive"; // 진행 강도
  budget?: {
    min: number;
    max: number;
    currency: "KRW" | "USD";
  };
  existingSkills?: string[]; // 기존 보유 스킬/경험
  preferredActivityStyle?: "visual" | "auditory" | "kinesthetic" | "reading"; // 활동 스타일
}

export interface GeneratedPlan {
  areas: Array<{
    name: string;
    description: string;
    icon: string;
    color: string;
    existingId?: string; // 기존 Areas와 매칭된 경우 ID
  }>;
  projects: Array<{
    title: string;
    description: string;
    category: "repetitive" | "task_based";
    areaName: string;
    target: string; // 목표 설명 (작업형: "완성된 이력서 1부", 반복형: "주요 개념 정리")
    targetCount?: number; // 반복형일 때만 사용 (목표 개수)
    durationWeeks: number;
    estimatedDailyTime: number; // 분 단위
    difficulty: string;
    tasks: Array<{
      title: string;
      description: string;
      duration: number;
      requirements: string[];
      resources: string[];
      estimatedTime: number; // 분 단위
      prerequisites?: string[];
    }>;
    milestones: Array<{
      week: number;
      description: string;
      successMetric: string;
    }>;
    resources: Array<{
      type: "book" | "website" | "app" | "tool" | "course";
      name: string;
      description: string;
      url?: string;
      cost?: number;
      priority: "essential" | "recommended" | "optional";
    }>;
  }>;
  timeline: {
    totalWeeks: number;
    weeklySchedule: Array<{
      week: number;
      focus: string;
      dailyTasks: string[];
      timeAllocation: Record<string, number>; // 프로젝트별 시간 배분
    }>;
  };
  successMetrics: Array<{
    metric: string;
    measurementMethod: string;
    targetValue: string;
    checkpoints: number[]; // 주차별 체크포인트
  }>;
}

// Firebase Functions 응답 타입 정의
export interface GeneratePlanResponse {
  success: boolean;
  plan?: GeneratedPlan;
  error?: string;
  originalResponse?: string;
  existingAreas?: number; // 기존 Areas 재사용 개수
}

// AI 계획 생성 요청 타입
export interface GeneratePlanRequest {
  userInput: string;
  constraints?: PlanConstraints;
  existingAreas?: Area[];
}

// Archive는 Chapter나 Project의 완료된 상태를 나타내는 뷰
// 별도 컬렉션이 아닌 기존 데이터의 필터링된 뷰
