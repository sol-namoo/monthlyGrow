# Denormalization Optimization Opportunities Analysis

This document analyzes cases where switching to a denormalization approach would be more efficient in terms of performance and cost, considering Firebase NoSQL characteristics.

## 📊 Analysis Criteria

- **Read Cost**: Number of read queries in current approach vs. after denormalization
- **Network Requests**: Reduction in number of requests
- **User Experience**: Loading time improvement
- **Data Consistency**: Whether it can be managed with transactions

---

## 🎯 High Priority

### 1. Project Task Counts and Statistics

**Current Approach:**

- `getTaskCountsForMultipleProjects`: Subcollection query for each project (N times)
- `getTaskTimeStatsByProjectId`: Subcollection query per project
- Project list page with 10 projects = 10 subcollection queries

**Issues:**

- Network requests increase proportionally with number of projects
- Loading time increases proportionally with number of projects
- Increased Firestore read costs

**Denormalization Proposal:**

```typescript
interface Project {
  // ... existing fields
  taskCounts: {
    total: number;
    completed: number;
    pending: number;
  };
  timeStats?: {
    completedTime: number; // Sum of durations for completed tasks
    remainingTime: number; // Sum of durations for remaining tasks
  };
}
```

**Improvement Effect:**

- Read queries: N times → 1 time (only project document query)
- Network requests: Significantly reduced
- Loading time: Constant regardless of number of projects

**Implementation Method:**

- Update project document together using Firestore transaction when tasks are created/deleted/completed
- Modify `toggleTaskCompletionInSubcollection`, `createTask`, `deleteTaskFromProject` functions

**Related Files:**

- `lib/firebase/tasks.ts`: `getTaskCountsForMultipleProjects`, `getTaskTimeStatsByProjectId`
- `app/(app)/para/page.tsx`: Task count display in project list

---

### 2. Unified Archives Parent Information

**Current Approach:**

- `fetchArchivesByUserIdWithPaging`: After fetching archives, query Monthly/Project documents again for each archive using `parentId`
- 20 archives = 1 query (archives) + 20 queries (Monthly/Project) = 21 total queries

**Issues:**

- Additional queries equal to number of archives
- Increased loading time for archive list page

**Denormalization Proposal:**

```typescript
interface UnifiedArchive {
  // ... existing fields
  // Denormalized parent information
  parentTitle?: string; // Monthly objective or Project title
  parentStartDate?: Date; // Monthly/Project startDate
  parentEndDate?: Date; // Monthly/Project endDate
  parentAreaName?: string; // Area name for Project
}
```

**Improvement Effect:**

- Read queries: 1 + N times → 1 time
- Network requests: Significantly reduced
- Reduced loading time for archive list page

**Implementation Method:**

- Fetch information from parent document and store together when creating archive
- Update related archives when parent document is modified (via Cloud Function or client)

**Related Files:**

- `lib/firebase/analytics.ts`: `fetchArchivesByUserIdWithPaging`
- `lib/firebase/unified-archives.ts`: `createUnifiedArchive`

---

## 🎯 Medium Priority

### 3. Area Project/Resource Counts

**Current Approach:**

- `fetchAreaCountsByUserId`: Query projects and resources for each Area
- 5 Areas = 5 queries (projects) + 5 queries (resources) = 10 total queries

**Issues:**

- Queries increase with number of Areas
- Queries executed every time to display counts on Areas list page

**Denormalization Proposal:**

```typescript
interface Area {
  // ... existing fields
  counts?: {
    projectCount: number;
    resourceCount: number;
  };
}
```

**Improvement Effect:**

- Read queries: 2N times → 1 time (only Area document query)
- Reduced loading time for Areas list page

**Implementation Method:**

- Update Area document's counts when projects/resources are created/deleted
- Ensure consistency with transactions

**Related Files:**

- `lib/firebase/analytics.ts`: `fetchAreaCountsByUserId`
- `app/(app)/para/page.tsx`: Count display in Areas tab

---

### 4. Project Current Active Monthly Progress

**Current Approach:**

- When displaying "This month's progress" on project detail page:
  1. Check project's `connectedMonthlies[]`
  2. Find active Monthly
  3. Find project's `monthlyTargetCount`, `monthlyDoneCount` in Monthly's `connectedProjects[]`

**Issues:**

