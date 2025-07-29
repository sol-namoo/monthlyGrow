# Firestore 스키마 참조 문서

이 문서는 현재 Firebase Firestore에 사용 중인 데이터베이스 스키마 구조를 정의합니다. 모든
컬렉션은 사용자 단위로 관리됩니다.

## 📋 컬렉션별 스키마 정의

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
  status: "active" | "archived"; // 활성/보관 상태
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
  status: "planned" | "in_progress" | "completed"; // 프로젝트 상태
  progress: number; // 현재 진행률 (0-100)
  total: number; // 목표 진행률 (0-100)
  startDate: Date; // 시작일
  dueDate: Date; // 마감일
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  loopId?: string; // 현재 연결된 루프 ID (legacy)
  connectedLoops?: ConnectedLoop[]; // 연결된 루프 정보 배열
  addedMidway?: boolean; // 루프 중간 추가 여부
  tasks: Task[]; // 세부 작업들 (서브컬렉션)
  retrospective?: Retrospective; // 프로젝트 회고
  notes: Note[]; // 프로젝트 노트들
}

interface ConnectedLoop {
  id: string; // 루프 ID
  title: string; // 루프 제목
  startDate: Date; // 루프 시작일
  endDate: Date; // 루프 종료일
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `status` (복합)
- `userId` + `areaId` (복합)
- `userId` + `createdAt` (복합)

---

### 🔹 Loops 컬렉션

월간 성장 사이클인 루프들을 저장합니다.

```typescript
interface Loop {
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  title: string; // 루프 제목
  startDate: Date; // 시작일
  endDate: Date; // 종료일
  status: "in_progress" | "ended"; // 루프 상태
  focusAreas: string[]; // 중점 영역 ID 배열
  projectIds: string[]; // 연결된 프로젝트 ID 배열
  reward?: string; // 보상
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  doneCount: number; // 완료된 횟수
  targetCount: number; // 목표 횟수
  retrospective?: Retrospective; // 루프 회고
  note?: Note; // 루프 노트
}
```

**인덱스:**

- `userId` (단일)
- `userId` + `status` (복합)
- `userId` + `createdAt` (복합)

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
- `projectId`로 연결

### 5. Loop ↔ Projects (N:M)

- 루프와 프로젝트는 다대다 관계
- Loop의 `projectIds[]`와 Project의 `connectedLoops[]`로 양방향 연결

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
- **상태별 조회**: `userId` + `status` 복합 인덱스
- **날짜별 조회**: `userId` + `createdAt` 복합 인덱스

### 3. 쿼리 최적화

- **페이지네이션**: `limit()` + `startAfter()` 사용
- **필터링**: `where()` 절을 인덱스와 일치하도록 구성
- **정렬**: `orderBy()`를 인덱스와 일치하도록 구성

---

## 🔄 데이터 마이그레이션

### 1. 기존 데이터 호환성

- `loopId` (string) → `connectedLoops[]` (array) 마이그레이션
- `areaId` (string) → `area` (string) denormalization
- `reflection` → `retrospective` 필드명 변경

### 2. 새 필드 추가

- `icon`, `color` 필드를 Areas에 추가
- `text`, `link` 필드를 Resources에 추가
- `addedMidway` 필드를 Projects에 추가

### 3. 인덱스 생성

- 새로운 복합 인덱스 생성
- 기존 인덱스 유지 (하위 호환성)

---

## 📋 데이터 검증 규칙

### 1. 클라이언트 검증

- 필수 필드 누락 체크
- 데이터 타입 검증
- 값 범위 검증

### 2. 서버 검증 (Firebase Functions)

- 사용자 권한 검증
- 관계 무결성 검증
- 비즈니스 로직 검증

### 3. 데이터 정합성

- 양방향 관계 동기화
- Denormalized 데이터 일관성
- 상태 변경 시 연관 데이터 업데이트
