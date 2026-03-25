# MonthlyGrow Repo Restructuring Guide

Date: 2026-03-25

## 왜 이 문서가 필요한가

MonthlyGrow는 지금도 충분히 개발 가능한 구조이지만, 시간이 갈수록 다음 문제가 생기기 쉽다.

- 웹앱과 Firebase Functions의 경계가 흐려짐
- 공통 타입과 유틸이 어디에 있어야 하는지 헷갈림
- 루트 설정이 전체를 너무 많이 또는 너무 적게 검사함
- README와 실제 구현 구조가 어긋나기 쉬움
- 새 기능을 추가할 때 "어디에 두는 게 맞는지" 판단 비용이 커짐

이 문서는 MonthlyGrow를 장기적으로 더 이해하기 쉽고, 덜 깨지기 쉬운 구조로 옮기는 방향을 정리한 것이다.

## 목표

구조를 바꾼다는 것은 단순히 폴더를 예쁘게 정리하는 일이 아니다.

MonthlyGrow에서의 목표는 다음과 같다.

- 웹앱과 서버 함수의 경계를 명확히 한다
- 공통 코드의 위치를 명확히 한다
- 타입 공유 방식을 정리한다
- 빌드와 타입체크의 범위를 명확히 한다
- 나중에 커져도 관리 가능한 형태를 만든다

## 현재 상태를 짧게 요약

현재 MonthlyGrow는 대략 이런 상태다.

- 루트에 Next.js 앱이 있다
- `functions/`에 Firebase Functions가 따로 있다
- 일부 공통 타입은 루트 `lib/types.ts`에 있다
- 구조상으로는 이미 멀티 패키지적 성격이 있다
- 하지만 workspace 기반으로 체계화되진 않았다

즉:

- 완전한 단일 앱 저장소는 아니다
- 그렇다고 체계화된 모노레포도 아니다
- "느슨한 모노레포형 구조"라고 보는 것이 가장 정확하다

## 장기적으로 추천하는 목표 구조

가장 이해하기 쉬운 방향은 이런 구조다.

```text
monthlygrow/
  apps/
    web/
  services/
    functions/
  packages/
    shared-types/
    shared-utils/
    shared-config/
  docs/
  package.json
  pnpm-workspace.yaml
  turbo.json
```

이 구조의 의미는 다음과 같다.

### `apps/web`

사용자에게 보이는 Next.js 앱

여기에 들어갈 것:

- `app/`
- `components/`
- `hooks/`
- 브라우저 전용 Firebase 클라이언트 코드
- 웹 UI 관련 스타일과 페이지 코드

### `services/functions`

Firebase Functions

여기에 들어갈 것:

- 현재 `functions/src/*`
- 서버 전용 SDK
- 마이그레이션, 트리거, 크론, AI 서버 연동 코드

### `packages/shared-types`

웹앱과 functions가 함께 쓰는 타입

예:

- `Monthly`
- `Project`
- `UserSettings`
- 아카이브 타입
- API request/response 타입

### `packages/shared-utils`

정말로 런타임 중립적인 유틸만 넣는 곳

중요:

- 브라우저 전용 API를 쓰면 안 됨
- Node 전용 API를 쓰면 안 됨
- 양쪽에서 import해도 안전한 코드만 허용

예:

- 날짜 계산 로직 중 순수 함수
- progress 계산
- 키 변환
- validation helper

### `packages/shared-config`

선택적이지만 나중에 유용할 수 있음

예:

- ESLint config
- TypeScript base config
- Prettier config

## 왜 이 구조가 좋은가

이 구조는 "기능별 분리"보다 "실행 경계와 재사용 경계 분리"에 강하다.

장점:

- 웹앱은 웹앱답게, functions는 functions답게 유지된다
- 공통 타입의 소유권이 분명해진다
- 브라우저 코드와 서버 코드가 뒤섞이는 일을 줄인다
- 타입체크와 빌드가 패키지별로 분리된다
- 새 팀원이 들어와도 구조를 읽기 쉽다

