export interface Area {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon?: string; // 아이콘 ID
  color?: string; // 색상 코드
  counts?: {
    projectCount: number;
    resourceCount: number;
  };
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

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: "repetitive" | "task_based"; // 프로젝트 유형
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  completedTasks: number; // 전체 실제 완료된 태스크 수
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  retrospective?: {
    id: string;
    userId: string;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any;
  };
  notes?: {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }[];

  // Monthly 연결 관련
  connectedMonthlies?: string[]; // 연결된 Monthly ID 배열

  // 프로젝트 목표 관련
  target?: string; // 목표 설명 (예: "운동", "독서")
  targetCount?: number; // 목표 수치 (기본값: 1)

  // 이관 관련
  isCarriedOver?: boolean;
  originalMonthlyId?: string;
  carriedOverAt?: Date;
  migrationStatus?: "pending" | "migrated";

  // 태스크 통계 (denormalized)
  taskCounts?: {
    total: number;
    completed: number;
    pending: number;
  };
  timeStats?: {
    completedTime: number; // 완료된 태스크들의 duration 합계
    remainingTime: number; // 남은 태스크들의 duration 합계
  };

  // tasks는 서브컬렉션으로 관리: projects/{projectId}/tasks/{taskId}

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
  completedAt?: Date; // 완료된 날짜 (done이 true일 때만 설정)
  createdAt: Date;
  updatedAt: Date;
}

// 먼슬리별 완료된 태스크 추적
export interface MonthlyCompletedTasks {
  id: string;
  userId: string;
  yearMonth: string; // "2024-08" 형태
  completedTasks: {
    taskId: string;
    projectId: string;
    completedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Key Result 인터페이스
export interface KeyResult {
  id: string;
  title: string; // "운동 총 8회"
  description?: string; // 상세 설명 (선택사항)
  isCompleted: boolean; // 사용자가 OX 체크
  targetCount?: number; // 목표 수치
  completedCount?: number; // 완료 수치
}

/** 먼슬리 연결 프로젝트 (SSOT: Monthly.connectedProjects) */
export interface ConnectedProjectGoal {
  projectId: string;
  monthlyTargetCount?: number;
  monthlyDoneCount?: number;
}

export interface Monthly {
  id: string;
  userId: string;
  objective: string; // OKR Objective (간단한 한 줄)
  objectiveDescription?: string; // Objective 상세 설명 (선택사항)
  startDate: Date;
  endDate: Date;
  focusAreas: string[]; // Area ID 배열
  keyResults: KeyResult[]; // Key Results
  reward?: string;
  createdAt: Date;
  updatedAt: Date;
  retrospective?: {
    id: string;
    userId: string;
    monthlyId: string;
    createdAt: Date;
    updatedAt: Date;
    [key: string]: any;
  }; // 먼슬리 회고
  note?: string; // 먼슬리 노트 (선택)
  /** 연결된 프로젝트 (SSOT). 목표치·진행률 포함 */
  connectedProjects?: ConnectedProjectGoal[];
  /** @deprecated connectedProjects로 통일. 읽기 호환용 */
  quickAccessProjects?: string[];

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

// Key Result 스냅샷 (월말 스냅샷용)
export interface KeyResultSnapshot {
  id: string;
  title: string;
  description?: string; // 상세 설명 (선택사항)
  isCompleted: boolean;
  targetCount?: number;
  completedCount?: number;
  // 스냅샷 시점의 상태를 그대로 보존
}

// 월간 스냅샷 (월말 자동 생성)
export interface MonthlySnapshot {
  id: string;
  userId: string;
  yearMonth: string; // "2024-08"
  snapshotDate: Date;

  // 먼슬리 정보
  monthly: {
    id: string;
    objective: string;
    objectiveDescription?: string;
    keyResults: KeyResultSnapshot[];
  };

  // 완료된 태스크들 (프로젝트별 그룹핑)
  completedTasks: {
    projectId: string;
    projectTitle: string;
    areaName: string;
    tasks: {
      taskId: string;
      title: string;
      completedAt: Date;
    }[];
  }[];

  // 통계 정보
  statistics: {
    totalCompletedTasks: number;
    totalProjects: number;
    totalAreas: number;
    keyResultsCompleted: number;
    keyResultsTotal: number;
  };

  // 실패 분석 데이터 (새로 추가)
  failureAnalysis?: {
    totalKeyResults: number;
    failedKeyResults: number;
    failureRate: number;
    failureReasons: {
      reason: string;
      label: string;
      count: number;
      percentage: number;
    }[];
    failedKeyResultsDetail: {
      keyResultId: string;
      keyResultTitle: string;
      reason: string;
      customReason?: string;
    }[];
  };
}

// 기존 Snapshot 인터페이스 제거 (legacy)
// export interface Snapshot {
//   id: string;
//   monthlyId: string;
//   projectId: string;
//   year: number;
//   month: number;
//   snapshotDate: Date;
//   doneCount: number;
//   targetCount: number;
//   reward: string;
// }

// 통합 아카이브 컬렉션
export interface UnifiedArchive {
  id: string;
  userId: string;
  type:
    | "monthly_retrospective"
    | "monthly_note"
    | "project_retrospective"
    | "project_note";
  parentId: string; // monthlyId 또는 projectId
  parentType: "monthly" | "project";
  title: string;
  content: string;
  // Parent 정보 (denormalized)
  parentTitle?: string; // Monthly objective 또는 Project title
  parentStartDate?: Date; // Monthly/Project startDate
  parentEndDate?: Date; // Monthly/Project endDate
  parentAreaName?: string; // Project의 경우 area name
  createdAt: Date;
  updatedAt: Date;
  // 각 타입별 고유 필드들
  userRating?: number;
  bookmarked?: boolean;
  // 먼슬리 회고 필드들
  bestMoment?: string;
  routineAdherence?: number;
  unexpectedObstacles?: string;
  nextMonthlyApplication?: string;
  // Key Results 관련 데이터
  keyResultsReview?: {
    text?: string; // Key Results 전반적인 텍스트 리뷰
    completedKeyResults?: string[]; // 완료된 Key Results ID 목록
    failedKeyResults?: {
      keyResultId: string;
      keyResultTitle: string; // Key Result 제목 (조회 시 편의용)
      reason:
        | "unrealisticGoal"
        | "timeManagement"
        | "priorityMismatch"
        | "externalFactors"
        | "motivation"
        | "other";
      customReason?: string; // "other" 선택 시 사용자 입력 이유
    }[];
  };
  // 프로젝트 회고 필드들
  goalAchieved?: boolean;
  memorableTask?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;
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
  aiRecommendations: boolean;
  notifications: boolean;
  theme: "light" | "dark" | "system";
  language: "ko" | "en";
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
    durationWeeks: number;
    difficulty: string;
    target?: string; // 목표 설명 (예: "운동", "독서")
    targetCount?: number; // 목표 수치
    estimatedDailyTime?: number; // 일일 예상 소요 시간 (분)
    tasks: Array<{
      title: string;
      description: string;
      duration: number;
      requirements: string[];
      resources: string[];
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
  inputType?: "manual" | "monthly"; // 입력 방식 (기본값: manual)
  selectedMonthlyId?: string; // Monthly 기반일 때 선택된 Monthly ID
}

// Archive는 Monthly나 Project의 완료된 상태를 나타내는 뷰
// 별도 컬렉션이 아닌 기존 데이터의 필터링된 뷰
