# Firestore Schema Reference Document

This document defines the database schema structure currently used in Firebase Firestore. All collections are managed per user.

## 📋 Schema Definition by Collection

### 🔹 Users Collection

Stores user profile, settings, and preferences.

```typescript
interface User {
  id: string; // Document ID (Firebase Auth UID)

  profile: {
    displayName: string; // User display name
    email: string; // Email address
    photoURL?: string; // Profile photo URL
    emailVerified: boolean; // Email verification status
    createdAt: Date; // Creation date/time
    updatedAt: Date; // Update date/time
  };

  settings: {
    defaultReward?: string; // Default reward
    defaultRewardEnabled: boolean; // Default reward enabled status
    carryOver: boolean; // Carry over incomplete items
    aiRecommendations: boolean; // Allow AI recommendations
    notifications: boolean; // Allow notifications
    theme: "light" | "dark" | "system"; // Theme setting
    language: "ko" | "en"; // Language setting
    // Information provided by Firebase Auth is excluded:
    // - email (user.email)
    // - displayName (user.displayName)
    // - photoURL (user.photoURL)
  };

  preferences: {
    timezone: string; // Timezone (e.g., "Asia/Seoul")
    dateFormat: string; // Date format (e.g., "ko-KR")
    weeklyStartDay: "monday" | "sunday"; // Week start day
  };
}
```

**Indexes:**

- `id` (single, Firebase Auth UID)

---

### 🔹 Areas Collection

Stores life areas defined by users.

