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
  areaId?: string; // 소속 영역 ID
  area?: string; // 영역 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  progress: number; // 현재 진행률 (0-100)
  total: number; // 목표 진행률 (0-100)
  startDate: Date; // 시작일
  endDate: Date; // 마감일
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  loopId?: string; // 현재 연결된 루프 ID (legacy)
  addedMidway?: boolean; // 루프 중간 추가 여부
  retrospective?: Retrospective; // 프로젝트 회고
  notes: Note[]; // 프로젝트 노트들

  // 미완료 프로젝트 이관 관련 필드
  isCarriedOver?: boolean; // 이전 루프에서 이관된 프로젝트 여부
  originalLoopId?: string; // 원래 루프 ID (이관된 경우)
  carriedOverAt?: Date; // 이관된 날짜
  migrationStatus?: "pending" | "migrated" | "ignored"; // 이관 상태

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "completed"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

// 프로젝트 상태 계산 로직:
// - planned: 오늘 < 시작일
// - in_progress: 시작일 <= 오늘 <= 마감일
// - completed: 오늘 > 마감일
```

**서브컬렉션:**

- `tasks`: 프로젝트의 세부 작업들 (projects/{projectId}/tasks/{taskId})

**인덱스:**

- `userId` (단일)
- `userId` + `status` (복합)
- `userId` + `areaId` (복합)
- `userId` + `createdAt` (복합)

---

### 🔹 Loops 컬렉션

각 루프는 사용자가 한 달 동안 집중할 프로젝트들과 목표를 묶은 단위입니다.

```typescript
interface Loop {
  id: string;
  userId: string;
  title: string; // 루프 제목 (예: "7월 루프: 자기계발")
  startDate: Date; // 시작일 (보통 월초)
  endDate: Date; // 종료일 (보통 월말)
  focusAreas: string[]; // 중점 영역 ID 배열
  projectIds: string[]; // 연결된 프로젝트 ID 배열
  reward?: string; // 목표 달성 시 보상
  doneCount: number; // 실제 완료된 횟수
  targetCount: number; // 목표 횟수
  createdAt: Date;
  updatedAt: Date;
  retrospective?: Retrospective; // 루프 회고 (완료 후)
  note?: Note; // 루프 노트 (선택)

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}
```

**상태 계산 로직:**

- `planned`: 현재 날짜 < 시작일
- `in_progress`: 시작일 ≤ 현재 날짜 ≤ 종료일
- `ended`: 현재 날짜 > 종료일

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

---

### 🔹 Retrospectives 컬렉션

루프와 프로젝트의 회고를 저장합니다.

```typescript
interface Retrospective {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  content?: string; // 자유 회고 내용

  // 루프용 필드
  bestMoment?: string; // 가장 좋았던 순간
  routineAdherence?: string; // 루틴 준수도
  unexpectedObstacles?: string; // 예상치 못한 장애물
  nextLoopApplication?: string; // 다음 루프 적용사항

  // 프로젝트용 필드
  goalAchieved?: string; // 목표 달성도
  memorableTask?: string; // 기억에 남는 작업
  stuckPoints?: string; // 막힌 지점들
  newLearnings?: string; // 새로운 학습
  nextProjectImprovements?: string; // 다음 프로젝트 개선사항

  // 공통 필드
  userRating?: number; // 별점 (1~5)
  bookmarked?: boolean; // 북마크 여부
  title?: string; // 회고 제목
  summary?: string; // 요약
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `createdAt` (복합)
- `userId` + `userRating` (복합)
- `userId` + `bookmarked` (복합)

---

### 🔹 Notes 컬렉션

자유 메모를 저장합니다.

```typescript
interface Note {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  content: string; // 노트 내용
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `createdAt` (복합)

---

### 🔹 Snapshots 컬렉션

월별 진척률 요약을 저장합니다.

```typescript
interface Snapshot {
  id: string; // 문서 ID (자동 생성)
  loopId: string; // 루프 ID
  projectId: string; // 프로젝트 ID
  year: number; // 년도
  month: number; // 월
  snapshotDate: Date; // 스냅샷 생성일
  doneCount: number; // 완료된 횟수
  targetCount: number; // 목표 횟수
  reward: string; // 보상
}
```

**인덱스:**

- `loopId` (단일)
- `projectId` (단일)
- `year` + `month` (복합)

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

### 5. Loop → Projects (1:N)

- 루프 하나가 여러 프로젝트를 가질 수 있음
- Loop의 `projectIds[]`로 연결
- Project에서 Loop 정보가 필요한 경우 쿼리 시 조인

### 6. Loop → Retrospective (1:1)

- 루프 하나당 회고 하나
- Loop 문서 내에 `retrospective` 필드로 저장

### 7. Project → Retrospective (1:1)

- 프로젝트 하나당 회고 하나
- Project 문서 내에 `retrospective` 필드로 저장

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
- `loopId`: Loops 컬렉션에 존재하는 ID만 허용

### 4. 배열 제약

- `focusAreas`: 최대 4개 (권장 2개)
- `projectIds`: 최대 5개 (권장 2-3개)
- `connectedLoops`: 제한 없음

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

// Loops 컬렉션
match /loops/{loopId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

---

## 📈 성능 최적화

### 1. Denormalization 전략

- **Area 정보**: Project, Resource에 `area`, `areaColor` 저장
- **Loop 정보**: Project에 `connectedLoops[]` 배열로 저장
- **이유**: 조인 없이 UI 렌더링 가능

### 2. 인덱싱 전략

- **사용자별 조회**: `userId` 단일 인덱스
- **상태별 조회**: `
