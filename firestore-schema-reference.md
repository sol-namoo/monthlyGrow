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
- `userId` + `status` (composite)
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
  // Retrospectives and notes managed through Unified Archives
  // retrospective is queried from unified_archives collection
  // Notes managed through Unified Archives
  // notes are queried from unified_archives collection

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
  title: string; // Monthly title (e.g., "August: Complete job preparation")
  startDate: Date; // Start date (usually beginning of month)
  endDate: Date; // End date (usually end of month)
  focusAreas: string[]; // Focus area ID array
  objective: string; // Monthly objective (OKR Objective)
  keyResults: KeyResult[]; // Key Results
  reward?: string; // Reward upon goal achievement
  createdAt: Date;
  updatedAt: Date;
  // Retrospectives and notes managed through Unified Archives
  // retrospective and note are queried from unified_archives collection

  // Connected projects
  connectedProjects?: Array<{
    projectId: string;
    target?: string;
    targetCount?: number;
    monthlyTargetCount?: number;
  }>;

  // Project quick access (for user convenience, not included in snapshots)
  quickAccessProjects?: Array<{
    projectId: string;
    projectTitle: string;
    areaName: string;
  }>;

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
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `projectId` (composite)
- `userId` + `date` (composite)

### 🔹 MonthlyCompletedTasks Collection

Tracks completed tasks per month in real-time.

```typescript
interface MonthlyCompletedTasks {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  yearMonth: string; // Format: "2024-08"
  completedTasks: {
    taskId: string; // Completed task ID
    projectId: string; // Belonging project ID
    completedAt: Date; // Completion date
  }[];
  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `yearMonth` (composite)

---

### 🔹 MonthlySnapshots Collection

Stores monthly snapshots automatically generated at the end of each month.

```typescript
// Key Result snapshot (for end-of-month snapshots)
interface KeyResultSnapshot {
  id: string;
  title: string;
  isCompleted: boolean;
  targetCount?: number;
  completedCount?: number;
  // Preserves state at snapshot time
}

interface MonthlySnapshot {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  yearMonth: string; // "2024-08"
  snapshotDate: Date; // Snapshot creation date

  // Monthly information
  monthly: {
    id: string;
    title: string;
    objective: string;
    keyResults: KeyResultSnapshot[];
  };

  // Completed tasks (grouped by project)
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

  // Statistics
  statistics: {
    totalCompletedTasks: number;
    totalProjects: number;
    totalAreas: number;
    keyResultsCompleted: number;
    keyResultsTotal: number;
  };

  // Failure analysis data (newly added)
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

**Indexes:**

- `userId` (single)
- `userId` + `yearMonth` (composite)
- `snapshotDate` (single)

---

### 🔹 Unified Archives Collection

An archive system that manages all retrospectives and notes in a unified way.

```typescript
interface UnifiedArchive {
  id: string; // Document ID (auto-generated)
  userId: string; // User ID (Firebase Auth UID)
  type:
    | "monthly_retrospective"
    | "project_retrospective"
    | "monthly_note"
    | "project_note"; // Archive type
  parentId: string; // Parent document ID (Monthly ID or Project ID)
  parentType: "monthly" | "project"; // Parent type

  // Common fields
  title: string; // Title (auto-generated or user input)
  content: string; // Content
  userRating?: number; // Star rating (1-5)
  bookmarked: boolean; // Bookmark status

  // Retrospective-specific fields (when type is "retrospective")
  bestMoment?: string; // Best moment
  routineAdherence?: string; // Routine adherence rate
  unexpectedObstacles?: string; // Unexpected obstacles
  nextMonthlyApplication?: string; // Next month application
  stuckPoints?: string; // Stuck points
  newLearnings?: string; // New learnings
  nextProjectImprovements?: string; // Next project improvements
  memorableTask?: string; // Most memorable task

  // Key Results failure reason data (newly added)
  keyResultsReview?: {
    text?: string; // Overall text review of Key Results
    completedKeyResults?: string[]; // Completed Key Results ID list
    failedKeyResults?: {
      keyResultId: string;
      keyResultTitle: string; // Key Result title (for convenience when querying)
      reason:
        | "unrealisticGoal"
        | "timeManagement"
        | "priorityMismatch"
        | "externalFactors"
        | "motivation"
        | "other";
      customReason?: string; // User input reason when "other" is selected
    }[];
  };

  createdAt: Date; // Creation date/time
  updatedAt: Date; // Update date/time
}
```

**Indexes:**

- `userId` (single)
- `userId` + `type` (composite)
- `userId` + `parentType` (composite)
- `userId` + `createdAt` (composite, descending)
- `userId` + `bookmarked` (composite)
- `userId` + `type` + `createdAt` (composite, descending)
- `userId` + `parentType` + `createdAt` (composite, descending)

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

### 5. Monthly → Projects (Independent)

- Monthlies and projects are managed independently
- No project connection (connectedProjects removed)
- Completed tasks are automatically aggregated through MonthlyCompletedTasks
- User manually evaluates Key Results achievement by reviewing completed tasks

### 6. MonthlyCompletedTasks → Tasks (1:N)

- Tracks completed tasks per month in real-time
- Automatically added to MonthlyCompletedTasks for that month when task is completed
- Queryable grouped by project

### 7. MonthlySnapshot → Monthly (1:1)

- Monthly snapshot automatically generated at end of month
- Completely preserves all information for that month
- Used when querying past data

### 6. Unified Archives System (1:N)

- All retrospectives and notes managed in unified way in `unified_archives` collection
- Distinguished by `type` field: `"monthly_retrospective"`, `"project_retrospective"`, `"monthly_note"`, `"project_note"`
- Connected to Monthly or Project via `parentId`
- Provides unified star rating (`userRating`) and bookmark (`bookmarked`) features

### 7. Monthly → Unified Archive (1:N)

- Multiple archive items per monthly (retrospectives, notes)
- Connected via `parentId` in `unified_archives` collection

### 8. Project → Unified Archive (1:N)

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
