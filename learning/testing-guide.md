# 테스트 적용 가이드 – 목표, 전략, 계획

이 문서는 **Jest 기반 테스트**를 학습하고, monthlyGrow 프로젝트에 단계적으로 적용하기 위한 가이드와 계획을 담습니다.

## 문서 구성

| 문서 | 목적 |
|------|------|
| **testing-guide.md** (본 문서) | 테스트 목표, 전략, 단계별 계획, Mock/에지케이스에 대한 실용적 답변, 코드 이해를 위한 활용법 |

## 목표 (요약)

- **회귀 방지**: 예전에 되던 게 수정 후 깨지지 않았는지 확인
- **동작 보증**: “지금 잘 돌아가고 있는가”를 코드로 검증
- **코드 이해**: 테스트를 쓰며 실제 로직을 읽고, 디버깅 역량 키우기

테스트를 “전부 다” 쓰는 게 아니라, **가장 아픈 부분(먼슬리/프로젝트 생성·수정)** 부터 최소한으로 시작하는 전략입니다.

---

## 1. 이 가이드가 다루는 것

- **당신의 목표**: UI로 먼슬리/프로젝트 생성·수정 시 자주 나는 오류를 줄이고, 수정할 때 “예전에 되던 게 깨진 건 아닌지” 확인하고 싶음. 고치다 보면 새 오류가 나니까, 직접 코드를 읽고 디버깅하면서 **테스트로 안전망**을 갖추고 싶음.
- **우려**: Mock 데이터와 에지케이스가 많아지면 테스트를 위한 코드가 방대해지는 게 맞는지.
- **가이드의 답**: “전부 다” 테스트할 필요 없음. **우선순위를 정해서 최소한부터** 넣고, Mock과 에지케이스는 **필요할 때마다 조금씩** 추가하는 방식이 맞다.

---

## 2. “이상적인 흐름”과 “지금 우리가 할 흐름”

- **이상적으로**: 개발 시작 시점부터 단위 테스트 → 통합 테스트를 같이 가져가면 좋다.
- **지금 우리**: 이미 기능이 있는 프로젝트에서 **회귀 방지 + 코드 이해**가 목표이므로, 다음이 맞다.
  - **단위 테스트**: 입력 → 출력이 명확한 함수부터 (유틸, 상태 계산 등). Mock이 거의 필요 없음.
  - **통합 테스트**: “이 API/이 레이어가 이렇게 동작한다”를 검증. Firebase 등은 Mock으로 경계를 두고, 나중에 필요하면 일부만 실제에 가깝게.
  - **에지케이스 5~6개씩**: 모든 함수에 붙일 필요 없음. **실제로 버그가 났던 경로**나 **비즈니스적으로 중요한 경로**부터 1~2개씩 추가해 나가면 됨.

즉, “방대한 테스트 코드를 한 번에” 쓰는 게 아니라, **조금씩 붙이면서** “이게 잘 돌아가는지, 예전에 됐던 게 안 깨졌는지”를 보는 게 목표에 맞다.

---

## 3. Mock·에지케이스에 대한 실용적 답변

### 3.1 Mock 데이터가 엄청 많이 필요할까?

- **아니요.** 처음에는 다음만 있으면 된다.
  - **순수 함수**(날짜, 상태 계산 등): Mock 없이 입력값만 넣으면 됨.
  - **Firebase를 쓰는 함수**: Firebase를 **전부 Mock**하면, “실제 DB 데이터” 형태의 Mock은 **해당 테스트에서 쓰는 최소한의 객체 몇 개**만 만들면 됨.
- Mock은 “전체 도메인을 재현”하려고 만들지 말고, **“이 테스트가 검사하는 한 가지 시나리오”**에 필요한 만큼만 만든다.  
  예: `createMonthly` 테스트라면 “userId, objective, startDate, endDate만 있는 최소 객체” + Firestore `addDoc`을 mock해서 “한 번 호출되었는지, 어떤 데이터로 호출되었는지”만 검증하면 됨.

### 3.2 에지케이스를 5~6개씩 다 넣어야 할까?

- **아니요.**
  - 먼저 **정상 경로 1개** (happy path)만 테스트해도 “이 함수가 이렇게 동작한다”를 문서처럼 남기고, 회귀를 잡을 수 있다.
  - **에지케이스**는 다음처럼 추가하면 된다.
    - 실제로 **버그가 났던 입력**을 재현하는 테스트 1개
    - **비즈니스 규칙**이 중요한 것 1~2개 (예: “해당 기간 중복 먼슬리면 에러”, “userId 없으면 에러”)
  - 나머지는 “버그를 만나거나, 로직을 바꿀 때” 그때그때 추가해도 늦지 않다.

정리: **방대한 양을 한 번에 쓰는 게 “맞는” 방식이 아니다.**  
목표(회귀 방지 + 코드 이해)에 맞게 **최소한으로 시작하고, 필요할 때마다 조금씩** 붙이는 게 맞다.

---

