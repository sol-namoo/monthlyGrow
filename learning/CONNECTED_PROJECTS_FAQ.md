# 연결된 프로젝트 구조

프론트엔드 개발자분이 DB 쪽 배경이 적을 때를 가정해, “왜 이렇게 설계하는 게 맞는지”를 단계별로 정리한 문서입니다.

---

## 1. Single Source of Truth(SSOT)면 트랜잭션 오류가 안 생기는 거 아닌가요?

**맞습니다. SSOT를 지키면 “어디가 진실인지”가 하나라서, 이론적으로는 트랜잭션/동기화 실패로 인한 불일치가 없습니다.**

다만 여기서 중요한 건 **“진실의 원천이 무엇인가”**입니다.

- **옵션 A**: “연결 정보”의 진실을 **Monthly 문서 한 곳**에만 둔다.  
  → 프로젝트 목록을 볼 때마다 “이 먼슬리 문서의 connectedProjects(또는 quickAccessProjects)만” 읽으면 됨.  
  → 프로젝트 쪽에는 **아무것도 안 써도** 됨. (단방향)
- **옵션 B**: “연결 정보”의 진실을 **Project 문서 한 곳**에만 둔다.  
  → “이 먼슬리에 연결된 프로젝트”를 보려면 “connectedMonthlies에 이 먼슬리 ID가 들어 있는 프로젝트”를 **쿼리**해서 찾아야 함.  
  → Monthly에는 **아무것도 안 써도** 됨. (단방향, 하지만 조회는 항상 프로젝트 컬렉션 쿼리)

즉, **SSOT를 지키는 방법은 두 가지**입니다.

- **Monthly만** 쓰는 SSOT (단방향)
- **Project만** 쓰는 SSOT (단방향)

지금 문서/코드에서 말하는 “양방향”은 **SSOT를 포기하고 두 곳에 같은 정보를 복제해 두는 것**이 아니라, **“누가 진실의 원천인지”를 정한 뒤, 조회·쓰기 패턴에 맞춰 반대쪽을 어떻게 쓸지**를 정하는 문제에 가깝습니다.  
아래에서 “왜 양방향(두 곳 다 유지)을 선택했는지”를 NoSQL 특성과 함께 설명합니다.

---

## 2. 그럼 왜 “양방향”을 유지하는 설계로 갔나요? (논리 순서)

요약하면: **조회 패턴이 두 가지**라서, “한 곳만 진실”로 하면 한쪽 조회가 매우 비효율이 됩니다.

### 2-1. 필요한 조회가 두 가지다

- **조회 1**: “이 **먼슬리**에 연결된 프로젝트가 뭐지?”  
  → Monthly 기준으로 프로젝트 목록이 필요함.
- **조회 2**: “이 **프로젝트**가 어떤 먼슬리들에 연결돼 있지?”  
  → Project 기준으로 먼슬리 목록이 필요함.

### 2-2. 진실을 “한 곳”에만 두면 생기는 일

**Case A: 진실을 Monthly에만 둔다 (Monthly.connectedProjects만 유지)**

- “이 먼슬리의 연결 프로젝트” → Monthly 문서 하나만 읽으면 됨. ✅
- “이 프로젝트가 연결된 먼리들” → **모든 Monthly를 다 읽어서**, 각 문서의 connectedProjects에 이 projectId가 있는지 확인해야 함. ❌ (비효율)

**Case B: 진실을 Project에만 둔다 (Project.connectedMonthlies만 유지)**

- “이 프로젝트의 연결 먼슬리” → Project 문서 하나만 읽으면 됨. ✅
- “이 먼슬리에 연결된 프로젝트” → **projects 컬렉션을 쿼리**해서 `connectedMonthlies` 배열에 이 monthlyId가 포함된 문서를 찾으면 됨. ✅ (인덱스만 있으면 효율적)

NoSQL(Firestore)에서는 “배열 필드에 값이 포함된 문서 찾기” 쿼리가 잘 지원됩니다.  
그래서 **진실을 Project 쪽 한 곳(connectedMonthlies)에만 두고**, “먼슬리 기준 목록”은 **쿼리**로 해결하는 방식이 가능합니다.  
즉, **단방향(Project만 SSOT)** 으로도 설계할 수 있습니다.

