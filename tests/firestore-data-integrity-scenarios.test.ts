import test from "node:test";
import assert from "node:assert/strict";

import { auditDataIntegrity } from "../lib/firebase/data-integrity";

const now = new Date("2026-03-25T00:00:00.000Z");

test("mixed CRUD flow keeps area counts, monthly-project links, and archive parents aligned", () => {
  const areas = [
    {
      id: "area-health",
      userId: "user-1",
      name: "Health",
      description: "",
      counts: { projectCount: 1, resourceCount: 1 },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "area-uncategorized",
      userId: "user-1",
      name: "미분류",
      description: "",
      counts: { projectCount: 1, resourceCount: 1 },
      createdAt: now,
      updatedAt: now,
    },
  ];

  const resources = [
    {
      id: "resource-1",
      userId: "user-1",
      name: "Workout guide",
      areaId: "area-health",
      description: "",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "resource-2",
      userId: "user-1",
      name: "Inbox note",
      areaId: "area-uncategorized",
      description: "",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const projects = [
    {
      id: "project-1",
      userId: "user-1",
      title: "Run 12 times",
      description: "",
      areaId: "area-health",
      completedTasks: 4,
      startDate: now,
      endDate: new Date("2026-04-20T00:00:00.000Z"),
      createdAt: now,
      updatedAt: now,
      connectedMonthlies: ["monthly-mar", "monthly-apr"],
    },
    {
      id: "project-2",
      userId: "user-1",
      title: "Inbox cleanup",
      description: "",
      areaId: "area-uncategorized",
      completedTasks: 1,
      startDate: now,
      endDate: new Date("2026-03-30T00:00:00.000Z"),
      createdAt: now,
      updatedAt: now,
      connectedMonthlies: ["monthly-mar"],
    },
  ];

  const monthlies = [
    {
      id: "monthly-mar",
      userId: "user-1",
      objective: "March review",
      startDate: new Date("2026-03-01T00:00:00.000Z"),
      endDate: new Date("2026-03-31T00:00:00.000Z"),
      focusAreas: ["area-health"],
      keyResults: [],
      createdAt: now,
      updatedAt: now,
      connectedProjects: [
        { projectId: "project-1", monthlyTargetCount: 8, monthlyDoneCount: 4 },
        { projectId: "project-2", monthlyTargetCount: 1, monthlyDoneCount: 1 },
      ],
    },
    {
      id: "monthly-apr",
      userId: "user-1",
      objective: "April review",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
      focusAreas: ["area-health"],
      keyResults: [],
      createdAt: now,
      updatedAt: now,
      connectedProjects: [
        { projectId: "project-1", monthlyTargetCount: 10, monthlyDoneCount: 0 },
      ],
    },
  ];

  const archives = [
    {
      id: "archive-monthly-retro",
      userId: "user-1",
      type: "monthly_retrospective" as const,
      parentId: "monthly-mar",
      parentType: "monthly" as const,
      title: "March review",
      content: "Good month",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "archive-project-note",
      userId: "user-1",
      type: "project_note" as const,
      parentId: "project-1",
      parentType: "project" as const,
      title: "Run 12 times",
      content: "Need more morning sessions",
      createdAt: now,
      updatedAt: now,
    },
  ];

  assert.deepEqual(
    auditDataIntegrity({ areas, resources, projects, monthlies, archives }),
    []
  );
});

test("integrity audit catches orphan archives, broken bidirectional links, and stale area counts", () => {
  const issues = auditDataIntegrity({
    areas: [
      {
        id: "area-1",
        userId: "user-1",
        name: "Health",
        description: "",
        counts: { projectCount: 0, resourceCount: 0 },
        createdAt: now,
        updatedAt: now,
      },
    ],
    resources: [],
    projects: [
      {
        id: "project-1",
        userId: "user-1",
        title: "Broken project",
        description: "",
        areaId: "area-1",
        completedTasks: 0,
        startDate: now,
        endDate: now,
        createdAt: now,
        updatedAt: now,
        connectedMonthlies: ["monthly-missing"],
      },
    ],
    monthlies: [
      {
        id: "monthly-1",
        userId: "user-1",
        objective: "Broken monthly",
        startDate: now,
        endDate: now,
        focusAreas: [],
        keyResults: [],
        createdAt: now,
        updatedAt: now,
        connectedProjects: [{ projectId: "project-missing" }],
      },
    ],
    archives: [
      {
        id: "archive-1",
        userId: "user-1",
        type: "project_note" as const,
        parentId: "project-missing",
        parentType: "project" as const,
        title: "Broken archive",
        content: "orphan",
        createdAt: now,
        updatedAt: now,
      },
    ],
  });

  assert.equal(issues.some((issue) => issue.code === "area_count_mismatch"), true);
  assert.equal(
    issues.some((issue) => issue.code === "missing_monthly_project_link"),
    true
  );
  assert.equal(
    issues.some((issue) => issue.code === "missing_project_monthly_link"),
    true
  );
  assert.equal(
    issues.some((issue) => issue.code === "orphan_archive_parent"),
    true
  );
});
