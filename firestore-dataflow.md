# 🌱 Monthly Grow - Firebase 데이터 구조 및 흐름도

이 문서는 Monthly Grow 앱의 Firebase Firestore 구조와 주요 데이터 흐름을 시각화 및
문서화한 내용입니다.

## 📊 데이터 모델 개요

### 핵심 엔티티

- **User**: 사용자 프로필, 설정, 환경설정
- **Monthly**: 월간 성장 사이클 (1-2개월)
- **Project**: 구체적인 행동 단위 (2-8주 권장)
- **Area**: 삶의 영역 분류 (건강, 자기계발, 가족 등)
- **Resource**: 참고 자료 및 링크
- **Task**: 프로젝트 내 세부 작업
- **UnifiedArchive**: 통합된 회고 및 노트 관리
- **Retrospective**: 먼슬리/프로젝트 회고 (Legacy)
- **Note**: 자유 메모 (Legacy)

## 🔄 데이터 관계도

```
Users (사용자 프로필 및 설정)
├── profile (displayName, email, photoURL 등)
├── settings (기본 보상, AI 추천, 알림 등)
└── preferences (시간대, 날짜 형식, 언어 등)

User (개인화된 데이터)
├── Areas (생활 영역)
│   ├── Projects (해당 영역의 프로젝트들)
│   │   ├── Tasks (서브컬렉션: projects/{projectId}/tasks/{taskId})
│   │   ├── Retrospective (프로젝트 회고)
│   │   └── Notes (프로젝트 노트들)
│   └── Resources (해당 영역의 참고 자료들)
├── Monthlies (월간 먼슬리)
│   ├── focusAreas[] (중점 영역들)
│   ├── connectedProjects[] (연결된 프로젝트별 목표치)
│   │   ├── projectId (프로젝트 ID)
│   │   ├── monthlyTargetCount (이번 달 목표)
│   │   └── monthlyDoneCount (이번 달 완료)
│   └── (회고/노트는 unified_archives에서 관리)
├── Projects (행동 단위)
│   ├── areaId (소속 영역)
│   ├── target (전체 목표)
│   ├── completedTasks (전체 완료)
│   ├── connectedMonthlies[] (연결된 먼슬리들)
│   ├── tasks (서브컬렉션)
│   ├── retrospective (프로젝트 회고)
│   └── notes[] (프로젝트 노트들)
└── Snapshots (월별 진척률 요약)
    ├── monthlyId (먼슬리 참조)
    └── projectId (프로젝트 참조)

※ 모든 데이터는 사용자별로 완전히 격리됨
※ 다른 사용자가 동일한 데이터를 생성해도 서로 접근 불가
※ Archive는 완료된 Monthly/Project의 필터링된 뷰
```

## 📝 컬렉션별 상세 구조

### 1. Areas 컬렉션