## 지금 당장 하면 안 되는 것

구조 개선 욕심이 생길 때 자주 하는 실수가 있다.

### 1. 폴더를 한 번에 다 옮기기

이건 위험하다.

이유:

- import path가 대량으로 깨짐
- 빌드 설정이 한꺼번에 무너질 수 있음
- "구조 변경"과 "기능 변경"이 섞여서 리뷰가 어려워짐

### 2. shared 패키지에 아무거나 넣기

이건 더 위험하다.

예:

- 브라우저 전용 훅
- Firebase admin 코드
- Next 전용 유틸

이런 것이 들어가면 shared가 아니라 "잡동사니 폴더"가 된다.

### 3. 도구부터 먼저 과하게 도입하기

예:

- `pnpm workspace`
- `turbo`
- `nx`

이 도구들은 유용하지만, 경계를 정리하지 않은 상태에서 먼저 들이면 복잡성만 늘 수 있다.

## MonthlyGrow에 맞는 단계적 마이그레이션 경로

가장 현실적인 경로는 4단계다.

## Stage 1. 경계 문서화

목표:

- 지금 구조를 먼저 명확히 이해한다

할 일:

- 루트 앱과 `functions/`의 역할 문서화
- 어떤 코드는 웹 전용인지, 서버 전용인지 기록
- 타입체크/빌드 범위를 문서화

이미 일부는 이번 작업으로 시작됐다.

이 단계의 핵심:

- 코드를 옮기기 전에 경계를 말로 먼저 정의한다

## Stage 2. 공통 코드 분류

목표:

- 현재 `lib` 안에서 무엇이 shared 후보인지 분리한다

예상 질문:

- `lib/types.ts`는 shared인가
- `lib/utils.ts`는 전부 shared인가
- `lib/firebase/*`는 shared인가

대체로 이렇게 보면 된다.

### shared 가능성이 높은 것

- 순수 타입
- 순수 계산 함수
- 런타임 독립적 validation

### shared로 두면 안 되는 것

- `window`, `document`, `localStorage` 사용 코드
- `next/*` 의존 코드
- `firebase-admin` 의존 코드
- React hook

이 단계에서 해야 할 것은 "실제 이동"보다 "분류표 작성"이다.

## Stage 3. workspace 도입

목표:

- 저장소를 공식적으로 멀티 패키지 구조로 선언

추천 도구:

- `pnpm workspace`

이유:

- 비교적 단순하다
- 패키지 링크 관리가 쉽다
- MonthlyGrow 규모에 과하지 않다

이 단계에서 기대하는 구조:

```text
apps/web
services/functions
packages/shared-types
```

최소한 여기까지 가면 경계가 훨씬 명확해진다.

## Stage 4. task orchestration 도입

목표:

- 빌드/테스트/린트를 더 체계화

후보:

- `turbo`

필요해지는 시점:

- 패키지 수가 늘었을 때
- CI 시간이 길어졌을 때
- "변경된 것만 다시 돌리기"가 중요해졌을 때

이건 초반 필수는 아니다.

## MonthlyGrow에 대한 구체적 권장 순서

현재 상황 기준으로는 다음 순서를 추천한다.

### 1. 지금 구조에서 경계 먼저 안정화

이미 시작된 것:

- 앱 타입체크 범위 정리
- i18n 상태 중앙화

다음으로 좋은 것:

- README와 실제 구조 일치시키기
- `functions/`에 대한 별도 개발 문서 만들기
- `lib` 내부를 shared 후보 / web 전용 / server 전용으로 분류

### 2. `shared-types` 후보부터 분리

가장 먼저 떼기 좋은 것은 타입이다.

이유:

- 타입은 상대적으로 런타임 의존성이 적다
- 이동 위험이 낮다
- 웹과 functions 모두에서 공유 가치가 크다

후보:

- 도메인 타입
- 공통 response 타입
- 공통 request 타입

주의:

- 브라우저 전용 타입 섞지 않기
- Next 전용 타입 섞지 않기

