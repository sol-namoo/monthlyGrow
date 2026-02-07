# 📚 Monthly Grow 학습 커리큘럼

이 문서는 Monthly Grow 프로젝트를 통해 학습할 수 있는 핵심 기술들에 대한 커리큘럼입니다.

---

## 1. Database - NoSQL Modeling

### 📖 학습 목표

- 관계형 데이터베이스 사고에서 벗어나 NoSQL 모델링 패턴 이해
- Denormalization(비정규화)을 통한 읽기 성능 최적화
- Firestore의 문서 기반 데이터 모델링 이해

### 🎯 기초 개념

#### 1.1 NoSQL vs 관계형 데이터베이스

- **관계형 DB**: 정규화된 데이터, JOIN을 통한 관계 조회
- **NoSQL (Firestore)**: 문서 기반, 중첩 구조, JOIN 없음
- **핵심 차이**: 읽기 성능을 위해 데이터 중복 허용

#### 1.2 Denormalization (비정규화)

- **정의**: 읽기 성능 향상을 위해 데이터를 중복 저장하는 기법
- **장점**:
  - JOIN 없이 한 번의 쿼리로 필요한 데이터 조회
  - 읽기 속도 향상
  - 클라이언트 측 복잡도 감소
- **단점**:
  - 데이터 일관성 관리 필요
  - 저장 공간 증가
  - 업데이트 시 여러 문서 수정 필요

#### 1.3 Firestore 데이터 모델링 원칙

1. **쿼리 패턴 중심 설계**: 어떻게 읽을지 먼저 생각
2. **사용자별 데이터 분리**: `userId`를 모든 문서에 포함
3. **서브컬렉션 활용**: 깊은 중첩 구조 활용
4. **배열 필드 활용**: `array-contains` 쿼리 지원

### 📂 학습할 코드 위치

#### 1.1 Denormalization 예시 - Area 정보 중복 저장

**스키마 정의:**

```12:19:monthlyGrow/lib/types.ts
export interface Resource {
  id: string;
  userId: string;
  name: string;
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  areaColor?: string; // Area 색상 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  description: string;
```

**설명:**

- `areaId`: 정규화된 참조 (Area 문서 ID)
- `area`, `areaColor`: 비정규화된 데이터 (Area 이름과 색상을 Resource에 직접 저장)
- UI에서 Area 정보를 표시할 때 추가 쿼리 없이 바로 사용 가능

**관련 문서:**

- `firestore-schema-reference.md` (88-89줄): Resource 스키마 설명
- `firestore-dataflow.md` (84-85줄): Denormalization 전략 설명

#### 1.2 Denormalization 예시 - Project에 Area 정보 저장

**스키마 정의:**

```27:34:monthlyGrow/lib/types.ts
export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string;
  category?: "repetitive" | "task_based"; // 프로젝트 유형
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
```

**실제 사용 예시:**

```44:45:monthlyGrow/lib/firebase/projects.ts
      areaId: data.areaId,
      area: data.area,
```

**설명:**

- Project를 조회할 때 Area 정보를 별도 쿼리 없이 바로 사용
- 프로젝트 목록 화면에서 Area 이름/색상을 즉시 표시 가능

**관련 문서:**

- `firestore-schema-reference.md` (117줄): Project 스키마의 denormalized 필드 설명
- `firestore-dataflow.md` (393-395줄): Denormalization 최적화 전략

#### 1.3 데이터 저장 시 Denormalization 적용

**코드 위치:**

```193:201:monthlyGrow/lib/saveAutoPlanToFirestore.ts
          transaction.set(resourceRef, {
            id: resourceRef.id,
            userId,
            name: resource.name,
            description: resource.description,
            areaId: areaIdMap[project.areaName],
            area: project.areaName, // denormalized
            areaColor: plan.areas.find((a) => a.name === project.areaName)
              ?.color,
```

**설명:**

- Resource 생성 시 `areaId`와 함께 `area`, `areaColor`도 함께 저장
- 이후 조회 시 Area 문서를 별도로 가져올 필요 없음

### 🎓 실습 과제

1. **현재 코드 분석**

   - `lib/firebase/projects.ts`에서 `area` 필드가 어떻게 사용되는지 확인
   - `lib/firebase/resources.ts`에서 denormalized 데이터 조회 패턴 확인

2. **Denormalization 추가 적용**

   - Monthly에 연결된 Project 정보를 Monthly 문서에 denormalized로 저장하는 방법 고려
   - Trade-off 분석: 저장 공간 vs 읽기 성능

