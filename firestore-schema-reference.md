# 📦 Firestore 스키마 문서

이 문서는 현재 Firebase Firestore에 사용 중인 데이터베이스 스키마 구조를 정의합니다. 모든 컬렉션은 사용자(`uid`) 단위로 관리됩니다.

---

## 🔑 사용자 ID 기준

- 모든 문서에는 `userId` 필드가 포함되어 있어야 하며,
- Firestore 규칙에 따라 해당 UID와 일치하는 사용자만 접근 가능하게 제한됩니다.

```ts
userId: string; // Firebase Auth UID
```

---

## 🔹 1. `areas` 컬렉션

**사용자가 직접 정의하는 관심 영역**입니다.

```ts
area: {
  id: string;         // 자동 생성 (e.g. area_kj92sf)
  title: string;      // 사용자 입력 이름 (e.g. "건강")
  description?: string;
  userId: string;
  createdAt: string;  // ISO timestamp
}
```

---

## 🔹 2. `loops` 컬렉션

**한 달 단위의 루프(목표 주기) 관리용 데이터**입니다.

```ts
loop: {
  id: string;            // e.g. loop_2025_04
  userId: string;
  title: string;         // e.g. "4월 루프: 건강 관리"
  reward: string;        // 보상 내용
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  status: 'active' | 'completed' | 'failed';
  areaIds: string[];     // 관련 area ID 배열
  projectIds: string[];  // 포함된 프로젝트 ID 배열
  goal?: number;         // 전체 목표 수치 (예: 100)
  done?: number;         // 실제 달성 수치 (예: 65)
  progress?: {
    completed: number;
    total: number;
  };
  improvement?: {
    value: number;
    direction: 'up' | 'down';
  };
}
```

---

## 🔹 3. `projects` 컬렉션

**루프 안에 포함되는 실행 가능한 세부 목표 단위입니다.**

```ts
project: {
  id: string;
  userId: string;
  title: string;
  description?: string;
  targetCount: number;     // 총 태스크 수
  doneCount: number;       // 완료된 태스크 수
  areaId: string;          // 연관된 area ID
  loopIds: string[];       // 소속 루프 ID (1개 이상)
  addedDuringLoop?: boolean; // 루프 중 추가된 경우
  status: 'active' | 'archived';
  createdAt: string;       // ISO timestamp
  dueDate?: string;        // 마감일 (옵션)
}
```

---

## 🔹 4. `tasks` 컬렉션

**프로젝트를 구성하는 행동 단위 태스크입니다.**

```ts
task: {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  duration: number; // 집중 시간 (분 단위)
  done: boolean;
}
```

---

## ✅ 규칙 요약

- 모든 문서는 `userId`를 기반으로 Firestore 보안 규칙에서 접근 제어
- area, project, task는 모두 사용자가 생성하고 수정할 수 있음
- 슬러그는 사용하지 않으며, ID는 자동 생성하거나 백엔드에서 규칙적으로 설정함

---

> 📌 추가 문서: 추후 `notes`, `templates`, `reflections`, `ai_recommendations` 등의 컬렉션이 생길 수 있으며, 위 구조를 확장 가능하게 설계해야 함.

---
