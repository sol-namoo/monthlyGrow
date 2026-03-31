import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeGeneratedPlan,
  validateGeneratedPlanForSave,
} from "../lib/ai-plan";

test("normalizeGeneratedPlan fills missing collections and defaults", () => {
  const normalized = normalizeGeneratedPlan({
    newAreas: [
      {
        key: "new-health",
        name: "건강",
        description: "",
        icon: "heart",
        color: "#f00",
      },
    ],
    projects: [
      {
        title: "운동 루틴 만들기",
        description: "주 3회 운동",
        category: "repetitive",
        areaAssignment: {
          type: "new",
          newAreaKey: "new-health",
        },
        durationWeeks: 4,
        tasks: [{ title: "1회차", description: "", duration: 1 }],
      },
    ],
  });

  assert.equal(normalized.newAreas.length, 1);
  assert.equal(normalized.projects.length, 1);
  assert.equal(normalized.projects[0].areaName, "건강");
  assert.equal(normalized.projects[0].difficulty, "intermediate");
  assert.equal(normalized.projects[0].targetCount, 0);
  assert.deepEqual(normalized.projects[0].milestones, []);
  assert.deepEqual(normalized.projects[0].resources, []);
  assert.deepEqual(normalized.projects[0].tasks[0].requirements, []);
  assert.deepEqual(normalized.timeline.weeklySchedule, []);
  assert.deepEqual(normalized.successMetrics, []);
});

test("validateGeneratedPlanForSave rejects empty plans", () => {
  const result = validateGeneratedPlanForSave({
    newAreas: [],
    projects: [],
    timeline: { totalWeeks: 0, weeklySchedule: [] },
    successMetrics: [],
  });

  assert.equal(result.isValid, false);
  assert.match(result.error, /프로젝트/);
});

test("validateGeneratedPlanForSave rejects projects without tasks", () => {
  const result = validateGeneratedPlanForSave({
    newAreas: [
      {
        key: "new-health",
        name: "건강",
        description: "",
        icon: "heart",
        color: "#f00",
      },
    ],
    projects: [
      {
        title: "운동 루틴 만들기",
        description: "주 3회 운동",
        category: "repetitive",
        areaName: "건강",
        areaAssignment: {
          type: "new",
          newAreaKey: "new-health",
        },
        durationWeeks: 4,
        difficulty: "intermediate",
        target: "운동",
        targetCount: 3,
        estimatedDailyTime: 30,
        tasks: [],
        milestones: [],
        resources: [],
      },
    ],
    timeline: { totalWeeks: 4, weeklySchedule: [] },
    successMetrics: [],
  });

  assert.equal(result.isValid, false);
  assert.match(result.error, /작업/);
});
