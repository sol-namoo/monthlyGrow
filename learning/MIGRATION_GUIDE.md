# Denormalization 마이그레이션 가이드

이 문서는 denormalized 필드 마이그레이션 방법과 하위호환성에 대해 설명합니다.

## 📋 마이그레이션 필요 필드

다음 denormalized 필드들이 기존 데이터에 없을 수 있습니다:

### 1. Project

- `taskCounts`: `{ total, completed, pending }`
- `timeStats`: `{ completedTime, remainingTime }`
- `currentMonthlyProgress`: 현재 활성 Monthly 진행률 정보

### 2. Area

- `counts`: `{ projectCount, resourceCount }`

### 3. UnifiedArchive

- `parentTitle`: Monthly objective 또는 Project title
- `parentStartDate`: Monthly/Project startDate
- `parentEndDate`: Monthly/Project endDate
- `parentAreaName`: Project의 경우 area name

---

## ✅ 마이그레이션 스크립트 실행

### 실행 방법

```bash
npx tsx scripts/14-migrate-denormalized-fields.ts
```

### 스크립트 동작

1. **프로젝트 태스크 통계** (`taskCounts`, `timeStats`)

   - 모든 프로젝트의 서브컬렉션에서 태스크를 조회하여 통계 계산
   - 이미 `taskCounts`가 있는 프로젝트는 스킵

2. **프로젝트 현재 Monthly 진행률** (`currentMonthlyProgress`)

   - 각 프로젝트의 `connectedMonthlies`에서 활성 Monthly 찾기
   - Monthly의 `connectedProjects`에서 해당 프로젝트 정보 추출
   - 이미 `currentMonthlyProgress`가 있는 프로젝트는 스킵

3. **Area 카운트** (`counts`)

   - 각 Area에 속한 프로젝트와 리소스 수 계산
   - 이미 `counts`가 있는 Area는 스킵

4. **UnifiedArchive Parent 정보**
   - 각 아카이브의 `parentId`로 Monthly/Project 문서 조회
   - Parent 정보를 denormalize하여 저장
   - 이미 `parentTitle`이 있는 아카이브는 스킵

### 예상 실행 시간

- 프로젝트 수에 비례하여 증가
- 프로젝트 100개 기준 약 1-2분
- 프로젝트 1000개 기준 약 10-20분

### 주의사항

- **Firestore 읽기 비용**: 모든 프로젝트의 서브컬렉션을 조회하므로 읽기 비용이 발생합니다
- **실행 중 중단**: 스크립트 실행 중 중단되면 이미 처리된 데이터는 업데이트되어 있고, 나머지는 다음 실행 시 스킵됩니다
- **재실행 안전**: 이미 denormalized 필드가 있는 문서는 스킵하므로 재실행해도 안전합니다

---

## 🔄 하위호환성

현재 코드는 **완전한 하위호환성**을 제공합니다. denormalized 필드가 없는 기존 데이터도 정상적으로 작동합니다.

### 하위호환성 메커니즘

#### 1. `getTaskCountsForMultipleProjects`

**동작:**

- denormalized `taskCounts` 필드가 있으면 사용
- 없으면 서브컬렉션에서 실제 계산 (fallback)

**코드 위치:** `lib/firebase/tasks.ts`

```typescript
// denormalized 필드가 없는 프로젝트들은 서브컬렉션에서 계산 (하위호환성)
if (projectsNeedingCalculation.length > 0) {
  const fallbackCounts = await Promise.all(
    projectsNeedingCalculation.map(async (projectId) => {
      // 서브컬렉션 조회하여 계산
    })
  );
}
```

#### 2. `fetchAreaCountsByUserId`

**동작:**

- denormalized `counts` 필드가 있으면 사용
- 없으면 실제 쿼리로 계산 (fallback)

**코드 위치:** `lib/firebase/analytics.ts`

```typescript
// denormalized 필드가 없는 Area들은 실제 쿼리로 계산 (하위호환성)
if (areasNeedingCalculation.length > 0) {
  await Promise.all(
    areasNeedingCalculation.map(async ({ areaId, userId }) => {
      // 프로젝트/리소스 쿼리하여 계산
    })
  );
}
```

#### 3. `fetchArchivesByUserIdWithPaging`

**동작:**

- denormalized `parentTitle` 필드가 있으면 사용
- 없으면 parent 문서를 조회하여 정보 가져오기 (fallback)

**코드 위치:** `lib/firebase/analytics.ts`

```typescript
// denormalized 필드가 있으면 사용
if (archiveData.parentTitle) {
  // denormalized 필드 사용
} else {
  // fallback: Parent 문서 조회 (하위호환성)
  const monthlyRef = docRef(db, "monthlies", archiveData.parentId);
  const monthlySnap = await getDoc(monthlyRef);
  // ...
}
```

#### 4. `mapProjectData`

**동작:**

- denormalized 필드가 없으면 `undefined`로 처리
- UI에서 `undefined` 체크하여 표시/숨김 처리

**코드 위치:** `lib/firebase/projects.ts`

```typescript
taskCounts: data.taskCounts,  // 없으면 undefined
timeStats: data.timeStats,     // 없으면 undefined
currentMonthlyProgress: data.currentMonthlyProgress ? { ... } : undefined,
```

---

## 📊 마이그레이션 전략

### 옵션 1: 전체 마이그레이션 (권장)

**장점:**

- 모든 데이터가 denormalized 필드를 가지므로 성능 최적화
- 하위호환성 fallback 로직이 실행되지 않아 추가 쿼리 없음

**단점:**

