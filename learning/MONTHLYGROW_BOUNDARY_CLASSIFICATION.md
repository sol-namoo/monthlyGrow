# MonthlyGrow Boundary Classification

Date: 2026-03-25

## 왜 이 문서가 필요한가

모노레포 구조나 런타임 경계를 이해해도, 실제 프로젝트 파일을 보면 다시 헷갈릴 수 있다.

그래서 이 문서는 MonthlyGrow의 실제 파일을 기준으로 다음을 구분한다.

- 무엇이 `web`에 속하는가
- 무엇이 `functions`에 속하는가
- 무엇이 장기적으로 `shared-types` 후보인가
- 무엇이 애매하지만 당장 shared로 옮기면 안 되는가

이 문서는 "미래 구조로 완전히 옮긴 상태"가 아니라, "현재 레포를 읽을 때 어떤 관점으로 분류해야 하는가"를 설명한다.

## 먼저 결론

지금 MonthlyGrow를 장기 구조 관점으로 읽으면 대략 이렇게 볼 수 있다.

```text
web
  = app + components + hooks + public + styles + browser-side lib 일부

functions
  = functions/src 이하 + functions 전용 설정

shared-types 후보
  = lib/types.ts 중심의 순수 타입

shared-utils 후보
  = lib/utils.ts 안의 일부 순수 계산 함수만
```

중요한 점:

- 현재 `lib`는 전부 shared가 아니다.
- `lib`라는 폴더 이름만 보고 공용 코드라고 생각하면 안 된다.
- 현재 `lib`는 web 전용 코드와 공용 후보 코드가 섞여 있다.

## 1. `web`으로 분류하는 것이 맞는 파일들

다음은 사실상 `apps/web`로 가야 하는 코드다.

### 1-1. Next.js App Router와 페이지

이 경로들은 전부 web에 속한다.

- [app](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app)
- [app/layout.tsx](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app/layout.tsx)
- [app/(app)](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app/(app))
- [app/(auth)](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app/(auth))
- [app/(onboarding)](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app/(onboarding))

이유:

- Next.js 라우팅 구조다
- 브라우저에서 사용자에게 보이는 앱이다
- React/Next에 강하게 결합돼 있다

### 1-2. UI 컴포넌트

이 경로들은 전부 web이다.

- [components](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components)
- [components/ui](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/ui)
- [components/monthly](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/monthly)
- [components/para](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/para)
- [components/widgets](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/widgets)

이유:

- React 컴포넌트다
- 브라우저 렌더링 전제를 가진다
- shared 패키지로 옮기기에는 UI 의존성이 너무 크다

### 1-3. React hooks

다음은 전부 web이다.

- [hooks/useSettings.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/hooks/useSettings.ts)
- [hooks/useLanguage.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/hooks/useLanguage.ts)
- [hooks/useAuth.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/hooks/useAuth.ts)
- [hooks/usePageData.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/hooks/usePageData.ts)
- [hooks/use-mobile.tsx](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/hooks/use-mobile.tsx)

이유:

- React hook이다
- 브라우저 또는 Next 렌더링 컨텍스트를 전제로 한다
- shared 패키지 후보가 아니다

### 1-4. 브라우저용 Firebase client 코드

다음은 이름만 보면 shared처럼 보일 수 있지만 실질적으로 web이다.

- [lib/firebase/config.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/config.ts)
- [lib/firebase/index.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/index.ts)
- [lib/firebase/users.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/users.ts)
- [lib/firebase/monthlies.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/monthlies.ts)
- [lib/firebase/projects.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/projects.ts)
- [lib/firebase/tasks.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/tasks.ts)
- [lib/firebase/resources.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/resources.ts)
- [lib/firebase/areas.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/areas.ts)
- [lib/firebase/unified-archives.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/unified-archives.ts)
- [lib/firebase/analytics.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase/analytics.ts)

이유:

- `firebase` 클라이언트 SDK를 사용한다
- 사용자 권한 모델에 붙어 있다
- functions와는 전혀 다른 런타임 책임을 가진다

즉 `lib/firebase/*`는 "공통"이 아니라 "web에서 쓰는 데이터 접근 계층"에 가깝다.

### 1-5. i18n 리소스와 브라우저 보조 유틸

다음도 현재는 web으로 보는 것이 안전하다.

- [lib/translations.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/translations.ts)
- [lib/translations](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/translations)
- [lib/language-detection.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/language-detection.ts)

이유:

- 현재 i18n 사용처가 전부 web이다
- `language-detection`은 브라우저 API에 기대고 있다

특히 [lib/language-detection.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/language-detection.ts)는 `navigator`를 쓰기 때문에 shared 후보가 아니다.

### 1-6. 기타 web 전용 인프라

