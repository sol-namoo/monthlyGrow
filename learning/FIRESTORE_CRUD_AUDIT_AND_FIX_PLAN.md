# Firestore CRUD 점검 및 수정 계획

## 목적

이 문서는 다음과 같은 Firestore CRUD 위험 요소를 기록한다.

- 생성 / 수정 / 조회 사이의 데이터 shape 불일치
- UI에서는 성공처럼 보이지만 실제 저장은 실패하는 경우
- 부분 수정이 문서 전체를 손상시키는 경우
- 다른 사용자의 데이터와 섞일 수 있는 경우

우선순위는 의도적으로 실용적으로 잡았다.

1. 기본적인 create / read / update / delete 안전성
2. 관련 컬렉션 사이의 데이터 정합성
3. 이미 논리적으로 깨져 있는 레거시 API나 미사용 API

## 기준으로 삼은 자료

### 스키마

- [firestore-schema-reference.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-schema-reference.md)
- Users profile/settings/preferences shape
- Project status는 DB 저장형이 아니라 계산형이라는 설명
- Resource 스키마에 `status` 필드가 없다는 점
- Monthly / Project 관계 설명
- 사용자별 데이터 격리 전제

### 데이터 플로우

- [firestore-dataflow.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-dataflow.md)
- 모든 데이터는 사용자별로 완전히 격리되어야 한다는 점
- Monthly / Project 양방향 관계 설명

### 실제 앱 진입점

- [settings/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/settings/page.tsx)
- [monthly/new/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/monthly/new/page.tsx)
- [monthly/edit/[id]/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/monthly/edit/[id]/page.tsx)
- [projects/new/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/para/projects/new/page.tsx)
- [projects/edit/[id]/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/para/projects/edit/[id]/page.tsx)

## 발견한 문제

### 1. `updateUserProfile()`이 `profile` 전체를 덮어쓴다

관련 파일:

- [users.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/users.ts)
- [settings/page.tsx](/Users/namooair/Documents/Workspace/monthlyGrow/app/(app)/settings/page.tsx)

관찰한 동작:

- settings 페이지는 `displayName`만 보낸다.
- 그런데 `updateUserProfile()`은 `profile` 객체 전체를 교체하는 방식으로 쓰고 있었다.

왜 문제인가:

- 스키마상 `profile`에는 `displayName`, `email`, `emailVerified`, timestamp 등이 함께 있어야 한다.
- 이름만 바꾸는 수정이 이메일이나 `photoURL`까지 지우면 안 된다.
- 한 번 덮어쓰고 나면 이후 조회는 실제 저장값이 아니라 fallback default에 기대게 된다.

수정 기준:

- Firestore dot notation으로 nested field를 부분 업데이트해야 한다.
- `settings`, `preferences`와 같은 방식으로 partial merge가 되어야 한다.

우선순위:

- P1
- 상태: 수정 완료

### 2. Area 삭제 시 다른 사용자의 `"미분류"` Area로 데이터가 이동될 수 있다

관련 파일:

- [areas.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/areas.ts)

관찰한 동작:

- `deleteAreaById()`가 대체 Area를 찾을 때 `where("name", "==", "미분류")`만 사용했다.
- `userId` 조건이 없었다.

왜 문제인가:

- 데이터플로우 문서와 보안 전제 모두 사용자별 데이터 격리를 가정한다.
- 여러 사용자가 `"미분류"` Area를 갖고 있으면 잘못된 사용자의 Area로 프로젝트/리소스가 이동될 수 있다.

추가 문제:

- 프로젝트/리소스를 미분류로 옮긴 뒤 destination `counts`도 갱신해야 한다.
- 그렇지 않으면 denormalized count가 실제 데이터와 어긋난다.

수정 기준:

- 대체 Area는 삭제 대상 Area의 `userId` 기준으로 찾아야 한다.
- 없으면 그 사용자용 미분류 Area를 먼저 생성해야 한다.
- 재배치 후 destination counts도 같이 업데이트해야 한다.
- 미분류 Area 자체는 삭제를 막아야 한다.

우선순위:

- P1
- 상태: 수정 완료

### 3. 프로젝트 active / archived 조회 API가 실제로 저장되지 않는 필드를 쿼리하고 있었다

관련 파일:

- [projects.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/projects.ts)
- [firestore-schema-reference.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-schema-reference.md)

관찰한 동작:

- `fetchActiveProjectsByUserId()`와 `fetchArchivedProjectsByUserId()`가 `where("status", "==", ...)`를 사용하고 있었다.
- 하지만 스키마 문서는 project status가 DB 저장형이 아니라 계산형이라고 명시한다.

왜 문제인가:

- 문서는 기능이 있는 것처럼 보이는데 실제 쿼리는 빈 배열을 돌려줄 수 있다.
- API 이름은 지원되는 기능처럼 보이지만 구현은 스키마와 모순된다.

수정 기준:

- 스키마에 맞는 읽기 경로를 사용해야 한다.
- 저장된 프로젝트 문서를 읽은 뒤 앱 로직에서 active / archived를 계산해야 한다.
- 과거에 `status`를 저장한 레거시 문서가 있더라도 읽기 호환 정도로만 다뤄야 한다.

우선순위:

- P2
- 상태: 수정 완료

