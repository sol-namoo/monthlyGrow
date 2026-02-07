# 🔄 Denormalization과 데이터 일관성 관리 심화 학습

## 📋 목차
1. [현재 문제점 분석](#현재-문제점-분석)
2. [Trade-off 상세 분석](#trade-off-상세-분석)
3. [실제 시나리오: Area 이름 변경](#실제-시나리오-area-이름-변경)
4. [해결 방안들](#해결-방안들)
5. [실제 구현 예시](#실제-구현-예시)

---

## 현재 문제점 분석

### 🔍 현재 구현 상태

**Area 업데이트 함수:**
```182:197:monthlyGrow/lib/firebase/areas.ts
export const updateArea = async (
  areaId: string,
  updateData: Partial<Omit<Area, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "areas", areaId), filteredData);
  } catch (error) {
    console.error("영역 업데이트 실패:", error);
    throw new Error("areaUpdateFailed");
  }
};
```

**문제점:**
- ✅ Area 문서는 업데이트됨
- ❌ Project의 `area` 필드는 업데이트되지 않음
- ❌ Resource의 `area`, `areaColor` 필드는 업데이트되지 않음
- **결과**: 데이터 불일치 발생!

### 📊 데이터 불일치 예시

**시나리오:**
1. Area "건강" 생성 → Project에 `area: "건강"` 저장
2. Area 이름을 "헬스케어"로 변경
3. Area 문서: `name: "헬스케어"` ✅
4. Project 문서: `area: "건강"` ❌ (구 이름 유지)
5. **UI에서 Project를 보면 "건강"으로 표시됨** (실제 Area는 "헬스케어")

### 🔗 Denormalized 필드 위치

**Project 스키마:**
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

**Resource 스키마:**
```13:19:monthlyGrow/lib/types.ts
export interface Resource {
  id: string;
  userId: string;
  name: string;
  areaId?: string;
  area?: string; // Area 이름 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
  areaColor?: string; // Area 색상 (denormalized - DB에 저장되지 않고 쿼리 시 함께 제공)
```

---

## Trade-off 상세 분석

### 💡 단순한 Trade-off가 아니다!

일반적으로 Denormalization의 Trade-off는:
- ✅ **읽기 성능 향상**: JOIN 없이 한 번의 쿼리로 데이터 조회
- ❌ **저장 공간 증가**: 데이터 중복 저장

**하지만 실제로는 훨씬 복잡합니다!**

### 📈 실제 Trade-off 분석

#### 1. 읽기 성능 vs 쓰기 복잡도

| 항목 | 정규화 (Normalized) | 비정규화 (Denormalized) |
|------|-------------------|----------------------|
| **읽기 쿼리 수** | 2-3개 (Area 조회 + Project 조회) | 1개 (Project만 조회) |
| **읽기 속도** | 느림 (여러 쿼리) | 빠름 (단일 쿼리) |
| **쓰기 작업** | 1개 문서 업데이트 | **N개 문서 업데이트** |
| **쓰기 복잡도** | 낮음 | **매우 높음** |
| **데이터 일관성** | 자동 보장 | **수동 관리 필요** |

#### 2. Area 이름 변경 시 실제 작업량

**시나리오: 사용자가 100개의 Project와 50개의 Resource를 가진 Area 이름 변경**

```
정규화 방식:
- Area 문서 1개 업데이트
- 총 1번의 쓰기 작업

비정규화 방식:
- Area 문서 1개 업데이트
- Project 문서 100개 업데이트 (area 필드)
- Resource 문서 50개 업데이트 (area, areaColor 필드)
- 총 151번의 쓰기 작업! 😱
```

#### 3. 비용 분석

**Firestore 쓰기 비용:**
- 문서 쓰기: $0.18 per 100K operations
- 151번 쓰기 = 약 $0.00027 (매우 작지만...)
- **하지만 사용자가 많아지면?**

**사용자 1,000명 × Area 5개 × 평균 50개 Project = 250,000번 쓰기**
- 비용: 약 $0.45
- **하지만 더 큰 문제는...**

#### 4. 실제 문제: 성능과 제약사항

**Firestore 제약사항:**
- **Batch Write**: 최대 500개 작업
- **Transaction**: 최대 500개 작업, 타임아웃 제한
- **쓰기 속도**: 초당 제한 있음

**Area 이름 변경 시:**
```typescript
// 만약 600개의 Project가 있다면?
// → Batch Write로는 불가능! (500개 제한)
// → 여러 Batch로 나눠야 함
// → 중간에 실패하면? 일부만 업데이트됨! 😱
```

---

## 실제 시나리오: Area 이름 변경

### 🎯 시나리오 1: 소규모 사용자

**상황:**
- Project: 10개
- Resource: 5개
- Area 이름: "건강" → "헬스케어"

**필요한 작업:**
1. Area 문서 업데이트 (1개)
2. Project 문서 업데이트 (10개) - `area` 필드
3. Resource 문서 업데이트 (5개) - `area`, `areaColor` 필드
4. **총 16번의 쓰기 작업**

**해결 방법:**
- ✅ 단일 Transaction으로 처리 가능
- ✅ 원자성 보장 (모두 성공 or 모두 실패)

### 🎯 시나리오 2: 중규모 사용자

**상황:**
- Project: 200개
- Resource: 100개
- Area 이름: "건강" → "헬스케어"

**필요한 작업:**
1. Area 문서 업데이트 (1개)
2. Project 문서 업데이트 (200개)
3. Resource 문서 업데이트 (100개)
4. **총 301번의 쓰기 작업**

**문제점:**
- ❌ 단일 Batch 불가능 (500개 제한이지만 안전하게 400개 이하 권장)
- ❌ 여러 Batch로 나눠야 함
- ❌ 중간 실패 시 부분 업데이트 가능성

### 🎯 시나리오 3: 대규모 사용자

**상황:**
- Project: 1,000개
- Resource: 500개
- Area 이름: "건강" → "헬스케어"

**필요한 작업:**
- **총 1,501번의 쓰기 작업**

**문제점:**
- ❌ 여러 Batch로 나눠야 함 (최소 4개 Batch)
- ❌ 처리 시간: 수 초 ~ 수십 초
- ❌ 사용자 대기 시간 증가
- ❌ 중간 실패 시 복구 복잡

### 🎯 시나리오 4: Area 색상 변경

**상황:**
- Project: 100개 (색상 미사용)
- Resource: 50개 (색상 사용)
- Area 색상: "#3B82F6" → "#8B5CF6"

**필요한 작업:**
- Area 문서 업데이트 (1개)
- Resource 문서 업데이트 (50개) - `areaColor` 필드만
- **총 51번의 쓰기 작업**

**차이점:**
- Project는 색상을 저장하지 않으므로 업데이트 불필요
- Resource만 업데이트하면 됨

---

## 해결 방안들

### 방안 1: Batch Write를 사용한 일관성 유지 ⭐ (권장)

**장점:**
- 원자성 보장 (모두 성공 or 모두 실패)
- 500개까지 한 번에 처리 가능
- 구현이 비교적 간단

**단점:**
- 500개 초과 시 여러 Batch 필요
- 중간 실패 시 복구 복잡

**구현 예시:**
```typescript
// 다음 섹션에서 상세 구현 코드 제공
```

### 방안 2: Transaction을 사용한 원자성 보장

**장점:**
- 완벽한 원자성 보장
- 동시성 제어 자동 처리

**단점:**
- 500개 제한
- 타임아웃 제한 (약 60초)
- 성능 저하 가능성

### 방안 3: 부분적 Denormalization

**전략:**
- 자주 변경되지 않는 필드만 Denormalize
- 예: Area 이름은 변경 가능하므로 Denormalize 하지 않음
- Area 색상은 거의 변경되지 않으므로 Denormalize 유지

**구현:**
```typescript
// Project 스키마
interface Project {
  areaId: string;        // ✅ 항상 유지 (참조)
  areaColor?: string;    // ✅ Denormalize (거의 변경 안 됨)
  // area?: string;      // ❌ Denormalize 제거 (자주 변경됨)
}
```

**장점:**
- 쓰기 작업 최소화
- 일관성 문제 감소

**단점:**
- 읽기 시 Area 이름 조회 필요 (추가 쿼리 1개)
- 읽기 성능 약간 저하

### 방안 4: Lazy Update (지연 업데이트)

**전략:**
- Area 변경 시 즉시 업데이트하지 않음
- 읽기 시 denormalized 필드가 오래되었으면 업데이트

**구현:**
```typescript
// Area에 버전 필드 추가
interface Area {
  name: string;
  version: number;  // 변경될 때마다 증가
}

// Project에 Area 버전 저장
interface Project {
  areaId: string;
  area?: string;
  areaVersion?: number;  // 마지막으로 동기화된 버전
}

// 읽기 시 버전 확인
if (project.areaVersion !== area.version) {
  // 업데이트 필요
  updateProjectArea(project.id, area);
}
```

**장점:**
- 쓰기 작업 분산
- 사용자 대기 시간 감소

**단점:**
- 구현 복잡도 증가
- 일시적 불일치 허용
- 읽기 시 추가 로직 필요

### 방안 5: Cloud Function을 사용한 백그라운드 업데이트

**전략:**
- Area 변경 시 Cloud Function 트리거
- 백그라운드에서 관련 문서 업데이트

**장점:**
- 사용자 대기 시간 없음
- 대량 업데이트 처리 가능
- 재시도 로직 구현 용이

**단점:**
- Cloud Function 비용
- 구현 복잡도 높음
- 일시적 불일치 허용

### 방안 6: Denormalization 완전 제거

**전략:**
- 모든 denormalized 필드 제거
- 읽기 시 항상 Area 조회

**장점:**
- 일관성 문제 완전 해결
- 구현 단순화

**단점:**
- 읽기 성능 저하
- 추가 쿼리 필요
- UI 렌더링 지연 가능

---

## 실제 구현 예시

### 구현 1: Batch Write를 사용한 Area 업데이트 (기본)

```typescript
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  updateDoc 
} from "firebase/firestore";
import { db } from "./config";

export const updateAreaWithConsistency = async (
  areaId: string,
  updateData: Partial<Area>
): Promise<void> => {
  const batch = writeBatch(db);
  const areaRef = doc(db, "areas", areaId);
  
  // 1. Area 문서 업데이트
  batch.update(areaRef, {
    ...updateData,
    updatedAt: new Date(),
  });

  // 2. 관련 Project 문서 조회 및 업데이트
  if (updateData.name || updateData.color) {
    const projectsQuery = query(
      collection(db, "projects"),
      where("areaId", "==", areaId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);

    projectsSnapshot.docs.forEach((projectDoc) => {
      const updateFields: any = {};
      
      if (updateData.name) {
        updateFields.area = updateData.name;
      }
      // Project는 color를 저장하지 않으므로 제외
      
      if (Object.keys(updateFields).length > 0) {
        batch.update(projectDoc.ref, {
          ...updateFields,
          updatedAt: new Date(),
        });
      }
    });

    // 3. 관련 Resource 문서 조회 및 업데이트
    const resourcesQuery = query(
      collection(db, "resources"),
      where("areaId", "==", areaId)
    );
    const resourcesSnapshot = await getDocs(resourcesQuery);

    resourcesSnapshot.docs.forEach((resourceDoc) => {
      const updateFields: any = {};
      
      if (updateData.name) {
        updateFields.area = updateData.name;
      }
      if (updateData.color) {
        updateFields.areaColor = updateData.color;
      }
      
      if (Object.keys(updateFields).length > 0) {
        batch.update(resourceDoc.ref, {
          ...updateFields,
          updatedAt: new Date(),
        });
      }
    });
  }

  // 4. Batch 커밋 (최대 500개 작업)
  await batch.commit();
};
```

**문제점:**
- 500개 초과 시 실패
- 에러 처리 부족

### 구현 2: 여러 Batch로 나누기 (개선)

```typescript
export const updateAreaWithConsistencyBatched = async (
  areaId: string,
  updateData: Partial<Area>
): Promise<{ success: boolean; updatedCount: number; errors: string[] }> => {
  const errors: string[] = [];
  let updatedCount = 0;
  const BATCH_LIMIT = 400; // 안전 마진 포함

  try {
    // 1. Area 문서 업데이트
    const areaRef = doc(db, "areas", areaId);
    await updateDoc(areaRef, {
      ...updateData,
      updatedAt: new Date(),
    });
    updatedCount++;

    if (!updateData.name && !updateData.color) {
      return { success: true, updatedCount, errors: [] };
    }

    // 2. 관련 Project 문서 조회
    const projectsQuery = query(
      collection(db, "projects"),
      where("areaId", "==", areaId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectDocs = projectsSnapshot.docs;

    // 3. 관련 Resource 문서 조회
    const resourcesQuery = query(
      collection(db, "resources"),
      where("areaId", "==", areaId)
    );
    const resourcesSnapshot = await getDocs(resourcesQuery);
    const resourceDocs = resourcesSnapshot.docs;

    // 4. Project 업데이트 (여러 Batch로 나누기)
    for (let i = 0; i < projectDocs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const batchDocs = projectDocs.slice(i, i + BATCH_LIMIT);

      batchDocs.forEach((projectDoc) => {
        const updateFields: any = {};
        
        if (updateData.name) {
          updateFields.area = updateData.name;
        }
        
        if (Object.keys(updateFields).length > 0) {
          batch.update(projectDoc.ref, {
            ...updateFields,
            updatedAt: new Date(),
          });
          updatedCount++;
        }
      });

      try {
        await batch.commit();
      } catch (error) {
        const errorMsg = `Project batch ${i / BATCH_LIMIT + 1} 실패: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    // 5. Resource 업데이트 (여러 Batch로 나누기)
    for (let i = 0; i < resourceDocs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const batchDocs = resourceDocs.slice(i, i + BATCH_LIMIT);

      batchDocs.forEach((resourceDoc) => {
        const updateFields: any = {};
        
        if (updateData.name) {
          updateFields.area = updateData.name;
        }
        if (updateData.color) {
          updateFields.areaColor = updateData.color;
        }
        
        if (Object.keys(updateFields).length > 0) {
          batch.update(resourceDoc.ref, {
            ...updateFields,
            updatedAt: new Date(),
          });
          updatedCount++;
        }
      });

      try {
        await batch.commit();
      } catch (error) {
        const errorMsg = `Resource batch ${i / BATCH_LIMIT + 1} 실패: ${error}`;
        errors.push(errorMsg);
        console.error(errorMsg);
      }
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors,
    };
  } catch (error) {
    const errorMsg = `Area 업데이트 실패: ${error}`;
    errors.push(errorMsg);
    console.error(errorMsg);
    return {
      success: false,
      updatedCount,
      errors,
    };
  }
};
```

### 구현 3: Transaction을 사용한 원자성 보장 (소규모)

```typescript
import { runTransaction } from "firebase/firestore";

export const updateAreaWithTransaction = async (
  areaId: string,
  updateData: Partial<Area>
): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    const areaRef = doc(db, "areas", areaId);
    const areaDoc = await transaction.get(areaRef);

    if (!areaDoc.exists()) {
      throw new Error("Area not found");
    }

    // Area 업데이트
    transaction.update(areaRef, {
      ...updateData,
      updatedAt: new Date(),
    });

    // 관련 Project 조회 및 업데이트
    if (updateData.name || updateData.color) {
      const projectsQuery = query(
        collection(db, "projects"),
        where("areaId", "==", areaId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      // Transaction 내에서는 getDocs 사용 불가!
      // 대신 모든 Project ID를 미리 조회해야 함
      // 또는 Transaction 외부에서 조회 후 Transaction 내부에서 업데이트
    }
  });
};
```

**⚠️ 주의:**
- Transaction 내부에서는 `getDocs` 사용 불가
- 미리 조회한 문서 참조만 사용 가능
- 500개 제한

### 구현 4: 부분적 Denormalization (권장 대안)

```typescript
// Area 이름은 Denormalize 하지 않음
interface Project {
  areaId: string;        // ✅ 참조만 유지
  areaColor?: string;    // ✅ Denormalize (거의 변경 안 됨)
  // area?: string;      // ❌ 제거
}

// 읽기 시 Area 이름 조회
export const fetchProjectWithArea = async (
  projectId: string
): Promise<Project & { areaName: string }> => {
  const project = await fetchProjectById(projectId);
  
  if (project.areaId) {
    const area = await fetchAreaById(project.areaId);
    return {
      ...project,
      areaName: area.name,
    };
  }
  
  return { ...project, areaName: "" };
};

// 여러 Project 조회 시 (배치 조회)
export const fetchProjectsWithAreas = async (
  userId: string
): Promise<(Project & { areaName: string })[]> => {
  const projects = await fetchAllProjectsByUserId(userId);
  const areaIds = [...new Set(projects.map(p => p.areaId).filter(Boolean))];
  
  // Area들을 한 번에 조회
  const areas = await Promise.all(
    areaIds.map(id => fetchAreaById(id))
  );
  const areaMap = new Map(areas.map(a => [a.id, a]));
  
  return projects.map(project => ({
    ...project,
    areaName: project.areaId ? areaMap.get(project.areaId)?.name || "" : "",
  }));
};
```

---

## 📊 비교표: 각 방안의 Trade-off

| 방안 | 쓰기 작업 | 읽기 성능 | 구현 복잡도 | 일관성 | 사용자 대기 | 비용 |
|------|----------|----------|------------|--------|------------|------|
| **1. Batch Write** | 많음 | 빠름 | 중간 | 높음 | 중간 | 중간 |
| **2. Transaction** | 많음 | 빠름 | 높음 | 매우 높음 | 중간 | 중간 |
| **3. 부분적 Denormalize** | 적음 | 중간 | 낮음 | 높음 | 빠름 | 낮음 |
| **4. Lazy Update** | 적음 | 빠름 | 높음 | 중간 | 빠름 | 낮음 |
| **5. Cloud Function** | 많음 | 빠름 | 매우 높음 | 중간 | 매우 빠름 | 높음 |
| **6. Denormalize 제거** | 없음 | 느림 | 낮음 | 매우 높음 | 빠름 | 매우 낮음 |

---

## 🎯 권장 사항

### 현재 프로젝트에 맞는 방안

**권장: 방안 3 (부분적 Denormalization) + 방안 1 (Batch Write)**

**이유:**
1. **Area 이름**: 자주 변경될 수 있으므로 Denormalize 제거
2. **Area 색상**: 거의 변경되지 않으므로 Denormalize 유지
3. **색상 변경 시**: Batch Write로 일관성 유지 (작업량 적음)

**구현 전략:**
```typescript
// 1. 스키마 수정
interface Project {
  areaId: string;
  // area?: string;  // 제거
}

interface Resource {
  areaId: string;
  areaColor?: string;  // 유지 (거의 변경 안 됨)
  // area?: string;     // 제거
}

// 2. 읽기 시 Area 이름 조회 (배치 최적화)
// 여러 Project 조회 시 Area를 한 번에 조회

// 3. 색상 변경 시 Batch Write 사용
// (작업량이 적으므로 문제 없음)
```

---

## 📚 추가 학습 자료

### Firestore 제약사항
- [Firestore Quotas and Limits](https://firebase.google.com/docs/firestore/quotas)
- [Firestore Batch Operations](https://firebase.google.com/docs/firestore/manage-data/transactions#batched-writes)

### 데이터 일관성 패턴
- [Firestore Data Modeling Best Practices](https://firebase.google.com/docs/firestore/data-model)
- [Denormalization in Firestore](https://firebase.google.com/docs/firestore/solutions/counters)

---

**작성일**: 2024년
**프로젝트**: Monthly Grow
**목적**: Denormalization과 데이터 일관성 관리 심화 학습

