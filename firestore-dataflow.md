# 🌱 Monthly Grow - Firebase 데이터 구조 및 흐름도

이 문서는 Monthly Grow 앱의 Firebase Firestore 구조와 주요 데이터 흐름을 시각화 및
문서화한 내용입니다.

## 📊 데이터 모델 개요

### 핵심 엔티티

- **User**: 사용자 프로필, 설정, 환경설정
- **Chapter**: 월간 성장 사이클 (1-2개월)
- **Project**: 구체적인 행동 단위 (2-8주 권장)
- **Area**: 삶의 영역 분류 (건강, 자기계발, 가족 등)
- **Resource**: 참고 자료 및 링크
- **Task**: 프로젝트 내 세부 작업
- **Retrospective**: 챕터/프로젝트 회고
- **Note**: 자유 메모

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
├── Chapters (월간 챕터)
│   ├── focusAreas[] (중점 영역들)
│   ├── connectedProjects[] (연결된 프로젝트별 목표치)
│   │   ├── projectId (프로젝트 ID)
│   │   ├── chapterTargetCount (이번 달 목표)
│   │   └── chapterDoneCount (이번 달 완료)
│   ├── retrospective (챕터 회고)
│   └── note (챕터 노트)
├── Projects (행동 단위)
│   ├── areaId (소속 영역)
│   ├── target (전체 목표)
│   ├── completedTasks (전체 완료)
│   ├── connectedChapters[] (연결된 챕터들)
│   ├── tasks (서브컬렉션)
│   ├── retrospective (프로젝트 회고)
│   └── notes[] (프로젝트 노트들)
└── Snapshots (월별 진척률 요약)
    ├── chapterId (챕터 참조)
    └── projectId (프로젝트 참조)

※ 모든 데이터는 사용자별로 완전히 격리됨
※ 다른 사용자가 동일한 데이터를 생성해도 서로 접근 불가
※ Archive는 완료된 Chapter/Project의 필터링된 뷰
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
  chapterId?: string;        // 현재 연결된 챕터 ID (legacy)
  connectedChapters?: string[]; // 연결된 챕터 ID 배열
  addedMidway?: boolean;  // 챕터 중간 추가 여부
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

### 4. Chapters 컬렉션