### 3. 그 다음에 `shared-utils`

이 단계는 조심해야 한다.

왜냐하면 `utils`는 대부분 shared처럼 보여도 실제론 런타임 의존성이 숨어 있기 쉽다.

예:

- `navigator`
- `window`
- `localStorage`
- Firebase SDK import

그래서 `shared-utils`는 "작고 순수한 함수"만 옮기는 것이 맞다.

### 4. 마지막에 workspace + turbo

도구는 구조가 어느 정도 분류된 뒤 도입하는 게 낫다.

그 이유는:

- 정리되지 않은 구조를 그대로 자동화하면 혼란만 유지된다
- 반대로 경계가 정리된 뒤에는 도구가 그 경계를 강화해준다

## shared로 옮기기 좋은 코드와 나쁜 코드

이 기준은 매우 중요하다.

### shared로 옮기기 좋은 코드

- 순수 타입 선언
- 순수 데이터 변환 함수
- 날짜/퍼센트/상태 계산 같은 순수 함수
- 문자열 변환 유틸

### shared로 옮기면 안 되는 코드

- React hook
- 컴포넌트
- Next.js router 의존 코드
- `window`, `document`, `navigator`, `localStorage`
- `firebase-admin`
- 브라우저 Firebase client 초기화 코드

한 줄 기준:

"웹앱과 functions 둘 다 import해도 안전한가?"

이 질문에 확실히 `yes`가 아니면 shared가 아니다.

## config도 분리 대상이 될 수 있다

프로젝트가 커지면 타입과 유틸만 공유하는 것이 아니다.

다음도 분리할 수 있다.

- `tsconfig` base
- eslint config
- prettier config

하지만 이것도 초반 필수는 아니다.

먼저 중요한 것은 코드 경계다.

## 도입 난이도와 우선순위

MonthlyGrow 기준 현실적인 우선순위는 이렇다.

### 우선순위 높음

- 앱과 functions 경계 문서화
- 타입체크 범위 정리
- shared 후보 분류
- 타입 패키지 분리 검토

### 우선순위 중간

- workspace 도입
- 공통 설정 패키지화

### 우선순위 낮음

- turbo/nx 같은 고급 orchestration
- 지나치게 세분화된 패키지 쪼개기

## 추천 결론

지금 MonthlyGrow에 가장 잘 맞는 방향은 다음이다.

1. 지금처럼 기능 리팩터링을 하면서 경계를 먼저 바로잡는다
2. `functions/`는 독립 서비스 패키지로 유지한다
3. 타입부터 shared 패키지로 옮길 준비를 한다
4. 그 다음에 `pnpm workspace`를 도입한다
5. 규모가 더 커지면 `turbo`를 고려한다

즉, 한 번에 완성형 모노레포로 점프하는 게 아니라:

- 경계 정리
- 공유 코드 분류
- workspace 도입
- 빌드 파이프라인 고도화

이 순서가 가장 안전하다.

## MonthlyGrow에 바로 적용 가능한 실천 질문

앞으로 새 파일을 만들 때는 먼저 이렇게 묻는다.

1. 이 코드는 브라우저에서 실행되는가, 서버에서 실행되는가
2. 이 코드는 사용자 권한인가, 관리자 권한인가
3. 이 코드는 웹앱 전용인가, functions 전용인가, 양쪽 공유인가
4. 양쪽 공유라면 정말 런타임 중립적인가

이 네 질문만 습관화해도 구조가 훨씬 덜 흐려진다.

## 마지막 요약

MonthlyGrow의 장기적 목표는 "모든 걸 한 번에 갈아엎는 것"이 아니다.

진짜 목표는:

- 경계를 선명하게 만들고
- 공통 코드를 안전하게 분리하고
- 도구는 그 다음에 도입하는 것

즉 구조 리팩터링의 핵심은 "멋진 폴더 트리"가 아니라 "실행 경계와 책임 경계를 코드에 드러내는 것"이다.