### 2-3. 그런데 문서/코드가 “양방향”을 말하는 이유

- **과거 설계/문서**에서는 “Monthly에도 연결 목록(connectedProjects)을 두고, Project에도 connectedMonthlies를 둔다”고 했고,
- **쓰기 시** “먼슬리에서 프로젝트를 고르면” → Monthly 쪽을 바꾸고, 동시에 선택된 프로젝트들의 connectedMonthlies도 갱신해 **두 곳을 맞춰 두자**고 한 상태입니다.

즉 “양방향”은 **“두 군데가 서로 다른 진실”**이라서 트랜잭션이 필요한 게 아니라,  
**“한 번 쓸 때 두 군데를 같은 내용으로 맞춰 두자”**는 **동기화 규칙**입니다.  
한쪽만 진실(SSOT)로 정하고 반대쪽은 “캐시/뷰”처럼 생각하면, “양방향 유지 = 쓰기 시 두 문서를 같이 갱신”으로 이해하면 됩니다.

**정리**:  
- “SSOT라서 트랜잭션 오류가 안 생긴다”는 맞고,  
- 여기서는 “진실을 Monthly에 둘지, Project에 둘지”를 정한 뒤,  
  - **Project만 SSOT**로 가면: 상세는 쿼리, 수정은 “수정 시 Project.connectedMonthlies만 갱신”으로도 가능하고,  
  - **두 곳 다 맞춰 두기(양방향)** 로 가면: 쓰기 시 Monthly + Project 둘 다 갱신해서 “두 조회 모두 효율적으로” 만드는 선택입니다.

---

## 3. SQL이었으면 어떻게 했을까요? NoSQL이어서 이렇게 된 건가요?

**관계만 보면 SQL에서도 “다대다 관계”는 보통 테이블 하나(연결 테이블)로 만듭니다.**

예:

- `monthlies` (먼슬리)
- `projects` (프로젝트)
- `monthly_project` (연결 테이블: monthly_id, project_id, monthly_target_count, monthly_done_count …)

“이 먼슬리의 프로젝트” → `monthly_project`에서 monthly_id로 조인해서 조회.  
“이 프로젝트의 먼슬리” → `monthly_project`에서 project_id로 조인해서 조회.  
**진실의 원천은 연결 테이블 하나**이고, 트랜잭션도 “연결 테이블 + 필요하면 monthly/project”만 갱신하면 됩니다.

NoSQL(Firestore)에서는 “연결 전용 컬렉션”을 따로 두지 않고, **어느 문서에 배열을 둘지** 선택하게 됩니다.

- **한쪽 문서에만** 두면 → 위에서 말한 “한쪽 조회가 비효율” 문제가 생길 수 있고,
- **양쪽 문서에 맞춰 둔다**면 → “쓸 때 두 문서를 같이 갱신”해 주어야 해서, **SQL의 연결 테이블을 “두 문서에 나눠서 복제”한 형태**라고 보면 됩니다.

그래서:

- **“Single source of truth” 원칙**은 SQL이든 NoSQL이든 동일하게 적용됩니다.
- **NoSQL이라서** “연결 테이블 대신 Monthly/Project 문서에 배열을 두고, 조회 편의를 위해 두 군데 다 갱신하는 패턴”을 쓰는 것이지, “NoSQL이니까 SSOT를 포기한 것”은 아닙니다.  
  → “진실은 한쪽(또는 연결 테이블)에 있고, 다른 쪽은 그걸 반영한 복제”라고 보면 됩니다.

---

## 4. connectedProjects가 있는데 quickAccessProjects는 왜 있나요? 필요한가요?

**문서와 타입을 보면 두 개념이 섞여 있습니다.**

- **firestore-dataflow.md**  
  - 다이어그램: Monthly에 `connectedProjects[]` (객체: projectId, monthlyTargetCount, monthlyDoneCount)  
  - Monthlies 상세: `quickAccessProjects?: string[]` (프로젝트 ID 배열만)
- **lib/types.ts**  
  - `Monthly`에는 `quickAccessProjects?: string[]`만 있고, `connectedProjects`는 타입에 없음.

