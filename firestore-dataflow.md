# 🌱 Monthly Grow - Firebase Data Structure and Flow Diagram

This document visualizes and documents the Firebase Firestore structure and key data flows of the Monthly Grow app.

## 📊 Data Model Overview

### Core Entities

- **User**: User profile, settings, preferences
- **Monthly**: Monthly growth cycle (1-2 months)
- **Project**: Specific action unit (2-8 weeks recommended)
- **Area**: Life area classification (health, self-development, family, etc.)
- **Resource**: Reference materials and links
- **Task**: Detailed tasks within projects
- **UnifiedArchive**: Unified retrospective and note management
- **Retrospective**: Monthly/Project retrospective (Legacy)
- **Note**: Free-form notes (Legacy)

## 🔄 Data Relationship Diagram

```
Users (User profile and settings)
├── profile (displayName, email, photoURL, etc.)
├── settings (default reward, AI recommendations, notifications, etc.)
└── preferences (timezone, date format, language, etc.)

User (Personalized data)
├── Areas (Life areas)
│   ├── Projects (Projects in this area)
│   │   ├── Tasks (Subcollection: projects/{projectId}/tasks/{taskId})
│   │   ├── Retrospective (Project retrospective)
│   │   └── Notes (Project notes)
│   └── Resources (Reference materials in this area)
├── Monthlies (Monthly cycles)
│   ├── focusAreas[] (Focus areas)
│   ├── connectedProjects[] (Connected projects with monthly targets)
│   │   ├── projectId (Project ID)
│   │   ├── monthlyTargetCount (This month's target)
│   │   └── monthlyDoneCount (This month's completed)
│   └── (Retrospectives/notes managed in unified_archives)
├── Projects (Action units)
│   ├── areaId (Belonging area)
│   ├── target (Total target)
│   ├── completedTasks (Total completed)
│   ├── connectedMonthlies[] (Connected monthlies)
│   ├── tasks (Subcollection)
│   ├── retrospective (Project retrospective)
│   └── notes[] (Project notes)
└── Snapshots (Monthly progress summary)
    ├── monthlyId (Monthly reference)
    └── projectId (Project reference)

※ All data is completely isolated per user
※ Even if other users create identical data, they cannot access each other's data
※ Archive is a filtered view of completed Monthly/Project
```

## 📝 Detailed Structure by Collection

### 1. Areas Collection