## 4. 테스트가 “코드 이해”에 어떻게 도움이 되는지

- 테스트를 **함수/모듈의 스펙 문서**처럼 쓸 수 있다.  
  “이 함수는 이런 입력에 대해 이런 출력/부작용을 한다”가 테스트에 드러난다.
- 테스트를 **읽는 순서**를 “진입점 → 의존성”으로 정하면, 코드를 이해하는 경로가 생긴다.  
  예: “먼슬리 생성”이 궁금하면 `createMonthly` 테스트부터 읽고, 그다음 `createMonthly` 구현을 보면 된다.
- **실패한 테스트**는 “어디가 기대와 다른지”를 보여준다. 디버깅 시 “어디를 고쳐야 하는지” 범위를 줄여 준다.
- 따라서 “테스트 코드를 작성하고 디버깅해 보면서 이 코드가 실제로 어떻게 작성되었는지 알고 싶다”는 요구는, **테스트를 먼저 쓰고(또는 기존 코드에 맞춰 기대값을 적고) 실행해 보는 흐름**으로 충족할 수 있다.

---

## 5. 단계별 계획 (이 프로젝트 기준)

전체를 한 번에 하지 말고, **Phase 1 → 2 → 3** 순서로 확장하는 것을 권장한다.

### Phase 1: Mock 거의 없는 단위 테스트 (우선 적용)

**목표**: 입력 → 출력이 명확한 함수만 테스트. Firebase/전역 상태 없음.  
**이점**: Jest 설정만 하면 되고, Mock 준비 부담이 거의 없다. 동시에 `lib/utils.ts`, `lib/firebase/utils.ts` 같은 코드를 읽게 된다.

**대상 후보 (우선순위 순)**:

| 순서 | 대상 | 파일 | 이유 |
|------|------|------|------|
| 1 | `createValidDate` | `lib/utils.ts` | 날짜 버그가 자주 나는 구간. 입력(문자열/Date) → Date 검증만 하면 됨. |
| 2 | `getMonthStartDate`, `getMonthEndDate` | `lib/utils.ts` | 먼슬리 기간 계산의 기반. year/month → Date 검증. |
| 3 | `getMonthlyStatus` | `lib/utils.ts` | `planned` / `in_progress` / `ended` 판별. “오늘”을 Mock하거나, 고정된 날짜로 테스트 가능. |
| 4 | `isMonthlyInProgress`, `isMonthlyEnded`, `isMonthlyPlanned` | `lib/utils.ts` | `getMonthlyStatus` 래퍼. 위 테스트와 함께 한 번에 커버 가능. |
| 5 | `calculateMonthlyProgress` | `lib/utils.ts` | Key Results 기반 달성률. keyResults 배열만 넣으면 됨. |
| 6 | `filterUndefinedValues`, `createBaseData`(Firebase 의존 제거된 부분만) | `lib/firebase/utils.ts` | `filterUndefinedValues`는 순수 함수라 그대로 테스트 가능. |

**에지케이스 예시 (필요한 것만)**:

- `createValidDate`: 빈 문자열, `undefined`(타입상 허용되면), ISO 문자열, 이미 Date인 경우.
- `getMonthlyStatus`: “오늘”이 start 이전 / 구간 안 / end 이후인 경우 각 1개씩.

이 단계만 해도 “각 함수가 무엇을 하는지”가 테스트에 드러나고, 나중에 로직을 바꿀 때 회귀를 잡을 수 있다.

---

### Phase 2: Firebase를 Mock한 단위·통합 테스트

**목표**: `createMonthly`, `createProject`, `updateProject` 같은 **Firestore를 호출하는 함수**를 “실제 DB는 쓰지 않고” 검증.  
**방법**: `firebase/firestore`의 `addDoc`, `updateDoc`, `getDoc`, `runTransaction` 등을 `jest.mock()`으로 대체하고, “호출 횟수”, “넘긴 인자 형태”만 검증.

**Mock 데이터 전략**:

- “완전한 Monthly/Project 타입”을 만들 필요 없음.  
  해당 테스트에서 **실제로 assert하는 필드**만 갖는 최소 객체를 만든다.
- 예: `createMonthly`  
  - 입력: `{ userId, objective, startDate, endDate }` + (필요하면) `connectedProjects`.  
  - 검증: `addDoc`이 1번 호출되었는지, 첫 번째 인자(데이터)에 `userId`, `objective` 등이 포함되었는지.

**대상 후보**:

| 순서 | 대상 | 파일 | 검증 포인트 |
|------|------|------|-------------|
| 1 | `createMonthly` | `lib/firebase/monthlies.ts` | userId/objective 검증, 중복 시 에러, addDoc 호출 1회 및 데이터 형태. |
| 2 | `createProject` | `lib/firebase/projects.ts` | userId/title 검증, areaId 있으면 area count 업데이트 등. |
| 3 | `updateProject` | `lib/firebase/projects.ts` | updateDoc 호출 및 전달된 필드. |