```typescript
interface Area {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID (Firebase Auth UID)
  name: string; // Area name (e.g., "Health", "Self-development")
  description: string; // Area description
  icon?: string; // Icon ID (Lucide React)
  color?: string; // Color code (hex)

  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `createdAt` (composite)

---

### 🔹 Resources Collection

Stores reference materials and links belonging to each area.

```typescript
interface Resource {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  name: string; // Resource title
  areaId?: string; // Belonging area ID
  area?: string; // Area name (denormalized - not stored in DB, provided together when querying)
  areaColor?: string; // Area color (denormalized - not stored in DB, provided together when querying)
  description: string; // Resource description
  text?: string; // Text content
  link?: string; // External link URL
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `areaId` (composite)

---

### 🔹 Projects Collection

Stores projects as specific action units.

```typescript
interface Project {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  title: string; // Project title
  description: string; // Project description
  category?: "repetitive" | "task_based"; // Project type
  areaId?: string; // Belonging area ID
  area?: string; // Area name (denormalized - not stored in DB, provided together when querying)
  completedTasks: number; // Total actual completed tasks
  startDate: Date; // Start date
  endDate: Date; // End date
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
  connectedMonthlies?: string[]; // Connected monthly ID array
  target?: string; // Goal description
  targetCount?: number; // Goal count

  // Retrospectives and notes are managed through unified_archives.
  // Any retrospective/notes fields remaining in older documents are compatibility-only.

  // Project status is calculated dynamically (not stored in DB)
  // Use getProjectStatus() function for real-time calculation
}

// Project status calculation logic (getProjectStatus function):
// - scheduled: startDate > now (start date is in the future)
// - in_progress: startDate <= now <= endDate && completionRate < 100%
// - completed: completionRate >= 100%
// - overdue: endDate < now && completionRate < 100%
```

**Subcollections:**

- `tasks`: Detailed tasks in the project (projects/{projectId}/tasks/{taskId})

**Indexes:**

- `userId` (single)
- `userId` + `areaId` (composite)
- `userId` + `createdAt` (composite)

---

### 🔹 Monthlies Collection

Each monthly is a unit that manages OKR goals and retrospectives set by users for one month.

```typescript
// Key Result interface
interface KeyResult {
  id: string;
  title: string; // "Exercise 8 times total"
  isCompleted: boolean; // User checks O/X
  targetCount?: number; // Target count
  completedCount?: number; // Completed count
}

interface Monthly {
  id: string;
  userId: string;
  startDate: Date; // Start date (usually beginning of month)
  endDate: Date; // End date (usually end of month)
  focusAreas: string[]; // Focus area ID array
  objective: string; // Monthly objective (OKR Objective)
  objectiveDescription?: string;
  keyResults: KeyResult[]; // Key Results
  reward?: string; // Reward upon goal achievement
  createdAt: Date;
  updatedAt: Date;
  // Retrospectives and notes are managed through unified_archives.
  // Any note/retrospective fields remaining in older documents are compatibility-only.

  // Connected projects (SSOT for monthly-project relation)
  connectedProjects?: Array<{
    projectId: string;
    monthlyTargetCount?: number;
    monthlyDoneCount?: number;
  }>;

  // Project quick access (for user convenience, not included in snapshots)
  quickAccessProjects?: string[];

  // Local calculated fields (not stored in DB)
  status?: "planned" | "in_progress" | "ended"; // Calculated on client based on startDate and endDate
}
```

**Status Calculation Logic:**

- `planned`: Current date < start date
- `in_progress`: Start date ≤ current date ≤ end date
- `ended`: Current date > end date

**Monthly Goal Achievement Rate:**

- Key Results completion rate = completed Key Results count / total Key Results count
- User manually evaluates each Key Result achievement by reviewing completed tasks

---

### 🔹 Tasks Collection

Stores detailed tasks within projects.

```typescript
interface Task {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  projectId: string; // Belonging project ID
  title: string; // Task title
  date: Date; // Task date
  duration: number; // Duration in days
  done: boolean; // Completion status
  completedAt?: Date;
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `projectId` (composite)
- `userId` + `date` (composite)

### 🔹 Unified Archives Collection

This is the current source of truth for monthly/project notes and retrospectives.

```typescript
interface UnifiedArchive {
  id: string;
  userId: string;
  type:
    | "monthly_retrospective"
    | "monthly_note"
    | "project_retrospective"
    | "project_note";
  parentId: string; // monthlyId or projectId
  parentType: "monthly" | "project";
  title: string;
  content: string;
  parentTitle?: string;
  parentStartDate?: Date;
  parentEndDate?: Date;
  parentAreaName?: string;
  userRating?: number;
  bookmarked?: boolean;
  bestMoment?: string;
  routineAdherence?: number;
  unexpectedObstacles?: string;
  nextMonthlyApplication?: string;
  keyResultsReview?: {
    text?: string;
    completedKeyResults?: string[];
    failedKeyResults?: {
      keyResultId: string;
      keyResultTitle: string;
      reason:
        | "unrealisticGoal"
        | "timeManagement"
        | "priorityMismatch"
        | "externalFactors"
        | "motivation"
        | "other";
      customReason?: string;
    }[];
  };
  goalAchieved?: boolean;
  memorableTask?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 🔹 Monthly Snapshots Collection

Cloud Functions create monthly summary documents in `monthly_snapshots`.

```typescript
interface MonthlySnapshot {
  id: string;
  userId: string;
  yearMonth: string; // "2026-03"
  snapshotDate: Date;
  monthly: {
    id: string;
    objective: string;
    objectiveDescription?: string;
    keyResults: {
      id: string;
      title: string;
      description?: string;
      isCompleted: boolean;
      targetCount?: number;
      completedCount?: number;
    }[];
  };
  completedTasks: {
    projectId: string;
    projectTitle: string;
    areaName: string;
    tasks: {
      taskId: string;
      title: string;
      completedAt: Date;
    }[];
  }[];
  statistics: {
    totalCompletedTasks: number;
    totalProjects: number;
    totalAreas: number;
    keyResultsCompleted: number;
    keyResultsTotal: number;
  };
  failureAnalysis?: {
    totalKeyResults: number;
    failedKeyResults: number;
    failureRate: number;
    failureReasons: {
      reason: string;
      label: string;
      count: number;
      percentage: number;
    }[];
    failedKeyResultsDetail: {
      keyResultId: string;
      keyResultTitle: string;
      reason: string;
      customReason?: string;
    }[];
  };
}
```

---

## 🔗 Relationship Definitions

### 1. User → Areas (1:N)

- One user can have multiple areas
- Connected via `userId`

### 2. Area → Resources (1:N)

- One area can have multiple resources
- Connected via `areaId`

### 3. Area → Projects (1:N)

- One area can have multiple projects
- Connected via `areaId`

### 4. Project → Tasks (1:N)

- One project can have multiple tasks
- Managed as subcollection: `projects/{projectId}/tasks/{taskId}`
- Connected via `projectId`

### 5. Monthly ↔ Projects (N:N)

- `Monthly.connectedProjects[]` is the source of truth for monthly-specific goals and progress
- `Project.connectedMonthlies[]` is the reverse lookup used by project detail and queries
- Both sides must stay synchronized when creating, editing, or deleting connections

### 6. MonthlySnapshot → Monthly (1:1)

- Monthly snapshot automatically generated at end of month
- Completely preserves all information for that month
- Used when querying past data

### 7. Unified Archives System (1:N)

- All retrospectives and notes managed in unified way in `unified_archives` collection
- Distinguished by `type` field: `"monthly_retrospective"`, `"project_retrospective"`, `"monthly_note"`, `"project_note"`
- Connected to Monthly or Project via `parentId`
- Provides unified star rating (`userRating`) and bookmark (`bookmarked`) features

### 8. Monthly → Unified Archive (1:N)

- Multiple archive items per monthly (retrospectives, notes)
- Connected via `parentId` in `unified_archives` collection

### 9. Project → Unified Archive (1:N)

- Multiple archive items per project (retrospectives, notes)
- Connected via `parentId` in `unified_archives` collection

---

## 📊 Data Constraints

### 1. Required Fields

The following fields are required for all documents:

- `id`: Document identifier
- `userId`: User identifier
- `createdAt`: Creation date/time
- `updatedAt`: Update date/time

### 2. Status Value Constraints

- `status`: Only values defined per collection are allowed
- `userRating`: Only integers in range 1-5 are allowed
- `progress`, `total`: Only integers in range 0-100 are allowed

### 3. Relationship Constraints

- `areaId`: Only IDs existing in Areas collection are allowed
- `projectId`: Only IDs existing in Projects collection are allowed
- `monthlyId`: Only IDs existing in Monthlies collection are allowed

### 4. Array Constraints

- `focusAreas`: Maximum 4 (recommended 2)
- `connectedProjects`: Maximum 5 (recommended 2-3)
- `connectedMonthlies`: No limit

### 5. Monthly Target Constraints

- `monthlyTargetCount`: Integer >= 0
- `monthlyDoneCount`: Integer >= 0, <= monthlyTargetCount
- `connectedProjects`: Duplicate projectId not allowed

---

## 🔒 Security Rules

### Basic Rules

```javascript
// Applied to all collections
match /{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

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
```

---

## 📈 Performance Optimization

### 1. Denormalization Strategy

- **Area information**: Store `area`, `areaColor` in Project, Resource
- **Monthly information**: Store as `connectedMonthlies[]` array in Project
- **Reason**: Enable UI rendering without joins

### 2. Indexing Strategy

- **Per-user queries**: `userId` single index
- **Status-based queries**: `userId` + `status` composite index
- **Date-based queries**: `userId` + `createdAt` composite index

### 3. Monthly Target Management

- **Monthly creation/modification**: Input/update `connectedProjects[*].monthlyTargetCount`
- **Task completion**: Update `monthlyDoneCount` if the project is connected to an active monthly
- **Query**: Monthly progress rate = `monthlyDoneCount / monthlyTargetCount`

---

## 🔄 Data Migration

### Legacy Data Compatibility

- Keep existing Monthly's `doneCount`, `targetCount` fields as legacy
- New `connectedProjects` array is used preferentially
- Migration logic needed to convert existing data to `connectedProjects`

### Migration Rules

1. **When creating monthly**: Initialize `connectedProjects` array
2. **When connecting project**: Create `ConnectedProjectGoal` object
3. **When completing task**: Update both project overall progress and monthly-specific progress simultaneously
4. **When completing monthly**: Include monthly-specific target information in snapshot

---

## 📝 Write Rules

### Create/Modify

- When creating/editing monthly, input/update `connectedProjects[*].monthlyTargetCount`
- Synchronize display metadata in each project's `connectedMonthlies` in the same transaction/batch

### Task Completion Event

- If the task's `projectId` exists in the active cycle's `connectedProjects`, increment that item's `monthlyDoneCount++`
- Project overall progress update follows existing logic

### Delete/Disconnect

- Disconnect project from monthly ⇒ Remove from `connectedProjects`
- Also remove that monthly metadata from Project's `connectedMonthlies`

### Query Patterns

- Loop detail: Calculate/display this month's achievement rate using only `connectedProjects`
- Project detail: "This month's progress" is read by finding active loop and matching in `connectedProjects`
- History: Reading past loop's `connectedProjects` as-is restores that month's goals/actuals

### Index & Integrity

- Index: `monthlies(userId, startDate)`, `projects(userId, createdAt)` etc. basic + necessary composite
- Integrity: Fix "target count is editable only in monthly" as UI/server rule
- Synchronization via batch/transaction (when updating monthly and project metadata simultaneously)