```typescript
{
  id: string;
  userId: string;
  name: string;           // "Health", "Self-development", "Family"
  description: string;    // Area description
  icon?: string;          // Icon ID
  color?: string;         // Color code
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. Resources Collection

```typescript
{
  id: string;
  userId: string;
  name: string;           // Resource title
  areaId?: string;        // Belonging area ID
  area?: string;          // Area name (denormalized)
  areaColor?: string;     // Area color (denormalized)
  description: string;    // Resource description
  text?: string;          // Text content
  link?: string;          // External link
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 3. Projects Collection

```typescript
{
  id: string;
  userId: string;
  title: string;          // Project title
  description: string;    // Project description
  category?: "repetitive" | "task_based"; // Project type
  areaId?: string;        // Belonging area ID
  area?: string;          // Area name (denormalized)
  target: number;         // Total target count (repetitive: target count, task-based: target task count)
  completedTasks: number; // Total actual completed tasks
  startDate: Date;        // Start date
  endDate: Date;          // End date
  createdAt: Date;
  updatedAt: Date;
  monthlyId?: string;        // Currently connected monthly ID (legacy)
  connectedMonthlies?: string[]; // Connected monthly ID array
  addedMidway?: boolean;  // Whether added mid-monthly
  retrospective?: Retrospective; // Project retrospective
  notes: Note[];          // Project notes

  // Project status is calculated dynamically (not stored in DB)
  // Use getProjectStatus() function for real-time calculation
}

// Project status calculation logic (getProjectStatus function):
// - scheduled: startDate > now (start date is in the future)
// - in_progress: startDate <= now <= endDate && completionRate < 100%
// - completed: completionRate >= 100%
// - overdue: endDate < now && completionRate < 100%
```

### 4. Monthlies Collection

```typescript
// Key Result interface
interface KeyResult {
  id: string;
  title: string; // "Exercise 8 times total"
  description?: string; // Detailed description (optional)
  isCompleted: boolean; // User checks O/X
  targetCount?: number; // Target count
  completedCount?: number; // Completed count
}

{
  id: string;
  userId: string;
  objective: string; // OKR Objective (simple one-liner)
  objectiveDescription?: string; // Objective detailed description (optional)
  startDate: Date; // Start date
  endDate: Date; // End date
  focusAreas: string[]; // Focus area ID array
  keyResults: KeyResult[]; // Key Results
  reward?: string; // Reward
  createdAt: Date;
  updatedAt: Date;
  retrospective?: Retrospective; // Monthly retrospective
  note?: string; // Monthly note

  // Project quick access (for user convenience, not included in snapshots)
  quickAccessProjects?: string[]; // Project ID array

  // Local calculated fields (not stored in DB)
  status?: "planned" | "in_progress" | "ended"; // Calculated on client based on startDate and endDate
}

// Monthly status calculation logic:
// - planned: today < start date
// - in_progress: start date <= today <= end date
// - ended: today > end date

// Monthly goal achievement rate:
// - Key Results completion rate = completed Key Results count / total Key Results count
// - User manually evaluates each Key Result achievement by reviewing completed tasks
```

### 5. Tasks Collection

```typescript
{
  id: string;
  userId: string;
  projectId: string;      // Belonging project ID
  title: string;          // Task title
  date: Date;             // Task date
  duration: number;       // Duration in days
  done: boolean;          // Completion status
  status?: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

### 6. Unified Archives Collection

A unified system for managing retrospectives and notes.

```typescript
{
  id: string;
  userId: string;
  type: "monthly_retrospective" | "project_retrospective" | "monthly_note" | "project_note";
  parentId: string; // Monthly ID or Project ID
  parentType: "monthly" | "project";

  // Common fields
  title: string; // Title (auto-generated or user input)
  content: string; // Content
  userRating?: number; // Star rating (1-5)
  bookmarked: boolean; // Bookmark status

  // Retrospective-specific fields
  bestMoment?: string;
  routineAdherence?: string;
  unexpectedObstacles?: string;
  nextMonthlyApplication?: string;
  stuckPoints?: string;
  newLearnings?: string;
  nextProjectImprovements?: string;
  memorableTask?: string;

  // Key Results failure reason data (newly added)
  keyResultsReview?: {
    completedKeyResults?: string[]; // Completed Key Results ID list
    failedKeyResults?: {
      keyResultId: string;
      keyResultTitle: string; // Key Result title (for convenience when querying)
      reason: "unrealisticGoal" | "timeManagement" | "priorityMismatch" | "externalFactors" | "motivation" | "other";
      customReason?: string; // User input reason when "other" is selected
    }[];
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### 7. Snapshots Collection

Stores monthly progress summaries.

```typescript
{
  id: string; // Document ID (auto-generated)
  userId: string; // User ID
  year: number; // Year
  month: number; // Month
  snapshotDate: Date; // Snapshot creation date

  // Monthly information
  monthlyIds: string[]; // Monthly IDs for this month
  monthlyTitles: string[]; // Monthly titles for this month

  // Completed project information
  completedProjects: number; // Number of completed projects
  totalProjects: number; // Total number of projects
  completionRate: number; // Completion rate (%)

  // Task information
  totalTasks: number; // Total number of tasks
  completedTasks: number; // Number of completed tasks

  // Focus time
  focusTime: number; // Total focus time (minutes)

  // Reward information
  rewards: string[]; // Reward list

  // Statistics by area
  areaStats: {
    [areaId: string]: {
      name: string;
      projectCount: number;
      completedProjectCount: number;
      focusTime: number;
      completionRate: number;
    };
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

  createdAt: Date;
  updatedAt: Date;
}
```

## 🔗 Relationship Management

### 1. Project-Monthly Connection (Improved Structure)

- **Bidirectional relationship**:
  - Manage project-specific targets via Monthly's `connectedProjects[]`
  - Manage connected monthly list via Project's `connectedMonthlies[]`
- **When creating monthly**: Add selected projects to `connectedProjects[]` and set each `monthlyTargetCount`
- **When creating project**: Add Monthly ID to Project's `connectedMonthlies[]`
- **Data consistency**: Monthly manages monthly-specific targets and progress rates, Project manages overall project progress

### 2. Area-Project Connection

- **Unidirectional relationship**: Project references Area via `areaId`
- **Denormalization**: Store Area name in Project for performance
- **Color information**: Store Area color in Resource as well for UI rendering optimization

### 3. Project-Task Connection

- **Subcollection relationship**: `projects/{projectId}/tasks/{taskId}` structure
- **Auto-generation**: Basic tasks are automatically created when project is created
- **Manual addition**: Users can directly add/modify tasks

## 📊 Data Flow

### 1. Monthly Creation Flow (Improved Structure)

```
1. User inputs monthly information
2. Select existing projects (optional)
3. Set monthly target (monthlyTargetCount) for each project
4. Select focus areas (max 4, recommended 2)
5. Create monthly
6. Update selected projects' connectedMonthlies[]
7. Update monthly's connectedProjects[]
```

### 2. Project Creation Flow

```
1. User inputs project information
2. Select Area
3. Create project
4. Denormalize and store selected Area information
5. Update connectedMonthlies[] when connecting to monthly
```

### 3. Task Completion Flow (Improved Structure)

```
1. User checks task as completed
2. Update project's total completedTasks
3. If the project is connected to an active monthly:
   - Update monthly's connectedProjects[].monthlyDoneCount
4. Recalculate monthly achievement rate
5. Recalculate project overall progress
```

### 4. Monthly Completion Flow

```
1. Change monthly status to "ended"
2. Final update of monthly-specific progress for connected projects
3. Change to retrospective writable state
4. Viewable in Archive view
5. Create snapshot (including monthly-specific target information)
```

### 5. Failure Pattern Analysis Flow (Newly Added)

```
1. When writing monthly retrospective, select failed Key Results
2. For each failed Key Result, select failure reason:
   - Unrealistic goal (unrealisticGoal)
   - Time management (timeManagement)
   - Priority mismatch (priorityMismatch)
   - External factors (externalFactors)
   - Lack of motivation (motivation)
   - Other (other) - user input
3. Store failure reason data in unified_archives
4. Include failure analysis data when creating end-of-month snapshot
5. Display failure pattern analysis widget on home dashboard
   - Overall failure rate
   - Main failure reason distribution
   - Monthly/yearly trends
   - Improvement suggestions
```

## ⚡ Performance Optimization

### 1. Denormalization

- **Area information**: Store Area name/color in Project, Resource
- **Monthly information**: Store connected Monthly title/period in Project
- **Reason**: Enable UI rendering without joins

### 2. Indexing Strategy

- `userId` + `status`: Query active status per user
- `userId` + `areaId`: Query by area
- `userId` + `createdAt`: Sort by latest

### 3. Query Optimization

- **Composite queries**: Process multiple conditions at once
- **Pagination**: Support infinite scroll
- **Caching**: Client-side caching with TanStack Query

### 4. Monthly Target Management

- **Monthly creation/modification**: Input/update `connectedProjects[*].monthlyTargetCount`
- **Task completion**: Update `monthlyDoneCount` if the project is connected to an active monthly
- **Query**: Monthly progress rate = `monthlyDoneCount / monthlyTargetCount`

### 5. Failure Pattern Analysis Optimization (Newly Added)

- **Snapshot-first query**: Prioritize snapshot data for failure analysis
- **Fallback mechanism**: Use archive data when snapshot is unavailable
- **Performance improvement**: Fast analysis via snapshot queries instead of complex archive queries
- **Data consistency**: Accurately preserve failure state at snapshot creation time

## 🔒 Security Rules

### 1. User Data Isolation

```javascript
// userId field required for all collections
match /{document=**} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

### 2. Data Integrity

- **Required fields**: userId, createdAt, updatedAt
- **Status validation**: Validate status field
- **Relationship validation**: Foreign key reference integrity
- **Monthly target constraints**: monthlyTargetCount >= 0, monthlyDoneCount <= monthlyTargetCount

## 📈 Scalability Considerations

### 1. Data Size

- **Tasks per project**: Average 10-20
- **Projects per monthly**: Average 2-3 (max 5)
- **Areas per user**: Average 5-8

### 2. Query Patterns

- **Frequently queried**: Active projects/monthlies per user
- **Occasionally queried**: Archive, statistics data
- **Rarely queried**: Full history, backups

### 3. Future Expansion

- **Tag system**: Improve project classification
- **Collaboration features**: Team project support
- **AI integration**: Auto retrospective generation, recommendation system

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