- 초기 마이그레이션 시간 소요
- Firestore 읽기 비용 발생

**실행:**

```bash
npx tsx scripts/14-migrate-denormalized-fields.ts
```

### 옵션 2: 점진적 마이그레이션

**장점:**

- 서버 부하 분산
- 사용자가 데이터를 사용할 때마다 자동으로 마이그레이션

**단점:**

- 초기에는 하위호환성 fallback 로직이 실행되어 성능 저하
- 마이그레이션이 완료될 때까지 추가 쿼리 발생

**방법:**

- 마이그레이션 스크립트를 실행하지 않음
- 하위호환성 fallback 로직이 자동으로 처리
- 사용자가 데이터를 조회할 때마다 denormalized 필드가 없으면 계산하여 저장 (추가 구현 필요)

### 옵션 3: 하이브리드 접근

**방법:**

1. 전체 마이그레이션 스크립트 실행 (백그라운드)
2. 마이그레이션 완료 전까지 하위호환성 fallback 로직 사용
3. 마이그레이션 완료 후 fallback 로직은 실행되지 않음

---

## 🔍 마이그레이션 상태 확인

### 프로젝트 태스크 통계 마이그레이션 상태

```typescript
// 모든 프로젝트 조회
const projectsSnapshot = await db.collection("projects").get();
const migratedCount = projectsSnapshot.docs.filter(
  (doc) => doc.data().taskCounts !== undefined
).length;
const totalCount = projectsSnapshot.size;
console.log(`마이그레이션 완료: ${migratedCount}/${totalCount}`);
```

### Area 카운트 마이그레이션 상태

```typescript
// 모든 Area 조회
const areasSnapshot = await db.collection("areas").get();
const migratedCount = areasSnapshot.docs.filter(
  (doc) => doc.data().counts !== undefined
).length;
const totalCount = areasSnapshot.size;
console.log(`마이그레이션 완료: ${migratedCount}/${totalCount}`);
```

### UnifiedArchive Parent 정보 마이그레이션 상태

```typescript
// 모든 UnifiedArchive 조회
const archivesSnapshot = await db.collection("unified_archives").get();
const migratedCount = archivesSnapshot.docs.filter(
  (doc) => doc.data().parentTitle !== undefined
).length;
const totalCount = archivesSnapshot.size;
console.log(`마이그레이션 완료: ${migratedCount}/${totalCount}`);
```

---

## ⚠️ 주의사항

### 1. 데이터 정합성

- 마이그레이션 스크립트는 **읽기 전용** 계산만 수행합니다
- 기존 데이터를 수정하지 않고 denormalized 필드만 추가합니다
- 트랜잭션으로 처리되지 않으므로, 마이그레이션 중 데이터가 변경되면 불일치가 발생할 수 있습니다

### 2. 재실행 안전성

- 이미 denormalized 필드가 있는 문서는 스킵됩니다
- 재실행해도 안전하지만, 불필요한 읽기 비용이 발생합니다

### 3. 성능 고려

- 대량의 데이터가 있는 경우 배치 처리로 나누어 실행하는 것을 고려하세요
- 현재 스크립트는 순차 처리하므로, 프로젝트 수가 많으면 실행 시간이 길어집니다

---

## 🚀 권장 마이그레이션 절차

1. **백업** (선택사항)

   ```bash
   # Firestore 데이터 백업 (Firebase Console 또는 gcloud 사용)
   ```

2. **테스트 환경에서 먼저 실행**

   ```bash
   # 테스트 프로젝트에서 스크립트 실행
   npx tsx scripts/14-migrate-denormalized-fields.ts
   ```

3. **프로덕션 환경 실행**

   ```bash
   # 프로덕션 환경에서 실행
   npx tsx scripts/14-migrate-denormalized-fields.ts
   ```

4. **마이그레이션 상태 확인**

   - 위의 확인 스크립트로 마이그레이션 완료율 확인

5. **모니터링**
   - 마이그레이션 후 일정 기간 동안 하위호환성 fallback 로직 실행 여부 모니터링
   - 모든 데이터가 마이그레이션되면 fallback 로직은 실행되지 않아야 합니다

---

## 📝 추가 개선 사항 (선택)

### 자동 마이그레이션 (On-Demand)

사용자가 데이터를 조회할 때 denormalized 필드가 없으면 자동으로 계산하여 저장하는 로직을 추가할 수 있습니다:

```typescript
// 예시: getTaskCountsForMultipleProjects에서
if (!taskCounts) {
  // 계산 후 저장
  await updateDoc(projectRef, {
    taskCounts: { total, completed, pending },
    timeStats: { completedTime, remainingTime },
  });
}
```

이 방식의 장점:

- 점진적 마이그레이션
- 사용자가 실제로 사용하는 데이터만 마이그레이션

단점:

- 첫 조회 시 추가 쿼리 발생
- 구현 복잡도 증가

---

## ✅ 결론

**마이그레이션 스크립트 작성 가능:** ✅ 가능

**하위호환성:** ✅ 완전한 하위호환성 제공

**추가 코드 필요:** ✅ 최소한 (이미 구현됨)

현재 구현된 하위호환성 코드로 인해:

- 마이그레이션 스크립트를 실행하지 않아도 기존 데이터가 정상 작동
- 마이그레이션 스크립트 실행 시 성능 최적화
- 점진적 마이그레이션도 가능

**권장 사항:**

1. 전체 마이그레이션 스크립트 실행 (성능 최적화)
2. 마이그레이션 완료 전까지 하위호환성 fallback 로직 사용
3. 마이그레이션 완료 후 모니터링하여 fallback 로직 실행 여부 확인