```typescript
// 챕터별 프로젝트 목표치 인터페이스
interface ConnectedProjectGoal {
  projectId: string; // 프로젝트 ID
  chapterTargetCount: number; // 이번 루프에서 목표로 하는 태스크 수
  chapterDoneCount: number;   // 이번 루프에서 실제 완료한 태스크 수
}

{
  id: string;
  userId: string;
  title: string;          // 챕터 제목
  startDate: Date;        // 시작일
  endDate: Date;          // 종료일
  focusAreas: string[];   // 중점 영역 ID 배열
  reward?: string;        // 보상
  doneCount: number;      // 전체 완료 수 (legacy - 하위 호환성)
  targetCount: number;    // 전체 목표 수 (legacy - 하위 호환성)
  connectedProjects: ConnectedProjectGoal[]; // 챕터별 프로젝트 목표치
  createdAt: Date;
  updatedAt: Date;
  retrospective?: Retrospective; // 챕터 회고
  note?: Note;            // 챕터 노트

  // 로컬 계산 필드 (DB에 저장되지 않음)
  status?: "planned" | "in_progress" | "ended"; // startDate와 endDate를 기반으로 클라이언트에서 계산
}

// 챕터 상태 계산 로직:
// - planned: 오늘 < 시작일
// - in_progress: 시작일 <= 오늘 <= 종료일
// - ended: 오늘 > 종료일

// 챕터별 목표치 계산:
// - 챕터 달성률 = Σ(chapterDoneCount) / Σ(chapterTargetCount)
// - 프로젝트별 챕터 진행률 = chapterDoneCount / chapterTargetCount
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

### 6. Retrospectives 컬렉션

```typescript
{
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  content?: string;       // 자유 회고 내용

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

  // 공통 필드
  userRating?: number;    // 별점 (1~5)
  bookmarked?: boolean;   // 북마크 여부
  title?: string;         // 회고 제목
  summary?: string;       // 요약
}
```

### 7. Notes 컬렉션

자유 메모를 저장합니다.

```typescript
{
  id: string; // 문서 ID (자동 생성)
  userId: string; // 사용자 ID
  content: string; // 노트 내용
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
}
```

### 8. Snapshots 컬렉션

월별 진척률 요약을 저장합니다.

```typescript
{
  id: string; // 문서 ID (자동 생성)
  chapterId: string; // 챕터 ID
  projectId: string; // 프로젝트 ID
  year: number; // 년도
  month: number; // 월
  snapshotDate: Date; // 스냅샷 생성일
  doneCount: number; // 완료된 횟수
  targetCount: number; // 목표 횟수
  reward: string; // 보상
}
```

## 🔗 관계 관리

### 1. Project-Chapter 연결 (개선된 구조)

- **양방향 관계**:
  - Chapter의 `connectedProjects[]`로 프로젝트별 목표치 관리
  - Project의 `connectedChapters[]`로 연결된 챕터 목록 관리
- **챕터 생성 시**: 선택된 프로젝트들을 `connectedProjects[]`에 추가하고 각각의 `chapterTargetCount` 설정
- **프로젝트 생성 시**: Chapter ID를 Project의 `connectedChapters[]`에 추가
- **데이터 정합성**: 챕터별 목표치와 진행률을 Chapter에서 관리, 프로젝트 전체 진행률은 Project에서 관리

### 2. Area-Project 연결

- **단방향 관계**: Project의 `areaId`로 Area 참조
- **Denormalization**: 성능을 위해 Area 이름을 Project에 저장
- **색상 정보**: Area 색상을 Resource에도 저장하여 UI 렌더링 최적화

### 3. Project-Task 연결

- **서브컬렉션 관계**: `projects/{projectId}/tasks/{taskId}` 구조
- **자동 생성**: 프로젝트 생성 시 기본 작업들 자동 생성
- **수동 추가**: 사용자가 직접 작업 추가/수정 가능

## 📊 데이터 플로우

### 1. 챕터 생성 플로우 (개선된 구조)

```
1. 사용자가 챕터 정보 입력
2. 기존 프로젝트 선택 (선택사항)
3. 각 프로젝트별 챕터 목표치(chapterTargetCount) 설정
4. 중점 영역 선택 (최대 4개, 권장 2개)
5. 챕터 생성
6. 선택된 프로젝트들의 connectedChapters[] 업데이트
7. 챕터의 connectedProjects[] 업데이트
```

### 2. 프로젝트 생성 플로우

```
1. 사용자가 프로젝트 정보 입력
2. Area 선택
3. 프로젝트 생성
4. 선택된 Area 정보 denormalize하여 저장
5. 챕터 연결 시 connectedChapters[] 업데이트
```

### 3. 태스크 완료 플로우 (개선된 구조)

```
1. 사용자가 태스크 완료 체크
2. 프로젝트의 전체 completedTasks 업데이트
3. 해당 프로젝트가 활성 챕터와 연결된 경우:
   - 챕터의 connectedProjects[].chapterDoneCount 업데이트
