# Firestore 스키마 참조 문서

이 문서는 현재 Firebase Firestore에 사용 중인 데이터베이스 스키마 구조를 정의합니다. 모든
컬렉션은 사용자 단위로 관리됩니다.

## 📋 컬렉션별 스키마 정의

### 🔹 Users 컬렉션

사용자 프로필, 설정, 환경설정을 저장합니다.

```typescript
interface User {
  id: string; // 문서 ID (Firebase Auth UID)

  profile: {
    displayName: string; // 사용자 표시 이름
    email: string; // 이메일 주소
    photoURL?: string; // 프로필 사진 URL
    emailVerified: boolean; // 이메일 인증 여부
    createdAt: Date; // 생성일시
    updatedAt: Date; // 수정일시
  };

  settings: {
    defaultReward?: string; // 기본 보상
    defaultRewardEnabled: boolean; // 기본 보상 활성화 여부
    carryOver: boolean; // 미완료 항목 이월 여부
    aiRecommendations: boolean; // AI 추천 허용 여부
    notifications: boolean; // 알림 허용 여부
    theme: "light" | "dark" | "system"; // 테마 설정
    language: "ko" | "en"; // 언어 설정
    // Firebase Auth에서 제공하는 정보는 제외:
    // - email (user.email)
    // - displayName (user.displayName)
    // - photoURL (user.photoURL)
  };

  preferences: {
    timezone: string; // 시간대 (예: "Asia/Seoul")
    dateFormat: string; // 날짜 형식 (예: "ko-KR")
    weeklyStartDay: "monday" | "sunday"; // 주 시작일
  };
}
```

**인덱스:**

- `id` (단일, Firebase Auth UID)

---

### 🔹 Areas 컬렉션

사용자가 정의한 삶의 영역들을 저장합니다.