3. **데이터 일관성 관리** ⚠️
   - Area 이름이 변경될 때 관련된 모든 Project, Resource 문서 업데이트 방법 설계
   - Transaction/Batch를 활용한 일관성 유지 방법 학습
   - **심화 학습**: `DENORMALIZATION_CONSISTENCY.md` 참고
     - Denormalization의 실제 Trade-off 분석 (저장 공간 vs 읽기 성능 vs 쓰기 복잡도)
     - Area 이름 변경 시나리오별 작업량 분석
     - 대량 쓰기 작업 처리 방법 (Batch Write, 여러 Batch 분할)
     - 부분적 Denormalization 전략 등 다양한 해결 방안

---

## 2. Performance - DB Indexing

### 📖 학습 목표

- Firestore 인덱스의 작동 원리 이해
- 복합 인덱스(Composite Index) 설계 및 설정
- 복잡한 필터링 쿼리를 위한 인덱스 최적화

### 🎯 기초 개념

#### 2.1 Firestore 인덱스 기본

- **단일 필드 인덱스**: 자동 생성 (기본 필드)
- **복합 인덱스**: 여러 필드를 조합한 인덱스 (수동 설정 필요)
- **인덱스 필요 조건**:
  - `where()` + `orderBy()` 조합
  - 여러 필드에 대한 `where()` 조건
  - `array-contains` + 다른 필드 조합

#### 2.2 인덱스 설계 원칙

1. **쿼리 패턴 분석**: 자주 사용되는 쿼리 패턴 파악
2. **필드 순서**: 등호 필터 → 범위 필터 → 정렬 필드 순서
3. **ASCENDING vs DESCENDING**: 정렬 방향에 맞는 인덱스 필요
4. **Collection Group**: 서브컬렉션 전체 검색 시 필요

#### 2.3 인덱스 제약사항

- **복합 쿼리 제약**: Firestore는 제한된 쿼리 패턴만 지원
- **클라이언트 필터링**: 복잡한 조건은 클라이언트에서 필터링 필요
- **인덱스 생성 시간**: 대량 데이터의 경우 인덱스 생성에 시간 소요

### 📂 학습할 코드 위치

#### 2.1 인덱스 설정 파일

**파일 위치:**

- `firestore.indexes.json`: 모든 복합 인덱스 정의

**주요 인덱스 예시:**

**1. Projects - userId + createdAt (정렬)**

```119:144:monthlyGrow/firestore.indexes.json
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    },
```

**설명:**

- `userId`로 필터링 + `createdAt`로 정렬하는 쿼리를 지원
- ASCENDING과 DESCENDING 각각 별도 인덱스 필요

**2. Monthlies - userId + startDate + endDate (복합 조건)**

```82:116:monthlyGrow/firestore.indexes.json
    {
      "collectionGroup": "monthlies",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "endDate",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "monthlies",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "endDate",
          "order": "DESCENDING"
        }
      ]
    },
```

**설명:**

- 기간 범위 쿼리를 위한 3개 필드 복합 인덱스
- startDate와 endDate의 정렬 방향 조합에 따라 별도 인덱스 필요

**3. Tasks - Collection Group 인덱스**

```202:218:monthlyGrow/firestore.indexes.json
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        {
          "fieldPath": "projectId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "done",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "date",
          "order": "ASCENDING"
        }
      ]
    },
```

**설명:**

- `COLLECTION_GROUP` 스코프: 모든 서브컬렉션의 tasks를 검색
- `projects/{projectId}/tasks` 구조에서 모든 프로젝트의 태스크를 한 번에 조회 가능

**4. Unified Archives - userId + type + createdAt (필터 + 정렬)**

```262:278:monthlyGrow/firestore.indexes.json
    {
      "collectionGroup": "unified_archives",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "userId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "type",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "createdAt",
          "order": "DESCENDING"
        }
      ]
    }
```

**설명:**

- 타입별로 필터링하고 생성일 기준 정렬하는 쿼리 지원
- 아카이브 목록에서 특정 타입만 보기 기능에 사용

#### 2.2 인덱스를 사용하는 쿼리 코드

**1. Projects - userId + createdAt 정렬**

```26:33:monthlyGrow/lib/firebase/projects.ts
export const fetchAllProjectsByUserId = async (
  userId: string
): Promise<Project[]> => {
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
```

**인덱스 매칭:**

- `firestore.indexes.json`의 `projects` - `userId` + `endDate` (DESCENDING) 인덱스 사용

**2. Unified Archives - 복합 필터 + 정렬**

