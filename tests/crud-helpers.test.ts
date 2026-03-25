import test from "node:test";
import assert from "node:assert/strict";
import {
  addAreaCounts,
  buildNestedUpdateFields,
  getProjectCollectionState,
  getResourceCollectionState,
} from "../lib/firebase/crud-helpers";

test("buildNestedUpdateFields keeps nested siblings intact by using dotted keys", () => {
  const result = buildNestedUpdateFields(
    "profile",
    { displayName: "Namoo" },
    "updated-at"
  );

  assert.deepEqual(result, {
    "profile.displayName": "Namoo",
    "profile.updatedAt": "updated-at",
  });
});

test("getProjectCollectionState archives completed projects and keeps in-progress ones active", () => {
  const completed = getProjectCollectionState({
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-31"),
    targetCount: 3,
    completedTasks: 3,
  });

  const active = getProjectCollectionState({
    startDate: new Date("2099-01-01"),
    endDate: new Date("2099-01-31"),
    targetCount: 3,
    completedTasks: 0,
  });

  assert.equal(completed, "archived");
  assert.equal(active, "active");
});

test("getResourceCollectionState remains compatible with legacy archived status only", () => {
  assert.equal(
    getResourceCollectionState({
      id: "r1",
      userId: "u1",
      name: "Doc",
      description: "",
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "archived",
    }),
    "archived"
  );

  assert.equal(
    getResourceCollectionState({
      id: "r2",
      userId: "u1",
      name: "Doc",
      description: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    "active"
  );
});

test("addAreaCounts applies reassignment deltas without going negative", () => {
  assert.deepEqual(
    addAreaCounts({ projectCount: 1, resourceCount: 2 }, {
      projectCount: 3,
      resourceCount: 4,
    }),
    { projectCount: 4, resourceCount: 6 }
  );

  assert.deepEqual(
    addAreaCounts(undefined, { projectCount: -1, resourceCount: -1 }),
    { projectCount: 0, resourceCount: 0 }
  );
});