의도만 추측하면:

- **connectedProjects**: “이 먼슬리와의 연결” + **이번 달 목표/진행** (monthlyTargetCount, monthlyDoneCount)까지 포함한 **진짜 연결 데이터**.
- **quickAccessProjects**: “프로젝트 ID만 모아 둔 목록”, 스냅샷에는 안 넣고 UI 편의용으로만 쓴다는 식의 설명이 문서에 있었음.

그래서:

- **역할을 하나로 통일할 수 있습니다.**  
  - “연결된 프로젝트” 표시 + “먼슬리별 목표치”까지 관리하려면 **connectedProjects(객체 배열) 하나만** 두고,  
  - quickAccessProjects는 “레거시/편의용”으로 두거나 **제거**하고,  
  - **쓰기/읽기 모두 connectedProjects 기준**으로 하면 됩니다.
- **지금 코드**는 “수정/생성 시 quickAccessProjects만 쓰고, 상세는 Project.connectedMonthlies 쿼리”라서,  
  - 둘 다 유지할 **필요는 없고**,  
  - “connectedProjects 하나로 통일 + 필요하면 Project.connectedMonthlies 동기화”가 문서 의도와도 맞고, SSOT 관점에서도 더 단순합니다.

**결론**:  
- **quickAccessProjects는 “반드시 필요한 개념”이 아니다.**  
- **connectedProjects(객체 배열) 하나로 통일**하고,  
  - 저장 시: Monthly.connectedProjects 갱신 + 선택된 프로젝트들의 connectedMonthlies 갱신  
  - 조회: 상세는 기존처럼 쿼리 또는 Monthly.connectedProjects 기준  
  이렇게 가져가면, 문서와도 맞고 구조도 단순해집니다.

---

## 5. 그래서 지금 뭘 하면 되나요? (실무 정리)

**프로젝트 결정 (적용할 내용)**

- **1번 — 진실의 원천**: **Option A 채택.**  
  Monthly 기준 조회가 더 많을 것으로 보아, **Monthly.connectedProjects**를 SSOT로 두고,  
  Project.connectedMonthlies는 “이 먼슬리를 참조하는 프로젝트” 쿼리용 **동기화된 복제**로 유지한다.
- **2번 — 필드 통일**: **quickAccessProjects 제거, connectedProjects로 통일.**  
  타입·문서·코드에서 **connectedProjects(객체 배열)** 만 사용하고, quickAccessProjects는 제거한다.

---

**세부 정리**

1. **진실의 원천 (Option A 채택)**  
   - “연결 정보”의 진실 = **Monthly.connectedProjects**.  
   - 쓰기 시 **Project.connectedMonthlies**는 “이 먼슬리를 참조하는 프로젝트 목록” 쿼리를 위해 **동기화된 복제**로 유지.  
   - 먼슬리 기준 목록은 Monthly에서, 프로젝트 기준 목록은 Project 쿼리로 읽음.

2. **quickAccessProjects 정리 (connectedProjects로 통일)**  
   - 타입·문서·코드에서 **connectedProjects(객체 배열)** 만 사용.  
   - quickAccessProjects 필드는 제거. (필요 시 `connectedProjects.map(cp => cp.projectId)` 로 ID 목록은 파생.)

3. **쓰기 시 동기화**  
   - “먼슬리 수정/생성에서 프로젝트 선택을 저장”할 때,  
     - Monthly.connectedProjects 갱신  
     - (선택된 프로젝트) → connectedMonthlies에 이 monthlyId 추가  
     - (선택 해제된 프로젝트) → connectedMonthlies에서 이 monthlyId 제거  
     를 **한 번의 배치/트랜잭션**으로 처리하면, 상세와 수정이 항상 같은 목록을 보게 됩니다.

이렇게 하면 “Single source of truth를 지키면서, NoSQL 조회 패턴에 맞게 두 문서를 같이 갱신하는 구조”로 정리할 수 있고, 트랜잭션 오류를 피하려면 “쓰기 시 두 군데를 같은 트랜잭션/배치로 갱신”만 꼭 지키면 됩니다.