```19:60:monthlyGrow/lib/firebase/unified-archives.ts
export const fetchUnifiedArchivesWithPaging = async (
  userId: string,
  pageSize: number = 20,
  lastDoc?: any,
  filter?: "all" | "monthly" | "project" | "retrospective" | "note"
): Promise<{ archives: UnifiedArchive[]; lastDoc: any; hasMore: boolean }> => {
  try {
    let archivesQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId)
    );

    // 필터 적용
    if (filter === "monthly") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_retrospective", "monthly_note"])
      );
    } else if (filter === "project") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["project_retrospective", "project_note"])
      );
    } else if (filter === "retrospective") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_retrospective", "project_retrospective"])
      );
    } else if (filter === "note") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_note", "project_note"])
      );
    }

    // 정렬 및 페이징 (생성일 기준)
    archivesQuery = query(
      archivesQuery,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );
```

**인덱스 매칭:**

- `userId` + `type` + `createdAt` (DESCENDING) 인덱스 필요
- `firestore.indexes.json`의 262-278줄 인덱스 사용

**3. Monthlies - 날짜 범위 쿼리 (클라이언트 필터링)**

```170:204:monthlyGrow/lib/firebase/monthlies.ts
export const findMonthlyByMonth = async (
  userId: string,
  year: number,
  month: number
): Promise<Monthly | null> => {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // 기존 인덱스를 사용하는 단순한 쿼리
  const q = query(
    collection(db, "monthlies"),
    where("userId", "==", userId),
    orderBy("startDate", "asc")
  );
  const querySnapshot = await getDocs(q);

  // 클라이언트에서 필터링
  const monthlies = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Monthly;
  });

  // 해당 월과 겹치는 먼슬리 찾기
  const matchingMonthly = monthlies.find((monthly) => {
    return monthly.startDate <= endOfMonth && monthly.endDate >= startOfMonth;
  });

  return matchingMonthly || null;
};
```

**설명:**

- Firestore는 날짜 범위 교집합 쿼리를 직접 지원하지 않음
- 인덱스를 사용해 모든 데이터를 가져온 후 클라이언트에서 필터링
- 데이터가 많아지면 성능 이슈 가능 → 스냅샷 기반 접근 권장

#### 2.3 인덱스가 필요한 쿼리 패턴

**Projects - 복잡한 필터링 (인덱스 제약으로 클라이언트 필터링)**

```65:128:monthlyGrow/lib/firebase/projects.ts
export const fetchProjectsOverlappingWithMonthly = async (
  userId: string,
  monthlyStartDate: Date,
  monthlyEndDate: Date
): Promise<Project[]> => {
  // Firestore 복합 쿼리 제약으로 인해 모든 프로젝트를 가져온 후 클라이언트에서 필터링
  const q = query(
    collection(db, "projects"),
    where("userId", "==", userId),
    orderBy("endDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  const allProjects = querySnapshot.docs.map((doc) => {
    // ... 데이터 변환
  });

  // 먼슬리 기간과 겹치는 프로젝트만 필터링
  const filteredProjects = allProjects.filter((project) => {
    // 날짜 겹침 로직
    const overlaps =
      projectStartStr <= monthlyEndStr && projectEndStr >= monthlyStartStr;
    return overlaps;
  });

  return filteredProjects;
};
```

**설명:**

- 날짜 범위 교집합은 Firestore에서 직접 쿼리 불가
- 인덱스를 사용해 가능한 데이터를 가져온 후 클라이언트에서 필터링
- 대안: Monthly의 `connectedProjects` 배열 활용

### 🎓 실습 과제

1. **인덱스 분석**

   - `firestore.indexes.json`의 각 인덱스가 어떤 쿼리를 지원하는지 매핑
   - 실제 쿼리 코드와 인덱스의 관계 파악

2. **새로운 인덱스 추가**

   - 새로운 쿼리 패턴이 필요할 때 인덱스 추가 방법 학습
   - Firebase Console에서 인덱스 생성 또는 `firestore.indexes.json` 수정

3. **쿼리 최적화**

   - 현재 클라이언트 필터링을 사용하는 쿼리를 인덱스로 최적화 가능한지 검토
   - Trade-off 분석: 인덱스 수 vs 쿼리 성능

4. **인덱스 성능 모니터링**
   - Firebase Console에서 인덱스 사용량 확인
   - 불필요한 인덱스 제거 고려

---

## 3. Security - Security Rules

### 📖 학습 목표

- Firestore Security Rules를 통한 클라이언트 측 데이터 접근 제어
- 사용자별 데이터 격리 구현
- 보안 규칙 작성 및 테스트 방법

### 🎯 기초 개념

#### 3.1 Firestore Security Rules 기본

- **목적**: 클라이언트에서 직접 DB 접근 시 보안 보장
- **실행 위치**: Firestore 서버 측에서 실행
- **언어**: JavaScript-like 문법 (제한적)
- **검증 시점**: 모든 읽기/쓰기 요청 전에 검증

