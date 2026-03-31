import test from "node:test";
import assert from "node:assert/strict";
import {
  PLAN_TOOL,
  normalizePlanForFrontend,
  validateGeneratedPlan,
} from "../src/claude-api";

test("PLAN_TOOL requires non-empty projects and supports optional newAreas", () => {
  assert.equal(PLAN_TOOL.input_schema.properties.projects.minItems, 1);
  assert.ok(PLAN_TOOL.input_schema.properties.newAreas);
});

test("PLAN_TOOL allows frontend-required optional project fields", () => {
  const projectSchema = PLAN_TOOL.input_schema.properties.projects.items.properties;
  assert.ok(projectSchema.difficulty);
  assert.ok(projectSchema.target);
  assert.ok(projectSchema.targetCount);
  assert.ok(projectSchema.milestones);
  assert.ok(projectSchema.resources);
  assert.ok(PLAN_TOOL.input_schema.properties.timeline);
  assert.ok(PLAN_TOOL.input_schema.properties.successMetrics);
});

test("normalizePlanForFrontend backfills frontend shape", () => {
  const normalized = normalizePlanForFrontend({
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

  assert.equal(normalized.newAreas[0].key, "new-health");
  assert.equal(normalized.projects[0].areaName, "건강");
  assert.equal(normalized.projects[0].difficulty, "intermediate");
  assert.equal(normalized.projects[0].targetCount, 1);
  assert.deepEqual(normalized.projects[0].milestones, []);
  assert.deepEqual(normalized.projects[0].resources, []);
});

test("validateGeneratedPlan rejects area-only or empty responses", () => {
  const emptyValidation = validateGeneratedPlan({ projects: [] });
  assert.equal(emptyValidation.isValid, false);

  const areaOnlyValidation = validateGeneratedPlan(
    {
      newAreas: [
        {
          key: "new-health",
          name: "건강",
          description: "",
          icon: "heart",
          color: "#f00",
        },
      ],
      projects: [],
    },
    []
  );
  assert.equal(areaOnlyValidation.isValid, false);

  const missingAssignmentValidation = validateGeneratedPlan(
    {
      projects: [
        {
          title: "운동 루틴 만들기",
          description: "주 3회 운동",
          category: "repetitive",
          durationWeeks: 4,
          estimatedDailyTime: 30,
          tasks: [{ title: "1회차", description: "", duration: 1 }],
        },
      ],
    },
    []
  );
  assert.equal(missingAssignmentValidation.isValid, false);
});

test("validateGeneratedPlan accepts existing and new area assignments", () => {
  const validation = validateGeneratedPlan(
    {
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
          durationWeeks: 4,
          estimatedDailyTime: 30,
          areaAssignment: { type: "new", newAreaKey: "new-health" },
          tasks: [{ title: "1회차", description: "", duration: 1 }],
        },
      ],
    },
    [{ id: "existing-health", name: "건강" }]
  );

  assert.equal(validation.isValid, true);
});