```typescript
interface Area {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID (Firebase Auth UID)
  name: string; // 영역 이름 (예: "건강", "자기계발")
  description: string; // 영역 설명
  icon?: string; // 아이콘 ID (Lucide React)
  color?: string; // 색상 코드 (hex)

  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `status` (복합)
- `userId` + `createdAt` (복합)

---

### 🔹 Resources 컬렉션

각 영역에 속한 참고 자료와 링크를 저장합니다.

```typescript
interface Resource {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  name: string; // 리소스 제목
  areaId?: string; // 소속 영역 ID
  area?: string; // 영역 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  areaColor?: string; // 영역 색상 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  description: string; // 리소스 설명
  text?: string; // 텍스트 내용
  link?: string; // 외부 링크 URL
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `areaId` (복합)

---

### 🔹 Projects 컬렉션

구체적인 행동 단위인 프로젝트들을 저장합니다.

```typescript
interface Project {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  title: string; // 프로젝트 제목
  description: string; // 프로젝트 설명
  category?: "repetitive" | "task_based"; // 프로젝트 유형
  areaId?: string; // 소속 영역 ID
  area?: string; // 영역 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  completedTasks: number; // 전체 실제 완료된 태스크 수
  startDate: Date; // 시작일
  endDate: Date; // 마감일
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  // Unified Archives를 통해 회고와 노트 관리
  // retrospective는 unified_archives 컬렉션에서 조회
  // Unified Archives를 통해 노트 관리
  // notes는 unified_archives 컬렉션에서 조회

  // 프로젝트 상태는 동적으로 계산됨 (DB에 저장되지 않음)
  // getProjectStatus() 함수를 사용하여 실시간 계산
}

// 프로젝트 상태 계산 로직 (getProjectStatus 함수):
// - scheduled: startDate > now (시작일이 미래)
// - in_progress: startDate <= now <= endDate && completionRate < 100%
// - completed: completionRate >= 100%
// - overdue: endDate < now && completionRate < 100%
```

**서브컬렉션:**

- `tasks`: 프로젝트의 세부 작업들 (projects/{projectId}/tasks/{taskId})

**인덱스:**

- `userId` (단일)
- `userId` + `areaId` (복합)
- `userId` + `createdAt` (복합)

---

### 🔹 Monthlies 컬렉션

각 먼슬리는 사용자가 한 달 동안 설정한 OKR 목표와 회고를 관리하는 단위입니다.

```typescript
// Key Result 인터페이스
interface KeyResult {
  id: string;
  title: string; // "운동 총 8회"
  isCompleted: boolean; // 사용자가 OX 체크
  targetCount?: number; // 목표 수치
  completedCount?: number; // 완료 수치
}

interface Monthly {
  id: string;
  userId: string;
  title: string; // 먼슬리 제목 (예: "8월: 이직 준비 완료")
  startDate: Date; // 시작일 (보통 월초)
  endDate: Date; // 종료일 (보통 월말)
  focusAreas: string[]; // 중점 영역 ID 배열
  objective: string; // 먼슬리 목표 (OKR Objective)
  keyResults: KeyResult[]; // Key Results
  reward?: string; // 목표 달성 시 보상
  createdAt: Date;
  updatedAt: Date;
  // Unified Archives를 통해 회고와 노트 관리
  // retrospective와 note는 unified_archives 컬렉션에서 조회

  // 연결된 프로젝트들
  connectedProjects?: Array<{
    projectId: string;
    target?: string;
    targetCount?: number;
    monthlyTargetCount?: number;
  }>;

  // 프로젝트 바로가기 (사용자 편의용, 스냅샷에는 포함되지 않음)
  quickAccessProjects?: Array<{
    projectId: string;
    projectTitle: string;
    areaName: string;
  }>;

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}
```

**상태 계산 로직:**

- `planned`: 현재 날짜 < 시작일
- `in_progress`: 시작일 ≤ 현재 날짜 ≤ 종료일
- `ended`: 현재 날짜 > 종료일

**먼슬리 목표 달성률:**

- Key Results 완료율 = 완료된 Key Results 수 / 전체 Key Results 수
- 사용자가 완료된 태스크들을 보고 각 Key Result 달성 여부를 수동으로 평가

---

### 🔹 Tasks 컬렉션

프로젝트 내 세부 작업들을 저장합니다.

```typescript
interface Task {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  projectId: string; // 소속 프로젝트 ID
  title: string; // 작업 제목
  date: Date; // 작업 날짜
  duration: number; // 소요일수
  done: boolean; // 완료 여부
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `projectId` (복합)
- `userId` + `date` (복합)

### 🔹 MonthlyCompletedTasks 컬렉션

월별 완료된 태스크들을 실시간으로 추적합니다.

```typescript
interface MonthlyCompletedTasks {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  yearMonth: string; // "2024-08" 형태
  completedTasks: {
    taskId: string; // 완료된 태스크 ID
    projectId: string; // 소속 프로젝트 ID
    completedAt: Date; // 완료 날짜
  }[];
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `yearMonth` (복합)

---

### 🔹 MonthlySnapshots 컬렉션

월말에 자동 생성되는 월간 스냅샷을 저장합니다.

```typescript
// Key Result 스냅샷 (월말 스냅샷용)
interface KeyResultSnapshot {
  id: string;
  title: string;
  isCompleted: boolean;
  targetCount?: number;
  completedCount?: number;
  // 스냅샷 시점의 상태를 그대로 보존
}

interface MonthlySnapshot {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  yearMonth: string; // "2024-08"
  snapshotDate: Date; // 스냅샷 생성일

  // 먼슬리 정보
  monthly: {
    id: string;
    title: string;
    objective: string;
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
```

**인덱스:**

- `userId` (단일)
- `userId` + `yearMonth` (복합)
- `snapshotDate` (단일)

---

### 🔹 Unified Archives 컬렉션

모든 회고와 노트를 통합 관리하는 아카이브 시스템입니다.

```typescript
interface UnifiedArchive {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID (Firebase Auth UID)
  type:
    | "monthly_retrospective"
    | "project_retrospective"
    | "monthly_note"
    | "project_note"; // 아카이브 타입
  parentId: string; // 부모 문서 ID (Monthly ID 또는 Project ID)
  parentType: "monthly" | "project"; // 부모 타입

  // 공통 필드
  title: string; // 제목 (자동 생성 또는 사용자 입력)
  content: string; // 내용
  userRating?: number; // 별점 (1-5)
  bookmarked: boolean; // 북마크 여부

  // 회고 전용 필드 (type이 "retrospective"인 경우)
  bestMoment?: string; // 가장 좋았던 순간
  routineAdherence?: string; // 루틴 준수율
  unexpectedObstacles?: string; // 예상치 못한 장애물
  nextMonthlyApplication?: string; // 다음 달 적용 사항
  stuckPoints?: string; // 막힌 지점
  newLearnings?: string; // 새로운 학습
  nextProjectImprovements?: string; // 다음 프로젝트 개선사항
  memorableTask?: string; // 가장 기억에 남는 작업

  // Key Results 실패 이유 데이터 (새로 추가)
  keyResultsReview?: {
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

  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `type` (복합)
- `userId` + `parentType` (복합)
- `userId` + `createdAt` (복합, 내림차순)
- `userId` + `bookmarked` (복합)
- `userId` + `type` + `createdAt` (복합, 내림차순)
- `userId` + `parentType` + `createdAt` (복합, 내림차순)

---

## 🔗 관계 정의

### 1. User → Areas (1:N)

- 사용자 하나가 여러 영역을 가질 수 있음
- `userId`로 연결

### 2. Area → Resources (1:N)

- 영역 하나가 여러 리소스를 가질 수 있음
- `areaId`로 연결

### 3. Area → Projects (1:N)

- 영역 하나가 여러 프로젝트를 가질 수 있음
- `areaId`로 연결

### 4. Project → Tasks (1:N)

- 프로젝트 하나가 여러 작업을 가질 수 있음
- 서브컬렉션으로 관리: `projects/{projectId}/tasks/{taskId}`
- `projectId`로 연결

### 5. Monthly → Projects (독립적)

- 먼슬리와 프로젝트는 독립적으로 관리
- 프로젝트 연결 없음 (connectedProjects 제거)
- 완료된 태스크들이 MonthlyCompletedTasks를 통해 자동 집계
- 사용자가 완료된 태스크들을 보고 Key Results 달성 여부를 수동으로 평가

### 6. MonthlyCompletedTasks → Tasks (1:N)

- 월별 완료된 태스크들을 실시간으로 추적
- 태스크 완료 시 자동으로 해당 월의 MonthlyCompletedTasks에 추가
- 프로젝트별 그룹핑으로 조회 가능

### 7. MonthlySnapshot → Monthly (1:1)

- 월말에 자동 생성되는 먼슬리 스냅샷
- 해당 월의 모든 정보를 완전히 보존
- 과거 데이터 조회 시 사용

### 6. Unified Archives 시스템 (1:N)

- 모든 회고와 노트를 `unified_archives` 컬렉션에서 통합 관리
- `type` 필드로 구분: `"monthly_retrospective"`, `"project_retrospective"`, `"monthly_note"`, `"project_note"`
- `parentId`로 Monthly 또는 Project와 연결
- 별점(`userRating`)과 북마크(`bookmarked`) 기능 통합 제공

### 7. Monthly → Unified Archive (1:N)

- 먼슬리 하나당 여러 아카이브 항목 가능 (회고, 노트)
- `unified_archives` 컬렉션에서 `parentId`로 연결

### 8. Project → Unified Archive (1:N)

- 프로젝트 하나당 여러 아카이브 항목 가능 (회고, 노트)
- `unified_archives` 컬렉션에서 `parentId`로 연결

---

## 📊 데이터 제약사항

### 1. 필수 필드

모든 문서에 다음 필드가 필수입니다:

- `id`: 문서 식별자
- `userId`: 사용자 식별자
- `createdAt`: 생성일시
- `updatedAt`: 수정일시

### 2. 상태 값 제약

- `status`: 각 컬렉션별 정의된 값만 허용
- `userRating`: 1-5 범위의 정수만 허용
- `progress`, `total`: 0-100 범위의 정수만 허용

### 3. 관계 제약

- `areaId`: Areas 컬렉션에 존재하는 ID만 허용
- `projectId`: Projects 컬렉션에 존재하는 ID만 허용
- `monthlyId`: Monthlies 컬렉션에 존재하는 ID만 허용

### 4. 배열 제약

- `focusAreas`: 최대 4개 (권장 2개)
- `connectedProjects`: 최대 5개 (권장 2-3개)
- `connectedMonthlies`: 제한 없음

### 5. 먼슬리별 목표치 제약

- `monthlyTargetCount`: 0 이상의 정수
- `monthlyDoneCount`: 0 이상의 정수, monthlyTargetCount 이하
- `connectedProjects`: 중복된 projectId 불허용

---

## 🔒 보안 규칙

### 기본 규칙

```javascript
// 모든 컬렉션에 적용
match /{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

### 컬렉션별 세부 규칙

```javascript
// Areas 컬렉션
match /areas/{areaId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}

// Projects 컬렉션
match /projects/{projectId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}

// Monthlies 컬렉션
match /monthlies/{monthlyId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

---

## 📈 성능 최적화

### 1. Denormalization 전략

- **Area 정보**: Project, Resource에 `area`, `areaColor` 저장
- **Monthly 정보**: Project에 `connectedMonthlies[]` 배열로 저장
- **이유**: 조인 없이 UI 렌더링 가능

### 2. 인덱싱 전략

- **사용자별 조회**: `userId` 단일 인덱스
- **상태별 조회**: `userId` + `status` 복합 인덱스
- **날짜별 조회**: `userId` + `createdAt` 복합 인덱스

### 3. 먼슬리별 목표치 관리

- **먼슬리 생성/수정**: `connectedProjects[*].monthlyTargetCount` 입력/갱신
- **태스크 완료**: 해당 프로젝트가 활성 먼슬리와 연결된 경우 `monthlyDoneCount` 업데이트
- **조회**: 먼슬리별 진행률 = `monthlyDoneCount / monthlyTargetCount`

---

## 🔄 데이터 마이그레이션

### 기존 데이터 호환성

- 기존 Monthly의 `doneCount`, `targetCount` 필드는 legacy로 유지
- 새로운 `connectedProjects` 배열이 우선적으로 사용됨
- 마이그레이션 시 기존 데이터를 `connectedProjects`로 변환하는 로직 필요

### 마이그레이션 규칙

1. **먼슬리 생성 시**: `connectedProjects` 배열 초기화
2. **프로젝트 연결 시**: `ConnectedProjectGoal` 객체 생성
3. **태스크 완료 시**: 프로젝트 전체 진행률과 먼슬리별 진행률 동시 업데이트
4. **먼슬리 완료 시**: 스냅샷에 먼슬리별 목표치 정보 포함

---

## 📝 쓰기 규칙

### 생성/수정

- 먼슬리 생성/편집 시 `connectedProjects[*].monthlyTargetCount`를 입력/갱신
- 동일 트랜잭션/배치로 각 프로젝트의 `connectedMonthlies`에 표시용 메타를 동기화

### 태스크 완료 이벤트

- 해당 태스크의 `projectId`가 활성 사이클의 `connectedProjects`에 있으면 그 항목의 `monthlyDoneCount++`
- 프로젝트의 전체 진행률 갱신은 기존 로직대로

### 삭제/해제

- 먼슬리에서 프로젝트 연결 해제 ⇒ `connectedProjects`에서 제거
- Project의 `connectedMonthlies`에서도 해당 먼슬리 메타 제거

### 조회 패턴

- 루프 상세: `connectedProjects`만으로 이번 달 달성률 계산/표시
- 프로젝트 상세: "이번 달 진행"은 활성 루프를 찾아 `connectedProjects`에서 매칭해 읽어옴
- 히스토리: 과거 루프의 `connectedProjects`를 그대로 읽으면 그 달 목표/실적 복원 가능

### 인덱스 & 무결성

- 인덱스: `monthlies(userId, startDate)`, `projects(userId, createdAt)` 등 기본 + 필요 복합
- 무결성: "목표 수치는 먼슬리만 편집"을 UI/서버 규칙으로 고정
- 동기화는 배치/트랜잭션으로 (먼슬리와 프로젝트 메타 동시 업데이트 시)