### 4. 리소스 active / archived 조회 API도 존재하지 않는 필드를 쿼리하고 있었다

관련 파일:

- [resources.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/resources.ts)
- [firestore-schema-reference.md](/Users/namooair/Documents/Workspace/monthlyGrow/firestore-schema-reference.md)

관찰한 동작:

- 리소스 active / archived 조회 API도 `status` 필드를 쿼리하고 있었다.
- Resource 스키마에는 `status`가 없다.
- 게다가 일반 조회 경로와 달리 timestamp normalization도 빠져 있었다.

왜 문제인가:

- 스키마와 맞지 않는 경로라 나중에 사용되면 빈 결과를 주거나, `Timestamp`를 그대로 넘겨줄 수 있다.

수정 기준:

- 일반 리소스 조회 경로를 재사용해야 한다.
- 레거시 `status`가 있더라도 읽기 호환용 정도로만 취급해야 한다.
- 항상 `Date`로 normalize해서 반환해야 한다.

우선순위:

- P2
- 상태: 수정 완료

### 5. user preference shape가 생성과 조회 사이에서 일관되지 않았다

관련 파일:

- [users.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/users.ts)

관찰한 동작:

- `createUser()`는 `preferences.timeFormat`을 저장하고 있었다.
- 그런데 타입과 fetch fallback은 `preferences.weeklyStartDay`를 기대하고 있었다.

왜 문제인가:

- 생성과 조회의 shape 불일치는 대표적인 CRUD drift다.
- 사용자 문서는 정상 생성되더라도 나머지 앱이 기대하는 구조와 다를 수 있다.

수정 기준:

- create, fetch, ensure-document 로직에서 동일한 default preference shape를 사용해야 한다.
- sparse document를 그대로 믿지 말고 defaults와 merge해야 한다.

우선순위:

- P2
- 상태: 수정 완료

### 6. 프로필 사진 변경 시 Firebase Auth만 갱신되고 Firestore profile은 갱신되지 않았다

관련 파일:

- [users.ts](/Users/namooair/Documents/Workspace/monthlyGrow/lib/firebase/users.ts)

관찰한 동작:

- `updateUserProfilePicture()`는 Auth profile만 업데이트했다.
- Firestore `users.profile.photoURL`은 그대로 남았다.

왜 문제인가:

- 앱은 일부 프로필 정보를 Firebase Auth에서 읽지만, 동시에 Firestore user document도 canonical document처럼 사용하고 있다.
- 두 소스가 갈라지면 이후 조회나 admin/migration 스크립트에서 신뢰할 수 없게 된다.

수정 기준:

- 프로필 사진 변경 시 Auth와 Firestore를 같이 갱신해야 한다.
- profile edit과 동일한 partial nested update 규칙을 따라야 한다.

우선순위:

- P2
- 상태: 수정 완료

## 수정 순서

1. P1: `users.profile` 부분 업데이트 안전성 확보
2. P1: 사용자 안전성과 count 정합성을 보장하는 Area 삭제
3. P2: 스키마에 맞춘 Project lifecycle fetch 수정
4. P2: 스키마에 맞춘 Resource lifecycle fetch 수정

## 검증 방법

각 수정은 다음 순서로 검증했다.

1. 스키마 문서 기준 reasoning
2. 실제 사용자 시나리오 기준 점검
3. Firestore mocking 없이도 검증 가능한 핵심 로직 자동 테스트

## 검증 결과

자동 테스트:

- [crud-helpers.test.ts](/Users/namooair/Documents/Workspace/monthlyGrow/tests/crud-helpers.test.ts)
- 실행 명령:
  `node --import tsx --test tests/crud-helpers.test.ts`
- 결과: 통과

변경된 CRUD 파일 대상 타입 체크:

- 실행 명령:
  `./node_modules/.bin/tsc --noEmit --skipLibCheck --module esnext --target es2022 --moduleResolution bundler lib/firebase/crud-helpers.ts lib/firebase/users.ts lib/firebase/areas.ts lib/firebase/projects.ts lib/firebase/resources.ts tests/crud-helpers.test.ts`
- 결과: 통과

참고:

- 루트 `tsc --noEmit`는 여전히 기존 `scripts/` 폴더 오류 때문에 막힌다.
- 이번 CRUD 수정으로 생긴 오류는 아니다.

## 시나리오 체크리스트

### 시나리오 A: profile edit

- 사용자가 settings에서 display name만 수정한다.
- 기대 결과: Firestore 안의 `email`, `photoURL`, `emailVerified`가 유지된다.

### 시나리오 B: area 삭제

- 사용자가 일반 Area를 삭제하고, 그 안에 프로젝트/리소스가 들어 있다.
- 기대 결과: 같은 사용자의 미분류 Area로만 이동한다.
- 기대 결과: 미분류 Area의 `counts`도 실제 데이터 개수와 맞는다.

### 시나리오 C: active / archived 프로젝트 조회

- 사용자의 프로젝트 문서에는 저장형 `status`가 없다.
- 기대 결과: active / archived 조회 API가 빈 배열이 아니라 실제 계산 결과를 반환한다.

### 시나리오 D: resource 조회

- 리소스가 일반 경로와 active / archived 경로로 각각 조회된다.
- 기대 결과: 둘 다 동일한 날짜 shape를 반환한다.