```typescript
{
  id: string;
  userId: string;
  name: string;           // "건강", "자기계발", "가족"
  description: string;    // 영역 설명
  icon?: string;          // 아이콘 ID
  color?: string;         // 색상 코드
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Resources 컬렉션

```typescript
{
  id: string;
  userId: string;
  name: string;           // 리소스 제목
  areaId?: string;        // 소속 영역 ID
  area?: string;          // 영역 이름 (denormalized)
  areaColor?: string;     // 영역 색상 (denormalized)
  description: string;    // 리소스 설명
  text?: string;          // 텍스트 내용
  link?: string;          // 외부 링크
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Projects 컬렉션

```typescript
{
  id: string;
  userId: string;
  title: string;          // 프로젝트 제목
  description: string;    // 프로젝트 설명
  category?: "repetitive" | "task_based"; // 프로젝트 유형
  areaId?: string;        // 소속 영역 ID
  area?: string;          // 영역 이름 (denormalized)
  target: number;         // 전체 목표 개수 (반복형: 목표 횟수, 작업형: 목표 작업 수)
  completedTasks: number; // 전체 실제 완료된 태스크 수
  startDate: Date;        // 시작일
  endDate: Date;          // 마감일
  createdAt: Date;
  updatedAt: Date;
  monthlyId?: string;        // 현재 연결된 먼슬리 ID (legacy)
  connectedMonthlies?: string[]; // 연결된 먼슬리 ID 배열
  addedMidway?: boolean;  // 먼슬리 중간 추가 여부
  retrospective?: Retrospective; // 프로젝트 회고
  notes: Note[];          // 프로젝트 노트들

  // 프로젝트 상태는 동적으로 계산됨 (DB에 저장되지 않음)
  // getProjectStatus() 함수를 사용하여 실시간 계산
}

// 프로젝트 상태 계산 로직 (getProjectStatus 함수):
// - scheduled: startDate > now (시작일이 미래)
// - in_progress: startDate <= now <= endDate && completionRate < 100%
// - completed: completionRate >= 100%
// - overdue: endDate < now && completionRate < 100%
```

### 4. Monthlies 컬렉션

```typescript
// Key Result 인터페이스
interface KeyResult {
  id: string;
  title: string; // "운동 총 8회"
  description?: string; // 상세 설명 (선택사항)
  isCompleted: boolean; // 사용자가 OX 체크
  targetCount?: number; // 목표 수치
  completedCount?: number; // 완료 수치
}

{
  id: string;
  userId: string;
  objective: string; // OKR Objective (간단한 한 줄)
  objectiveDescription?: string; // Objective 상세 설명 (선택사항)
  startDate: Date; // 시작일
  endDate: Date; // 종료일
  focusAreas: string[]; // 중점 영역 ID 배열
  keyResults: KeyResult[]; // Key Results
  reward?: string; // 보상
  createdAt: Date;
  updatedAt: Date;
  retrospective?: Retrospective; // 먼슬리 회고
  note?: string; // 먼슬리 노트

  // 프로젝트 바로가기 (사용자 편의용, 스냅샷에는 포함되지 않음)
  quickAccessProjects?: string[]; // 프로젝트 ID 배열

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

// 먼슬리 상태 계산 로직:
// - planned: 오늘 < 시작일
// - in_progress: 시작일 <= 오늘 <= 종료일
// - ended: 오늘 > 종료일

// 먼슬리 목표 달성률:
// - Key Results 완료율 = 완료된 Key Results 수 / 전체 Key Results 수
// - 사용자가 완료된 태스크들을 보고 각 Key Result 달성 여부를 수동으로 평가
```

### 5. Tasks 컬렉션

```typescript
{
  id: string;
  userId: string;
  projectId: string;      // 소속 프로젝트 ID
  title: string;          // 작업 제목
  date: Date;             // 작업 날짜
  duration: number;       // 소요일수
  done: boolean;          // 완료 여부
  status?: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Unified Archives 컬렉션

통합된 회고 및 노트 관리 시스템입니다.

```typescript
{
  id: string;
  userId: string;
  type: "monthly_retrospective" | "project_retrospective" | "monthly_note" | "project_note";
  parentId: string; // Monthly ID 또는 Project ID
  parentType: "monthly" | "project";

  // 공통 필드
  title: string; // 제목 (자동 생성 또는 사용자 입력)
  content: string; // 내용
  userRating?: number; // 별점 (1-5)
  bookmarked: boolean; // 북마크 여부

  // 회고 전용 필드
  bestMoment?: string;
  routineAdherence?: string;
  unexpectedObstacles?: string;
  nextMonthlyApplication?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;
  memorableTask?: string;

  // Key Results 실패 이유 데이터 (새로 추가)
  keyResultsReview?: {
    completedKeyResults?: string[]; // 완료된 Key Results ID 목록
    failedKeyResults?: {
      keyResultId: string;
      keyResultTitle: string; // Key Result 제목 (조회 시 편의용)
      reason: "unrealisticGoal" | "timeManagement" | "priorityMismatch" | "externalFactors" | "motivation" | "other";
      customReason?: string; // "other" 선택 시 사용자 입력 이유
    }[];
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Snapshots 컬렉션

월별 진척률 요약을 저장합니다.

```typescript
{
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  year: number; // 년도
  month: number; // 월
  snapshotDate: Date; // 스냅샷 생성일

  // 먼슬리 정보
  monthlyIds: string[]; // 해당 월의 먼슬리 ID들
  monthlyTitles: string[]; // 해당 월의 먼슬리 제목들

  // 완료된 프로젝트 정보
  completedProjects: number; // 완료된 프로젝트 수
  totalProjects: number; // 전체 프로젝트 수
  completionRate: number; // 완료율 (%)

  // 태스크 정보
  totalTasks: number; // 전체 태스크 수
  completedTasks: number; // 완료된 태스크 수

  // 집중 시간
  focusTime: number; // 총 집중 시간 (분)

  // 보상 정보
  rewards: string[]; // 보상 목록

  // 영역별 통계
  areaStats: {
    [areaId: string]: {
      name: string;
      projectCount: number;
      completedProjectCount: number;
      focusTime: number;
      completionRate: number;
    };
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

  createdAt: Date;
  updatedAt: Date;
}
```

## 🔗 관계 관리

### 1. Project-Monthly 연결 (개선된 구조)

- **양방향 관계**:
  - Monthly의 `connectedProjects[]`로 프로젝트별 목표치 관리
  - Project의 `connectedMonthlies[]`로 연결된 먼슬리 목록 관리
- **먼슬리 생성 시**: 선택된 프로젝트들을 `connectedProjects[]`에 추가하고 각각의 `monthlyTargetCount` 설정
- **프로젝트 생성 시**: Monthly ID를 Project의 `connectedMonthlies[]`에 추가
- **데이터 정합성**: 먼슬리별 목표치와 진행률을 Monthly에서 관리, 프로젝트 전체 진행률은 Project에서 관리

### 2. Area-Project 연결

- **단방향 관계**: Project의 `areaId`로 Area 참조
- **Denormalization**: 성능을 위해 Area 이름을 Project에 저장
- **색상 정보**: Area 색상을 Resource에도 저장하여 UI 렌더링 최적화

### 3. Project-Task 연결

- **서브컬렉션 관계**: `projects/{projectId}/tasks/{taskId}` 구조
- **자동 생성**: 프로젝트 생성 시 기본 작업들 자동 생성
- **수동 추가**: 사용자가 직접 작업 추가/수정 가능

## 📊 데이터 플로우

### 1. 먼슬리 생성 플로우 (개선된 구조)

```
1. 사용자가 먼슬리 정보 입력
2. 기존 프로젝트 선택 (선택사항)
3. 각 프로젝트별 먼슬리 목표치(monthlyTargetCount) 설정
4. 중점 영역 선택 (최대 4개, 권장 2개)
5. 먼슬리 생성
6. 선택된 프로젝트들의 connectedMonthlies[] 업데이트
7. 먼슬리의 connectedProjects[] 업데이트
```

### 2. 프로젝트 생성 플로우

```
1. 사용자가 프로젝트 정보 입력
2. Area 선택
3. 프로젝트 생성
4. 선택된 Area 정보 denormalize하여 저장
5. 먼슬리 연결 시 connectedMonthlies[] 업데이트
```

### 3. 태스크 완료 플로우 (개선된 구조)

```
1. 사용자가 태스크 완료 체크
2. 프로젝트의 전체 completedTasks 업데이트
3. 해당 프로젝트가 활성 먼슬리와 연결된 경우:
   - 먼슬리의 connectedProjects[].monthlyDoneCount 업데이트
4. 먼슬리 달성률 재계산
5. 프로젝트 전체 진행률 재계산
```

### 4. 먼슬리 완료 플로우

```
1. 먼슬리 상태를 "ended"로 변경
2. 연결된 프로젝트들의 먼슬리별 진행률 최종 업데이트
3. 회고 작성 가능 상태로 변경
4. Archive 뷰에서 조회 가능
5. 스냅샷 생성 (먼슬리별 목표치 정보 포함)
```

### 5. 실패 패턴 분석 플로우 (새로 추가)

```
1. 먼슬리 회고 작성 시 실패한 Key Results 선택
2. 각 실패한 Key Result에 대해 실패 이유 선택
   - 목표 과다 (unrealisticGoal)
   - 시간 관리 (timeManagement)
   - 우선순위 (priorityMismatch)
   - 외부 요인 (externalFactors)
   - 동기 부족 (motivation)
   - 기타 (other) - 사용자 입력
3. 실패 이유 데이터를 unified_archives에 저장
4. 월말 스냅샷 생성 시 실패 분석 데이터 포함
5. 홈 대시보드에서 실패 패턴 분석 위젯 표시
   - 전체 실패율
   - 주요 실패 이유 분포
   - 월별/연도별 트렌드
   - 개선 제안
```

## ⚡ 성능 최적화

### 1. Denormalization

- **Area 정보**: Project, Resource에 Area 이름/색상 저장
- **Monthly 정보**: Project에 연결된 Monthly 제목/기간 저장
- **이유**: 조인 없이 UI 렌더링 가능

### 2. 인덱싱 전략

- `userId` + `status`: 사용자별 활성 상태 조회
- `userId` + `areaId`: 영역별 조회
- `userId` + `createdAt`: 최신순 정렬

### 3. 쿼리 최적화

- **복합 쿼리**: 여러 조건을 한 번에 처리
- **페이지네이션**: 무한 스크롤 지원
- **캐싱**: TanStack Query로 클라이언트 캐싱

### 4. 먼슬리별 목표치 관리

- **먼슬리 생성/수정**: `connectedProjects[*].monthlyTargetCount` 입력/갱신
- **태스크 완료**: 해당 프로젝트가 활성 먼슬리와 연결된 경우 `monthlyDoneCount` 업데이트
- **조회**: 먼슬리별 진행률 = `monthlyDoneCount / monthlyTargetCount`

### 5. 실패 패턴 분석 최적화 (새로 추가)

- **스냅샷 우선 조회**: 실패 분석 시 스냅샷 데이터를 우선적으로 사용
- **Fallback 메커니즘**: 스냅샷이 없는 경우 아카이브 데이터 사용
- **성능 향상**: 복잡한 아카이브 조회 대신 스냅샷 조회로 빠른 분석
- **데이터 일관성**: 스냅샷 생성 시점의 실패 상태를 정확히 보존

## 🔒 보안 규칙

### 1. 사용자별 데이터 격리

```javascript
// 모든 컬렉션에 userId 필드 필수
match /{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

### 2. 데이터 무결성

- **필수 필드**: userId, createdAt, updatedAt
- **상태 검증**: status 필드 유효성 검사
- **관계 검증**: 외래키 참조 무결성
- **먼슬리별 목표치 제약**: monthlyTargetCount >= 0, monthlyDoneCount <= monthlyTargetCount

## 📈 확장성 고려사항

### 1. 데이터 크기

- **프로젝트당 작업**: 평균 10-20개
- **먼슬리당 프로젝트**: 평균 2-3개 (최대 5개)
- **사용자당 영역**: 평균 5-8개

### 2. 쿼리 패턴

- **자주 조회**: 사용자별 활성 프로젝트/먼슬리
- **가끔 조회**: Archive, 통계 데이터
- **드물게 조회**: 전체 히스토리, 백업

### 3. 미래 확장

- **태그 시스템**: 프로젝트 분류 개선
- **협업 기능**: 팀 프로젝트 지원
- **AI 통합**: 자동 회고 생성, 추천 시스템

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