#### 3.2 보안 규칙 구조

```javascript
match /collection/{documentId} {
  allow read: if condition;
  allow write: if condition;
  allow create: if condition;
  allow update: if condition;
  allow delete: if condition;
}
```

#### 3.3 주요 보안 패턴

1. **인증 확인**: `request.auth != null`
2. **소유자 확인**: `request.auth.uid == resource.data.userId`
3. **필드 검증**: `request.resource.data.field` 검증
4. **데이터 무결성**: 필수 필드 존재 여부 확인

#### 3.4 보안 규칙 제약사항

- **복잡한 로직 제한**: 간단한 조건문만 가능
- **외부 API 호출 불가**: 순수한 데이터 검증만 가능
- **성능**: 모든 요청에 대해 실행되므로 단순해야 함

**💡 심화 학습**: `SECURITY_AND_AUTHENTICATION.md` 참고

- 인증(Authentication)과 인가(Authorization)의 차이
- Firebase Authentication 작동 원리 (JWT 토큰, 인증 플로우)
- Security Rules가 왜 필요한가? (클라이언트 보안의 한계)
- 실제 공격 시나리오와 방어 방법
- 보안 규칙 작성 모범 사례 (기본 거부, 세분화된 권한, 데이터 검증)
- 프로젝트 보안 구조 분석 및 체크리스트

### 📂 학습할 코드 위치

#### 3.1 현재 보안 규칙 파일

**파일 위치:**

- `firestore.rules`: 모든 보안 규칙 정의

**현재 규칙 (개발 모드 - 모든 접근 허용):**

```31:55:monthlyGrow/firestore.rules
  service cloud.firestore {
  match /databases/{database}/documents {

    // 🔐 먼슬리 정보
    match /monthlies/{monthlyId} {
      allow read, write: if true;    }

    // 🔐 프로젝트 정보
    match /projects/{projectId} {
      allow read, write: if true;    }

    // 🔐 태스크 정보
    match /tasks/{taskId} {
      allow read, write: if true;    }

    // 🔐 사용자 프로필 (optional)
    match /users/{userId} {
      allow read, write: if true;    }

    // 🔒 나머지는 차단
    match /{document=**} {
      allow read, write: if true;

    }
  }
}
```

**⚠️ 주의**: 현재는 개발 모드로 모든 접근이 허용되어 있습니다. 프로덕션에서는 반드시 보안 규칙을 적용해야 합니다.

#### 3.2 권장 보안 규칙 (주석 처리된 코드)

**파일 위치:**

- `firestore.rules` (1-29줄): 주석 처리된 보안 규칙

**권장 규칙:**

```1:29:monthlyGrow/firestore.rules
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {

//     // 🔐 먼슬리 정보
//     match /monthlies/{monthlyId} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//     }

//     // 🔐 프로젝트 정보
//     match /projects/{projectId} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//     }

//     // 🔐 태스크 정보
//     match /tasks/{taskId} {
//       allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
//     }

//     // 🔐 사용자 프로필 (optional)
//     match /users/{userId} {
//       allow read, write: if request.auth != null && request.auth.uid == userId;
//     }

//     // 🔒 나머지는 차단
//     match /{document=**} {
//       allow read, write: if false;
//     }
//   }}
```

**규칙 설명:**

1. **인증 확인**: `request.auth != null`

   - 로그인한 사용자만 접근 가능

2. **소유자 확인**: `request.auth.uid == resource.data.userId`

   - 자신의 데이터만 읽기/쓰기 가능
   - `resource.data`: 기존 문서 데이터
   - `request.resource.data`: 새로 작성/수정할 데이터

3. **기본 거부**: `allow read, write: if false`
   - 명시적으로 허용하지 않은 모든 접근 차단

#### 3.3 스키마 문서의 보안 규칙 설명

**문서 위치:**

- `firestore-schema-reference.md` (506-538줄)

**기본 규칙:**

````510:516:monthlyGrow/firestore-schema-reference.md
### Basic Rules

```javascript
// Applied to all collections
match /{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
````

````

**컬렉션별 규칙:**
```520:538:monthlyGrow/firestore-schema-reference.md
### Collection-Specific Rules