다음도 web으로 보면 된다.

- [public](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/public)
- [styles](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/styles)
- [app/globals.css](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/app/globals.css)
- [components/theme-provider.tsx](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/theme-provider.tsx)
- [components/QueryClientProvider.tsx](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/components/QueryClientProvider.tsx)
- [lib/queryClient.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/queryClient.ts)

## 2. `functions`로 분류하는 것이 맞는 파일들

다음은 전부 `services/functions` 관점으로 보면 된다.

- [functions/src](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src)
- [functions/package.json](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/package.json)
- [functions/tsconfig.json](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/tsconfig.json)

대표 파일:

- [functions/src/functions.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/functions.ts)
- [functions/src/cronJobs.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/cronJobs.ts)
- [functions/src/analytics.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/analytics.ts)
- [functions/src/claude-api.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/claude-api.ts)
- [functions/src/firebase-utils.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/firebase-utils.ts)
- [functions/src/migration-utils.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/migration-utils.ts)
- [functions/src/snapshot-utils.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/src/snapshot-utils.ts)

이유:

- Firebase Functions 런타임 기준이다
- 관리자 권한 또는 서버 역할을 수행한다
- 브라우저와 다른 의존성을 가진다
- 별도 빌드와 배포 단위를 가진다

### 주의할 점

다음은 functions 폴더 안에 있지만 "소스"라기보다는 산출물 또는 로컬 상태다.

- [functions/lib](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/lib)
- [functions/node_modules](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/node_modules)
- [functions/firebase-debug.log](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/firebase-debug.log)
- [functions/.DS_Store](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/functions/.DS_Store)

장기적으로는:

- `functions/lib`는 빌드 산출물
- `functions/node_modules`는 설치 산출물
- 로그와 `.DS_Store`는 관리 대상에서 제외하는 편이 낫다

## 3. `shared-types` 후보

지금 레포에서 가장 먼저 shared 패키지로 분리하기 좋은 것은 타입이다.

핵심 후보는 다음이다.

- [lib/types.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/types.ts)

여기에 있는 것들 중 많은 타입은 web과 functions 양쪽에서 의미가 있다.

예:

- `Area`
- `Project`
- `Monthly`
- `Task`
- `UnifiedArchive`
- `UserSettings`
- `UserPreferences`
- AI request/response 타입 일부

### 왜 타입이 먼저인가

이유:

- 상대적으로 런타임 의존성이 적다
- UI 의존성이 없다
- 서버/클라이언트 모두 같은 도메인 모델을 써야 할 가능성이 높다
- 분리했을 때 이득이 크다

### 하지만 바로 전부 옮기면 안 되는 이유

[lib/types.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/types.ts) 안에는 "정말 양쪽이 공유해야 하는 타입"과 "web 쪽에서만 의미가 큰 타입"이 섞여 있을 수 있다.

그래서 장기적으로는 다음처럼 쪼개는 편이 더 낫다.

- `domain.ts`
- `user.ts`
- `archives.ts`
- `ai.ts`

그 다음 `packages/shared-types`로 옮기는 것이 안전하다.

## 4. `shared-utils` 후보

이건 타입보다 훨씬 조심해야 한다.

현재 후보처럼 보일 수 있는 파일:

- [lib/utils.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/utils.ts)

하지만 이 파일 전체를 shared로 옮기면 안 된다.

이유:

- 안에 브라우저 전용 코드가 섞여 있을 수 있다
- i18n 의존 로직이 섞여 있을 수 있다
- Firebase/Next 컨텍스트를 은근히 전제할 수 있다

즉 `lib/utils.ts`는 "shared-utils 후보"가 아니라 "공유 가능한 순수 함수가 일부 들어 있는 혼합 파일"이라고 보는 게 정확하다.

### shared-utils로 옮기기 좋은 함수의 기준

다음 질문에 모두 `yes`여야 한다.

1. React와 무관한가
2. `window`, `document`, `navigator`, `localStorage`를 쓰지 않는가
3. Next.js import가 없는가
4. Firebase client/admin import가 없는가
5. 입력과 출력이 명확한 순수 함수인가

이 기준을 통과한 함수만 추출해서 `shared-utils`로 옮기는 것이 맞다.

## 5. 현재 가장 애매한 구역

MonthlyGrow에서 제일 애매한 건 `lib`다.

현재 `lib` 안에는 다음이 섞여 있다.

- web 전용 코드
- 공통 타입 후보
- 순수 유틸 후보
- 브라우저 Firebase 데이터 접근 계층
- i18n 리소스

즉 `lib`는 현재 "공용 라이브러리"라기보다는 "앱 내부 지원 코드 모음"에 가깝다.