- Project detail page needs to query Monthly document
- Complexity increases when displaying multiple projects at once

**Denormalization Proposal:**

```typescript
interface Project {
  // ... existing fields
  currentMonthlyProgress?: {
    monthlyId: string;
    monthlyTitle: string;
    monthlyTargetCount: number;
    monthlyDoneCount: number;
    progressRate: number; // Calculated progress rate
  };
}
```

**Improvement Effect:**

- No need to query Monthly document on project detail page
- Can display monthly progress rate in project list

**Implementation Method:**

- Update project document when Monthly is connected/disconnected
- Update project's `currentMonthlyProgress.monthlyDoneCount` when task is completed if active Monthly exists

**Related Files:**

- `app/(app)/para/projects/[id]/page.tsx`: Project detail page
- `lib/firebase/monthlies.ts`: Monthly connection logic

---

## 🎯 Low Priority

### 5. Monthly Key Results Completion Rate

**Current Approach:**

- `calculateMonthlyProgress`: Calculate by iterating through `keyResults` array on client
- Already stored in Monthly document, so no additional query needed

**Denormalization Proposal:**

```typescript
interface Monthly {
  // ... existing fields
  progressRate?: number; // Calculated completion rate (0-100)
}
```

**Improvement Effect:**

- Remove client-side calculation logic
- Fast query of progress rates for multiple Monthlies on statistics page

**Implementation Method:**

- Update Monthly document's `progressRate` when Key Result completion status changes

**Related Files:**

- `lib/firebase/monthlies.ts`: `calculateMonthlyProgress`
- `lib/firebase/analytics.ts`: `fetchYearlyActivityStats`

---

## 📝 Already Denormalized Cases

The following cases already have denormalization applied and do not require additional optimization:

1. **Area Information in Project/Resource**

   - Store `area`, `areaColor` in Project and Resource
   - No need to query Area document for UI rendering

2. **Monthly Information in Project**

   - Store Monthly information in Project's `connectedMonthlies[]` array
   - Can display Monthly information in project list

3. **Monthly's connectedProjects**
   - Store monthly goals per project in Monthly's `connectedProjects[]`
   - Manage `monthlyTargetCount`, `monthlyDoneCount`

---

## 🔄 Implementation Priority Recommendations

### Phase 1 (Immediate Implementation Recommended)

1. **Project Task Counts and Statistics** - Largest performance improvement effect
   - Significantly reduced loading time for project list page
   - Maximum reduction in network requests

### Phase 2 (Short-term Implementation)

2. **Unified Archives Parent Information** - Archive list page improvement
   - Improved archive query performance

### Phase 3 (Medium-term Implementation)

3. **Area Project/Resource Counts** - Areas list page improvement
4. **Project Current Active Monthly Progress** - Project detail page improvement

### Phase 4 (Optional Implementation)

5. **Monthly Key Results Completion Rate** - Statistics page improvement

---

## ⚠️ Important Notes

1. **Transaction Usage Required**

   - All denormalization updates must be handled with Firestore transactions
   - Ensures data consistency

2. **Migration Script Required**

   - Initialize denormalized fields for existing data
   - Calculate and store task counts for existing projects

3. **Background Synchronization Consideration**

   - Consider Cloud Function for recovery when data inconsistency occurs
   - Periodic consistency validation scripts

4. **Gradual Migration**
   - Apply denormalization to newly created data first
   - Gradually migrate existing data

---

## 📈 Expected Performance Improvement Effects

### Project List Page (`/para?tab=projects`)

- **Current**: 10 projects = 1 query (projects) + 10 queries (tasks) = 11 queries
- **After Improvement**: 10 projects = 1 query (projects) = 1 query
- **Improvement Rate**: Approximately 90% query reduction

### Archive List Page (`/para?tab=archives`)

- **Current**: 20 archives = 1 query (archives) + 20 queries (Monthly/Project) = 21 queries
- **After Improvement**: 20 archives = 1 query (archives) = 1 query
- **Improvement Rate**: Approximately 95% query reduction

### Areas List Page (`/para?tab=areas`)

- **Current**: 5 Areas = 1 query (Areas) + 10 queries (projects/resources) = 11 queries
- **After Improvement**: 5 Areas = 1 query (Areas) = 1 query
- **Improvement Rate**: Approximately 90% query reduction