4. 챕터 달성률 재계산
5. 프로젝트 전체 진행률 재계산
```

### 4. 챕터 완료 플로우

```
1. 챕터 상태를 "ended"로 변경
2. 연결된 프로젝트들의 챕터별 진행률 최종 업데이트
3. 회고 작성 가능 상태로 변경
4. Archive 뷰에서 조회 가능
5. 스냅샷 생성 (챕터별 목표치 정보 포함)
```

## ⚡ 성능 최적화

### 1. Denormalization

- **Area 정보**: Project, Resource에 Area 이름/색상 저장
- **Chapter 정보**: Project에 연결된 Chapter 제목/기간 저장
- **이유**: 조인 없이 UI 렌더링 가능

### 2. 인덱싱 전략

- `userId` + `status`: 사용자별 활성 상태 조회
- `userId` + `areaId`: 영역별 조회
- `userId` + `createdAt`: 최신순 정렬

### 3. 쿼리 최적화

- **복합 쿼리**: 여러 조건을 한 번에 처리
- **페이지네이션**: 무한 스크롤 지원
- **캐싱**: TanStack Query로 클라이언트 캐싱

### 4. 챕터별 목표치 관리

- **챕터 생성/수정**: `connectedProjects[*].chapterTargetCount` 입력/갱신
- **태스크 완료**: 해당 프로젝트가 활성 챕터와 연결된 경우 `chapterDoneCount` 업데이트
- **조회**: 챕터별 진행률 = `chapterDoneCount / chapterTargetCount`

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
- **챕터별 목표치 제약**: chapterTargetCount >= 0, chapterDoneCount <= chapterTargetCount

## 📈 확장성 고려사항

### 1. 데이터 크기

- **프로젝트당 작업**: 평균 10-20개
- **챕터당 프로젝트**: 평균 2-3개 (최대 5개)
- **사용자당 영역**: 평균 5-8개

### 2. 쿼리 패턴

- **자주 조회**: 사용자별 활성 프로젝트/챕터
- **가끔 조회**: Archive, 통계 데이터
- **드물게 조회**: 전체 히스토리, 백업

### 3. 미래 확장

- **태그 시스템**: 프로젝트 분류 개선
- **협업 기능**: 팀 프로젝트 지원
- **AI 통합**: 자동 회고 생성, 추천 시스템

## 🔄 데이터 마이그레이션

### 기존 데이터 호환성

- 기존 Chapter의 `doneCount`, `targetCount` 필드는 legacy로 유지
- 새로운 `connectedProjects` 배열이 우선적으로 사용됨
- 마이그레이션 시 기존 데이터를 `connectedProjects`로 변환하는 로직 필요

### 마이그레이션 규칙

1. **챕터 생성 시**: `connectedProjects` 배열 초기화
2. **프로젝트 연결 시**: `ConnectedProjectGoal` 객체 생성
3. **태스크 완료 시**: 프로젝트 전체 진행률과 챕터별 진행률 동시 업데이트
4. **챕터 완료 시**: 스냅샷에 챕터별 목표치 정보 포함

## 📝 쓰기 규칙

### 생성/수정

- 챕터 생성/편집 시 `connectedProjects[*].chapterTargetCount`를 입력/갱신
- 동일 트랜잭션/배치로 각 프로젝트의 `connectedChapters`에 표시용 메타를 동기화

### 태스크 완료 이벤트

- 해당 태스크의 `projectId`가 활성 사이클의 `connectedProjects`에 있으면 그 항목의 `chapterDoneCount++`
- 프로젝트의 전체 진행률 갱신은 기존 로직대로

### 삭제/해제

- 챕터에서 프로젝트 연결 해제 ⇒ `connectedProjects`에서 제거
- Project의 `connectedChapters`에서도 해당 챕터 메타 제거

### 조회 패턴

- 루프 상세: `connectedProjects`만으로 이번 달 달성률 계산/표시
- 프로젝트 상세: "이번 달 진행"은 활성 루프를 찾아 `connectedProjects`에서 매칭해 읽어옴
- 히스토리: 과거 루프의 `connectedProjects`를 그대로 읽으면 그 달 목표/실적 복원 가능

### 인덱스 & 무결성

- 인덱스: `chapters(userId, startDate)`, `projects(userId, createdAt)` 등 기본 + 필요 복합
- 무결성: "목표 수치는 챕터만 편집"을 UI/서버 규칙으로 고정
- 동기화는 배치/트랜잭션으로 (챕터와 프로젝트 메타 동시 업데이트 시)