이걸 읽을 때는 다음처럼 다시 해석하면 된다.

### web 전용으로 보는 것이 맞는 것

- [lib/firebase](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/firebase)
- [lib/language-detection.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/language-detection.ts)
- [lib/queryClient.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/queryClient.ts)
- [lib/translations](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/translations)
- [lib/translations.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/translations.ts)
- [lib/autoPlanCache.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/autoPlanCache.ts)
- [lib/saveAutoPlanToFirestore.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/saveAutoPlanToFirestore.ts)

### shared-types 후보로 보는 것이 맞는 것

- [lib/types.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/types.ts)

### shared-utils 후보가 일부 숨어 있을 수 있는 것

- [lib/utils.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/utils.ts)

## 6. 실전적으로 파일을 어떻게 옮겨야 하는가

지금 당장 폴더 이동을 하자는 뜻은 아니다.

우선은 "정신적 분류"를 이렇게 하면 된다.

### 미래의 `apps/web`로 갈 것

- `app/**`
- `components/**`
- `hooks/**`
- `public/**`
- `styles/**`
- `lib/firebase/**`
- `lib/translations/**`
- `lib/translations.ts`
- `lib/language-detection.ts`
- `lib/queryClient.ts`
- `lib/autoPlanCache.ts`
- `lib/saveAutoPlanToFirestore.ts`

### 미래의 `services/functions`로 갈 것

- `functions/src/**`
- `functions/package.json`
- `functions/tsconfig.json`

### 미래의 `packages/shared-types` 후보

- `lib/types.ts`

### 미래의 `packages/shared-utils` 후보

- `lib/utils.ts`에서 순수 함수만 추출한 일부

## 7. 지금 당장 옮기지 말아야 하는 것

다음은 이름만 보고 shared라고 착각하기 쉽지만, 당장 옮기면 안 된다.

### `lib/firebase/*`

이유:

- Firebase 클라이언트 SDK 의존
- 사용자 권한 기반
- web 데이터 계층 역할

### `hooks/*`

이유:

- React 전용
- 런타임 중립 코드가 아님

### `translations/*`

이유:

- 지금은 web에서만 소비 중
- 먼저 i18n 구조가 더 안정돼야 함

### `utils.ts` 전체

이유:

- 혼합도가 높을 가능성 큼
- 함수별 선별이 먼저

## 8. 지금 MonthlyGrow에서 바로 할 수 있는 다음 작업

가장 현실적인 순서는 이렇다.

### 1. 앱과 functions 경계 문서화 유지

이미 개념 문서는 생겼다.

다음으로 좋은 일:

- 루트 README에 "앱"과 "functions"가 별도 패키지라는 점을 명시
- 개발 시작 절차를 web / functions로 나눠 적기

### 2. `lib/types.ts` 정리

바로 shared 패키지로 옮기기 전에 먼저 내부를 정리한다.

추천:

- 도메인별로 타입 분리
- web 전용 타입과 공통 타입을 분리

### 3. `lib/utils.ts` 감사

해야 할 일:

- 브라우저 의존 함수 표시
- 순수 함수 표시
- shared 후보 함수만 목록화

### 4. 그 다음에 workspace 도입 검토

그때부터 이런 구조가 자연스러워진다.

```text
apps/web
services/functions
packages/shared-types
```

## 9. 한 줄 기준 정리

파일을 볼 때 다음 질문으로 빠르게 분류하면 된다.

### 이 파일이 React/Next를 쓰는가

그렇다면 거의 확실히 `web`

### 이 파일이 `firebase-functions` 또는 `firebase-admin`을 쓰는가

그렇다면 거의 확실히 `functions`

### 이 파일이 타입 선언만 담고 있는가

그렇다면 `shared-types` 후보

### 이 파일이 순수 함수만 담고 있는가

그렇다면 `shared-utils` 후보

### 브라우저 API나 Node API를 직접 쓰는가

그렇다면 shared가 아닐 가능성이 높다

## 10. MonthlyGrow에 대한 최종 판단

현재 MonthlyGrow에서 가장 먼저 shared 패키지로 분리하기 좋은 것은 타입이다.

즉 우선순위는 다음이 맞다.

1. `functions`는 계속 별도 서비스 패키지로 유지
2. web 코드는 web으로 명확히 인식
3. `lib/types.ts`를 shared-types 후보로 정리
4. `lib/utils.ts`는 나중에 함수 단위로 선별

핵심은:

"공유할 수 있어 보이는 것"과 "정말 안전하게 공유 가능한 것"은 다르다.

MonthlyGrow에서 지금 가장 안전한 shared 출발점은 [lib/types.ts](/Users/namooair/Documents/Workspace/monthlyGrow-refactor-i18n/lib/types.ts)다.