**에지케이스**:  
Phase 1처럼 “한 happy path + 실제로 문제 됐던 케이스 1~2개”부터.  
예: `createMonthly`에 `userId` 없을 때 에러, `objective` 비어 있을 때 에러, (이미 구현되어 있다면) 기간 중복 시 에러.

이 단계에서 “UI에서 저장 버튼을 눌렀을 때 이 레이어가 어떻게 동작하는지”를 테스트로 고정할 수 있고, 나중에 이 부분을 수정할 때 회귀를 바로 확인할 수 있다.

---

### Phase 3: 통합 테스트 (선택)

**목표**: “폼 제출 → createMonthly/createProject 호출까지” 같은 **흐름**을 한 번에 검증.  
**방법**:  
- Next.js API 라우트가 있다면, 해당 라우트를 `fetch`로 호출하고 상태 코드·본문을 검증하거나,  
- Firebase가 Mock이라면 “페이지/훅이 아닌, 폼 제출 핸들러가 올바른 인자로 createMonthly를 호출하는지” 수준으로 검증.

현재 프로젝트는 **클라이언트에서 바로 Firestore를 호출**하는 구조이므로, Phase 2까지 해도 “먼슬리/프로젝트 생성·수정 로직”에 대한 회귀 방지는 충분히 가능하다.  
Phase 3는 “라우트 단위 통합”이 생기거나 “저장 플로우를 한 번에 검증하고 싶다”는 요구가 생길 때 추가해도 된다.

---

## 6. 작업 순서 요약 (실제로 손 댈 순서)

1. **Jest(＋React 등) 설정**  
   - Next 프로젝트이므로 `jest.config.js`(또는 `jest.config.mjs`), `jest.setup.js`(필요 시), `package.json`의 `test` 스크립트.
2. **Phase 1**: `lib/utils.ts`의 날짜·상태 함수부터 테스트 파일 추가 (`lib/utils.test.ts` 또는 `__tests__/lib/utils.test.ts`).  
   - `createValidDate`, `getMonthStartDate`, `getMonthEndDate`, `getMonthlyStatus`, `calculateMonthlyProgress` 등.
3. **실행·디버깅**: `pnpm test`(또는 `npm test`)로 실행해 보면서, 실패하면 구현을 읽고 기대값을 맞추거나 버그를 고친다.  
   - 이 과정이 “코드가 실제로 어떻게 작성되었는지” 이해하는 데 도움이 된다.
4. **Phase 2**: `lib/firebase/monthlies.ts`, `lib/firebase/projects.ts`에 대해 Firebase Mock을 도입하고, `createMonthly`, `createProject`, `updateProject` 테스트 추가.  
   - Mock 데이터는 “해당 테스트에 필요한 최소 필드”만.
5. **에지케이스**: 버그를 만날 때마다 그 케이스를 테스트 1개로 추가.  
   - “5~6개를 미리 다 짜자”가 아니라 “필요할 때 1개씩”이면 충분하다.

---

## 7. 이 프로젝트에서 참고할 파일 위치

- **순수 유틸·상태**: `lib/utils.ts` (날짜, `getMonthlyStatus`, `calculateMonthlyProgress` 등)  
- **Firebase 공통 유틸**: `lib/firebase/utils.ts` (`filterUndefinedValues`, `createBaseData` 등)  
- **먼슬리 생성/수정**: `lib/firebase/monthlies.ts` (`createMonthly`, `checkMonthlyExists` 등)  
- **프로젝트 생성/수정**: `lib/firebase/projects.ts` (`createProject`, `updateProject`)  
- **UI 진입점**: `app/(app)/monthly/new/page.tsx`, `app/(app)/para/projects/new/page.tsx`, `app/(app)/para/projects/edit/[id]/page.tsx`  
  → 테스트는 우선 `lib` 레이어에 두고, UI는 Phase 3나 나중에 필요 시 추가하는 것을 권장.

---

## 8. 정리

- **목표**: 회귀 방지 + “지금 잘 돌아가는지” 검증 + 테스트를 통해 코드 이해하기.  
- **방식**: 전부 다 테스트하지 않고, **먼슬리/프로젝트 생성·수정과 그 기반이 되는 유틸**부터 최소한으로 시작.  
- **Mock·에지케이스**: 한 번에 많이 만들지 말고, **필요한 시나리오만 최소한으로** 추가.  
- **진행**: Phase 1(순수 함수) → Phase 2(Firebase Mock) → (선택) Phase 3(통합).  
- **코드 이해**: 테스트를 “스펙 문서”처럼 읽고, 실패 시 구현을 따라가며 디버깅하면 “실제로 어떻게 작성되었는지”를 익히는 데 도움이 된다.

다음 실습 단계는 **Jest 설정**과 **Phase 1 첫 테스트 파일**을 추가하는 것이다.  
원하면 그 다음 단계로 `jest.config` 예시와 `lib/utils.test.ts`의 예시 테스트 케이스까지 구체적으로 작성해 줄 수 있다.
