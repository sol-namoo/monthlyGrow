# Legacy And Data Integrity Audit

## 기준

다음 자료를 우선 기준으로 삼았다.

- [firestore-schema-reference.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-schema-reference.md)
- [firestore-dataflow.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-dataflow.md)
- 실제 사용 중인 UI 진입점
  - 프로젝트 상세, 먼슬리 상세, PARA 아카이브, 월간 요약
- 현재 Firebase CRUD 구현

판단 기준은 두 가지였다.

1. 현재 기획과 스키마에 맞는 단일 진실 소스가 있는가
2. 실제 사용자 플로우에서 수정/삭제 후 데이터가 서로 어긋날 여지가 있는가

## 확인한 냄새

### 1. 프로젝트 노트의 이중 저장

- 현재 스키마 문서에서는 project note / retrospective를 `unified_archives`로 관리한다고 적혀 있다.
- 하지만 실제 코드에는 `projects.notes[]`에 일부 데이터를 같이 저장하는 흐름이 남아 있었다.
- 특히 프로젝트 노트 수정 시에는 `unified_archives`만 갱신되고 `projects.notes[]`는 갱신되지 않아 UI와 DB가 쉽게 어긋날 수 있었다.

결론:

- `unified_archives`를 SSOT로 본다.
- 프로젝트 상세 노트 탭도 `project.notes[]`가 아니라 `fetchSingleArchive(..., "project_note")`를 기준으로 보이도록 수정한다.

### 2. monthly / project 삭제 후 unified archive orphan 가능성

- `deleteMonthlyById()`와 `deleteProjectById()`는 부모 문서와 연결 관계는 정리했지만, 해당 parent를 가리키는 `unified_archives` 문서를 지우지 않았다.
- 이 경우 PARA archive 상세 페이지에서는 parent 문서가 사라졌는데 archive만 남는 orphan 상태가 생긴다.

결론:

- monthly / project 삭제 시 관련 `unified_archives`도 같이 삭제해야 한다.

### 3. Functions 진입점의 깨진 export

- `functions/src/index.ts`가 `testProjectMigration`을 `./cronJobs`에서 export한다고 적고 있었지만 실제 구현은 없다.
- 이건 functions 패키지 빌드나 유지보수 관점에서 명백한 레거시 냄새다.

결론:

- 실제 존재하는 cron 함수만 export한다.

### 4. `usePageData -> api/data`의 stale adapter

- `hooks/usePageData.ts`는 아직 `api/data.ts`의 TODO 함수들(`getSnapshotsByMonthlyId`, `getArchive`)에 의존하는 경로가 남아 있었다.
- 실제 사용 중인 월간 요약 페이지는 snapshot 데이터를 쓰지 않는데도 monthlyDetail 묶음에서 불필요하게 snapshot query를 시도했다.
- `getArchive()`는 빈 객체를 반환하는 placeholder였다.

결론:

- 월간 요약에 실제 쓰는 데이터만 query 한다.
- archive adapter는 실제 unified archive fetch로 연결한다.
- snapshot adapter는 별도 화면 요구가 생기기 전까지 live path에서 제거한다.

### 5. 레거시 UI / 미사용 경로

- `components/para/ArchivesTab.tsx`는 오래된 archive 타입(`monthly`, `project`, `note`)에 맞춰 작성되어 있고, 현재 PARA 화면은 `UnifiedArchivesTab`을 쓰고 있다.
- `api/data.ts`의 `getUnconnectedProjects()`는 “모든 프로젝트가 미연결”이라는 과거 구조 기준 comment를 유지한다.
- `updateUserDisplayName`, `deleteProfilePicture`는 export는 남아 있지만 현재 UI에서 직접 쓰는 경로를 찾지 못했다.

결론:

- 이 항목들은 즉시 장애를 내는 CRUD 버그는 아니지만, 유지보수 혼란을 만드는 레거시로 분류한다.
- 제거 전에는 실제 참조 경로를 한 번 더 확인해야 한다.

## 수정 우선순위

1. 프로젝트 노트 SSOT 정리
2. monthly / project 삭제 시 archive orphan 제거
3. stale adapter 및 broken export 정리
4. 레거시 UI/unused API 정리 후보 문서화

## 이번에 실제 수정한 항목

- 프로젝트 노트 UI를 `unified_archives` 단일 소스로 정리
- `NoteForm`의 project note 저장 시 `projects.notes[]` 이중 쓰기 제거
- monthly / project 삭제 시 관련 `unified_archives` 같이 삭제
- `functions/src/index.ts`의 깨진 export 제거
- `api/data.ts#getArchive()`를 실제 unified archive 조회로 연결
- `usePageData("monthlyDetail")`에서 live path에 필요 없는 snapshot query 제거

## 테스트 전략

실제 Firestore 에뮬레이터를 붙이지 않고도 현재 가장 중요한 무결성 규칙은 순수 함수로 검증할 수 있게 만들었다.

- area `counts`와 실제 project/resource 수 일치 여부
- `monthly.connectedProjects[]` <-> `project.connectedMonthlies[]` 양방향 일치 여부
- unified archive parent 존재 여부

관련 파일:

- [lib/firebase/data-integrity.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/data-integrity.ts)
- [tests/firestore-data-integrity-scenarios.test.ts](/Users/namooair/Documents/Workspace/monthlyGrow/tests/firestore-data-integrity-scenarios.test.ts)

## 남은 냄새

- `components/para/ArchivesTab.tsx`는 현재 구조와 맞지 않는 legacy candidate
- `getUnconnectedProjects()`는 현재 관계 모델 설명과 맞지 않는 legacy adapter
- `getSnapshotsByMonthlyId()`는 아직 실제 구현이 비어 있다
- `components/monthly/MonthlyDetailContent.tsx`, `app/(app)/monthly/summary/page.tsx`에는 아직 `monthly.retrospective` 같은 구필드를 직접 읽는 레거시 참조가 남아 있다
- `Project.notes[]`, `Monthly.note`, `Monthly.retrospective`, `Project.retrospective` 타입 필드는 읽기 호환용인지 완전 제거 대상인지 한 번 더 결정이 필요하다