```javascript
// Areas collection
match /areas/{areaId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}

// Projects collection
match /projects/{projectId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}

// Monthlies collection
match /monthlies/{monthlyId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
````

````

#### 3.4 고급 보안 패턴

**1. 생성 시 userId 검증**
```javascript
match /projects/{projectId} {
  // 읽기: 소유자만
  allow read: if request.auth != null &&
              request.auth.uid == resource.data.userId;

  // 생성: userId가 요청자의 uid와 일치해야 함
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid;

  // 수정: 소유자만, userId 변경 불가
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId &&
                request.resource.data.userId == resource.data.userId;

  // 삭제: 소유자만
  allow delete: if request.auth != null &&
                request.auth.uid == resource.data.userId;
}
````

**2. 필수 필드 검증**

```javascript
match /projects/{projectId} {
  allow create: if request.auth != null &&
                request.resource.data.userId == request.auth.uid &&
                request.resource.data.title is string &&
                request.resource.data.title.size() > 0 &&
                request.resource.data.createdAt is timestamp;
}
```

**3. 서브컬렉션 보안**

```javascript
match /projects/{projectId} {
  allow read, write: if request.auth != null &&
                     request.auth.uid == resource.data.userId;

  // 서브컬렉션: tasks
  match /tasks/{taskId} {
    allow read, write: if request.auth != null &&
                       request.auth.uid == get(/databases/$(database)/documents/projects/$(projectId)).data.userId;
  }
}
```

**4. 배열 필드 검증**

```javascript
match /monthlies/{monthlyId} {
  allow update: if request.auth != null &&
                request.auth.uid == resource.data.userId &&
                // connectedProjects 배열 크기 제한
                request.resource.data.connectedProjects.size() <= 5;
}
```

### 🎓 실습 과제

1. **현재 보안 규칙 분석**

   - `firestore.rules` 파일의 현재 상태 확인
   - 주석 처리된 보안 규칙을 활성화하는 방법 학습

2. **보안 규칙 작성**

   - 각 컬렉션에 대한 상세 보안 규칙 작성
   - 생성/수정/삭제 각각에 대한 규칙 분리
   - 필수 필드 검증 추가

3. **보안 규칙 테스트**

   - Firebase Emulator를 사용한 로컬 테스트
   - 다양한 시나리오 테스트:
     - 인증되지 않은 사용자 접근 차단
     - 다른 사용자 데이터 접근 차단
     - 잘못된 데이터 생성 차단

4. **보안 규칙 최적화**

   - 불필요한 규칙 제거
   - 규칙 성능 최적화 (단순한 조건 우선)

5. **데이터 무결성 보장**
   - `userId` 필드가 항상 요청자의 uid와 일치하는지 검증
   - `createdAt`, `updatedAt` 타임스탬프 검증
   - 필수 필드 존재 여부 확인

---

## 📚 추가 학습 자료

### 공식 문서

- [Firestore 데이터 모델링 가이드](https://firebase.google.com/docs/firestore/data-model)
- [Firestore 인덱스 가이드](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore 보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)

### 프로젝트 내 문서

- `firestore-schema-reference.md`: 전체 스키마 정의 및 관계 설명
- `firestore-dataflow.md`: 데이터 흐름 및 최적화 전략
- `learning/DENORMALIZATION_CONSISTENCY.md`: Denormalization과 데이터 일관성 관리 심화 학습 ⭐
- `learning/INDEXING_FUNDAMENTALS.md`: 인덱싱 기초부터 Firestore까지 완전 정리 ⭐
- `learning/NOSQL_CHOICE_AND_PERFORMANCE.md`: NoSQL 선택의 적절성과 성능 분석 ⭐
- `learning/SECURITY_AND_AUTHENTICATION.md`: 보안과 인증 완전 정리 ⭐

### 코드 파일

- `lib/firebase/*.ts`: 각 컬렉션별 CRUD 함수
- `firestore.indexes.json`: 모든 인덱스 정의
- `firestore.rules`: 보안 규칙 정의

---

## 🎯 학습 체크리스트

### NoSQL Modeling

- [ ] Denormalization 개념 이해
- [ ] 프로젝트 내 denormalization 패턴 파악
- [ ] 새로운 denormalization 패턴 설계
- [ ] 데이터 일관성 관리 방법 학습

### DB Indexing

- [ ] Firestore 인덱스 기본 개념 이해
- [ ] 복합 인덱스 설계 원칙 학습
- [ ] 현재 인덱스와 쿼리 매핑 분석
- [ ] 새로운 인덱스 추가 및 테스트

### Security Rules

- [ ] 보안 규칙 기본 문법 학습
- [ ] 현재 보안 규칙 분석 및 개선
- [ ] 각 컬렉션별 상세 규칙 작성
- [ ] 보안 규칙 테스트 및 검증

---

**작성일**: 2024년
**프로젝트**: Monthly Grow
**목적**: Firestore 관련 핵심 기술 학습 커리큘럼
