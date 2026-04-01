import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  generateConstraintsGuide,
  CONSTRAINTS_SYSTEM_GUIDE,
} from "./constraints-guide";
import { AI_FUNCTION_REGION, APP_ENGINE_SERVICE_ACCOUNT } from "./runtime-config";

if (!admin.apps.length) {
  admin.initializeApp();
}

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
const PLAN_TOOL_NAME = "submit_plan";

export const PLAN_TOOL: any = {
  name: PLAN_TOOL_NAME,
  description:
    "Return the generated MonthlyGrow plan as structured JSON matching the required schema.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      newAreas: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            key: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            icon: { type: "string" },
            color: { type: "string" },
          },
          required: ["key", "name", "description", "icon", "color"],
        },
      },
      projects: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: {
              type: "string",
              enum: ["repetitive", "task_based"],
            },
            areaAssignment: {
              type: "object",
              additionalProperties: false,
              properties: {
                type: {
                  type: "string",
                  enum: ["existing", "new"],
                },
                existingAreaId: { type: "string" },
                newAreaKey: { type: "string" },
              },
              required: ["type"],
            },
            durationWeeks: { type: "number" },
            tasks: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  duration: { type: "number" },
                },
                required: ["title", "description", "duration"],
              },
            },
          },
          required: [
            "title",
            "description",
            "category",
            "areaAssignment",
            "durationWeeks",
            "tasks",
          ],
        },
      },
    },
    required: ["projects"],
  },
};

function getAnthropicClient() {
  const apiKey = anthropicApiKey.value();

  if (!apiKey) {
    throw new HttpsError(
      "failed-precondition",
      "ANTHROPIC_API_KEY secret이 설정되지 않았습니다."
    );
  }

  return new Anthropic({ apiKey });
}

function extractPlanFromMessage(message: any) {
  const toolUseBlock = message.content.find(
    (block: any) => block.type === "tool_use" && block.name === PLAN_TOOL_NAME
  );

  if (toolUseBlock?.input) {
    return {
      parsedPlan: toolUseBlock.input,
      originalResponse: JSON.stringify(toolUseBlock.input),
    };
  }

  const firstContent = message.content[0];
  if (!firstContent || !("text" in firstContent)) {
    throw new HttpsError("internal", "AI 응답 형식이 올바르지 않습니다.");
  }

  const responseText = firstContent.text;
  const jsonMatch =
    responseText.match(/```json\n([\s\S]*?)\n```/) ||
    responseText.match(/\{[\s\S]*\}/);

  try {
    return {
      parsedPlan: JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText),
      originalResponse: responseText,
    };
  } catch (parseError) {
    console.error("JSON 파싱 실패:", parseError);
    console.error("AI 원본 응답:", responseText);
    throw new HttpsError("internal", "AI 응답을 처리할 수 없습니다.");
  }
}

function logClaudeMessageForDebug(message: any) {
  try {
    const contentSummary = Array.isArray(message?.content)
      ? message.content.map((block: any) => {
          if (block?.type === "tool_use") {
            return {
              type: "tool_use",
              name: block.name,
              input: block.input,
            };
          }

          if (block?.type === "text") {
            return {
              type: "text",
              text: typeof block.text === "string" ? block.text.slice(0, 4000) : "",
            };
          }

          return block;
        })
      : message?.content;

    console.log(
      "Claude raw message:",
      JSON.stringify(
        {
          id: message?.id,
          model: message?.model,
          role: message?.role,
          stop_reason: message?.stop_reason,
          usage: message?.usage,
          content: contentSummary,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error("Claude raw message 로깅 실패:", error);
  }
}

export function normalizePlanForFrontend(plan: any) {
  const newAreas = Array.isArray(plan?.newAreas)
    ? plan.newAreas
    : Array.isArray(plan?.areas)
    ? plan.areas
    : [];
  const normalizedNewAreas = Array.from(
    new Map(
      [
        ...newAreas.map((area: any, index: number) => ({
          key:
            typeof area?.key === "string" && area.key
              ? area.key
              : `new-area-${index}`,
          name: area?.name || "",
          description: area?.description || "",
          icon: area?.icon || "compass",
          color: area?.color || "#6b7280",
        })),
        ...((Array.isArray(plan?.projects) ? plan.projects : [])
          .filter(
            (project: any) =>
              project?.areaAssignment?.type === "new" &&
              typeof project?.areaAssignment?.newAreaKey === "string" &&
              project.areaAssignment.newAreaKey &&
              !newAreas.some(
                (area: any) => area?.key === project.areaAssignment.newAreaKey
              )
          )
          .map((project: any) => ({
            key: project.areaAssignment.newAreaKey,
            name: project?.areaName || project?.title || "새 영역",
            description: "",
            icon: "compass",
            color: "#6b7280",
          }))),
      ].map((area) => [area.key, area] as const)
    ).values()
  );
  const newAreaNameByKey = new Map(
    normalizedNewAreas.map((area: any) => [
      area?.key || "",
      area?.name || "",
    ])
  );
  const projects = Array.isArray(plan?.projects)
    ? plan.projects.map((project: any) => {
        const tasks = Array.isArray(project?.tasks)
          ? project.tasks.map((task: any) => ({
              title: task?.title || "",
              description: task?.description || "",
              duration: typeof task?.duration === "number" ? task.duration : 1,
              requirements: Array.isArray(task?.requirements)
                ? task.requirements
                : [],
              resources: Array.isArray(task?.resources) ? task.resources : [],
              prerequisites: Array.isArray(task?.prerequisites)
                ? task.prerequisites
                : [],
            }))
          : [];

        return {
          title: project?.title || "",
          description: project?.description || "",
          category:
            project?.category === "repetitive" ? "repetitive" : "task_based",
          areaName:
            project?.areaAssignment?.type === "new"
              ? newAreaNameByKey.get(project?.areaAssignment?.newAreaKey) ||
                project?.areaName ||
                ""
              : project?.areaName || "",
          areaAssignment:
            project?.areaAssignment?.type === "existing"
              ? {
                  type: "existing",
                  existingAreaId: project?.areaAssignment?.existingAreaId || "",
                }
              : {
                  type: "new",
                  newAreaKey: project?.areaAssignment?.newAreaKey || "",
                },
          durationWeeks:
            typeof project?.durationWeeks === "number" ? project.durationWeeks : 1,
          difficulty: project?.difficulty || "intermediate",
          target: project?.target || project?.title || "",
          targetCount:
            typeof project?.targetCount === "number"
              ? project.targetCount
              : tasks.length,
          estimatedDailyTime:
            typeof project?.estimatedDailyTime === "number"
              ? project.estimatedDailyTime
              : 0,
          tasks,
          milestones: Array.isArray(project?.milestones)
            ? project.milestones
            : [],
          resources: Array.isArray(project?.resources) ? project.resources : [],
        };
      })
    : [];

  return {
    newAreas: normalizedNewAreas,
    projects,
    timeline:
      plan?.timeline && typeof plan.timeline === "object"
        ? {
            totalWeeks:
              typeof plan.timeline.totalWeeks === "number"
                ? plan.timeline.totalWeeks
                : 0,
            weeklySchedule: Array.isArray(plan.timeline.weeklySchedule)
              ? plan.timeline.weeklySchedule
              : [],
          }
        : { totalWeeks: 0, weeklySchedule: [] },
    successMetrics: Array.isArray(plan?.successMetrics)
      ? plan.successMetrics
      : [],
  };
}

export function validateGeneratedPlan(plan: any, existingAreas: any[] = []) {
  const projects = Array.isArray(plan?.projects) ? plan.projects : [];
  const newAreas = Array.isArray(plan?.newAreas)
    ? plan.newAreas
    : Array.isArray(plan?.areas)
    ? plan.areas
    : [];
  const newAreaKeys = new Set(
    newAreas
      .map((area: any, index: number) =>
        typeof area?.key === "string" && area.key ? area.key : `new-area-${index}`
      )
      .filter(Boolean)
  );
  const existingAreaIds = new Set(existingAreas.map((area) => area.id));

  if (projects.length === 0) {
    return {
      isValid: false,
      reason: "프로젝트가 생성되지 않았습니다.",
    };
  }

  for (const project of projects) {
    const tasks = Array.isArray(project?.tasks) ? project.tasks : [];
    if (tasks.length === 0) {
      return {
        isValid: false,
        reason: `프로젝트 "${project?.title || "이름 없는 프로젝트"}"에 작업이 없습니다.`,
      };
    }

    const assignment = project?.areaAssignment;
    if (!assignment || (assignment.type !== "existing" && assignment.type !== "new")) {
      return {
        isValid: false,
        reason: `프로젝트 "${project?.title || "이름 없는 프로젝트"}"의 영역 매핑 정보가 없습니다.`,
      };
    }

    if (assignment.type === "existing") {
      if (!assignment.existingAreaId || !existingAreaIds.has(assignment.existingAreaId)) {
        return {
          isValid: false,
          reason: `프로젝트 "${project?.title || "이름 없는 프로젝트"}"가 유효하지 않은 기존 영역을 참조합니다.`,
        };
      }
    }

    if (assignment.type === "new") {
      if (!assignment.newAreaKey || !newAreaKeys.has(assignment.newAreaKey)) {
        return {
          isValid: false,
          reason: `프로젝트 "${project?.title || "이름 없는 프로젝트"}"가 유효하지 않은 새 영역을 참조합니다.`,
        };
      }
    }
  }

  return {
    isValid: true,
    reason: "",
  };
}

async function requestValidatedPlan({
  anthropic,
  system,
  userContent,
  maxTokens,
  existingAreas,
}: {
  anthropic: Anthropic;
  system: string;
  userContent: string;
  maxTokens: number;
  existingAreas: any[];
}) {
  let lastReason = "AI 응답이 비어 있습니다.";

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const retryNotice =
      attempt === 1
        ? ""
        : `\n\nIMPORTANT: Your previous response was invalid because ${lastReason} You must return at least 1 project, and every project must contain at least 1 task. Every project must either reference an existing area by exact existingAreaId or reference a new area by newAreaKey.`;

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      temperature: 0.3,
      system,
      tools: [PLAN_TOOL],
      tool_choice: {
        type: "tool",
        name: PLAN_TOOL_NAME,
        disable_parallel_tool_use: true,
      },
      messages: [
        {
          role: "user",
          content: `${userContent}${retryNotice}`,
        },
      ],
    });

    logClaudeMessageForDebug(message);

    let { parsedPlan, originalResponse } = extractPlanFromMessage(message);
    console.log("Claude extracted response:", originalResponse);
    parsedPlan = normalizePlanForFrontend(parsedPlan);

    const validation = validateGeneratedPlan(parsedPlan, existingAreas);

    lastReason = validation.reason;

    if (validation.isValid) {
      return {
        parsedPlan,
        originalResponse,
      };
    }

    console.warn(`AI 계획 검증 실패 (시도 ${attempt}/2):`, validation.reason);
    console.warn("검증 실패 응답:", JSON.stringify(parsedPlan, null, 2));
  }

  throw new HttpsError(
    "failed-precondition",
    `AI가 유효한 계획을 생성하지 못했습니다. ${lastReason} 다시 시도해주세요.`
  );
}

// 사용자의 기존 Areas 조회 함수
async function fetchUserAreas(userId: string) {
  try {
    const areasSnapshot = await admin
      .firestore()
      .collection("areas")
      .where("userId", "==", userId)
      .get();

    return areasSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        icon: data.icon,
        color: data.color,
        status: data.status,
      };
    });
  } catch (error) {
    console.error("사용자 Areas 조회 실패:", error);
    return [];
  }
}

// 시스템 프롬프트 정의
const SYSTEM_PROMPT = `You are a Monthly Grow app plan generation assistant. Your primary job is to create concrete projects and tasks. Areas are only organizational containers for those projects.

**Monthly 기반 계획 생성 시 중요 사항:**
- Monthly의 목표, Key Results, 중점 영역을 정확히 반영한 프로젝트를 생성하세요.
- Monthly의 보상 달성을 위한 구체적인 단계를 포함하세요.
- 생성된 프로젝트는 Monthly의 목표와 직접적으로 연관되어야 합니다.
- 중점 영역에 맞는 영역으로 프로젝트를 분류하세요.
- 프로젝트 기간은 Monthly 기간보다 짧거나 길 수 있습니다 (목표 달성에 필요한 경우).
- Monthly는 참고점으로 고려하되, 프로젝트 기간은 실제 목표 달성에 필요한 기간으로 설정하세요.

Return the plan through the provided structured tool, not as free-form text.

**Area Assignment Rules:**
- Existing areas are already provided by the server with exact IDs.
- Prefer reusing existing areas when they fit a project.
- Only create entries in newAreas when no existing area fits.
- Every project must have areaAssignment.
- For existing areas, set areaAssignment.type to "existing" and provide exact existingAreaId.
- For new areas, set areaAssignment.type to "new", provide newAreaKey, and include the matching definition in newAreas.
- Multiple projects may reference the same newAreaKey when they belong to the same new area.

**Task Creation Rules:**
- Create detailed, specific tasks that align with project goals
- Consider available time: Total Time = durationWeeks × daysPerWeek × minutesPerDay
- Each task should be actionable and measurable
- Duration should reflect actual effort needed (0.1-24 hours)
- For repetitive: Create sequential sessions (Session 1, Session 2, etc.)
- For task-based: Create specific milestone tasks to achieve goals

**General Rules:**
- Empty project arrays are invalid.
- All projects must have tasks array with at least 1 task
- Never create projects without tasks
- Category must be "repetitive" or "task_based"
- Repetitive: same activity repeated (exercise, reading, study)
- Task-based: various tasks to achieve goals

${CONSTRAINTS_SYSTEM_GUIDE}`;

// 계획 생성 함수
export const generatePlan = onCall(
  {
    region: AI_FUNCTION_REGION,
    serviceAccount: APP_ENGINE_SERVICE_ACCOUNT,
    secrets: [anthropicApiKey],
  },
  async (request) => {
    // 인증 확인
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const {
      userInput,
      constraints,
      inputType = "manual",
      selectedMonthlyId,
    } = request.data;

    if (!userInput || typeof userInput !== "string") {
      throw new HttpsError("invalid-argument", "사용자 입력이 필요합니다.");
    }

    try {
      const anthropic = getAnthropicClient();

    // 1. 사용자의 기존 Areas 조회
    const existingAreas = await fetchUserAreas(request.auth.uid);

    // 2. Monthly 기반 입력인 경우 Monthly 데이터 조회
    let monthlyContext = "";
    if (inputType === "monthly" && selectedMonthlyId) {
      try {
        const { getFirestore } = await import("firebase-admin/firestore");
        const db = getFirestore();
        const monthlyDoc = await db
          .collection("monthlies")
          .doc(selectedMonthlyId)
          .get();

        if (monthlyDoc.exists) {
          const monthlyData = monthlyDoc.data();
          if (monthlyData) {
            // Monthly 데이터를 프롬프트에 포함할 형태로 변환 (영어로)
            monthlyContext = `\n\n=== Selected Monthly Information ===\n`;
            monthlyContext += `Objective: ${monthlyData.objective}\n`;

            if (monthlyData.objectiveDescription) {
              monthlyContext += `Objective Description: ${monthlyData.objectiveDescription}\n`;
            }

            if (monthlyData.keyResults && monthlyData.keyResults.length > 0) {
              monthlyContext += `\nKey Results:\n`;
              monthlyData.keyResults.forEach((kr: any, index: number) => {
                monthlyContext += `${index + 1}. ${kr.title}`;
                if (kr.description) {
                  monthlyContext += ` - ${kr.description}`;
                }
                if (kr.targetCount) {
                  monthlyContext += ` (Target: ${kr.targetCount} times)`;
                }
                monthlyContext += `\n`;
              });
            }

            if (monthlyData.focusAreas && monthlyData.focusAreas.length > 0) {
              const focusAreaNames = monthlyData.focusAreas.map((focusAreaId: string) => {
                const matchingArea = existingAreas.find(
                  (area) => area.id === focusAreaId || area.name === focusAreaId
                );
                return matchingArea?.name || focusAreaId;
              });
              monthlyContext += `\nFocus Areas: ${focusAreaNames.join(", ")}\n`;
            }

            if (monthlyData.reward) {
              monthlyContext += `Reward: ${monthlyData.reward}\n`;
            }

            // Monthly 기간 계산 (참고용)
            const startDate = monthlyData.startDate.toDate
              ? monthlyData.startDate.toDate()
              : monthlyData.startDate;
            const endDate = monthlyData.endDate.toDate
              ? monthlyData.endDate.toDate()
              : monthlyData.endDate;
            const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const monthlyWeeks = Math.ceil(diffDays / 7);

            monthlyContext += `\nMonthly Duration: ${monthlyWeeks} weeks (${diffDays} days) - for reference`;
            monthlyContext += `\n\nImportant: Based on the above Monthly information, create specific projects and tasks.`;
            monthlyContext += `\n- Create projects directly related to the objective and Key Results.`;
            monthlyContext += `\n- Categorize projects into areas that match the focus areas.`;
            monthlyContext += `\n- Include specific steps to achieve the reward.`;
            monthlyContext += `\n- Project duration can be shorter or longer than Monthly duration based on goal requirements.`;
            monthlyContext += `\n- Consider Monthly as a reference point, but set project duration based on actual needs.`;
            monthlyContext += `\n=== End of Monthly Information ===\n`;
          }
        }
      } catch (error) {
        console.error("Monthly 데이터 조회 실패:", error);
        // Monthly 데이터 조회 실패 시 수동 입력으로 fallback
      }
    }

    // 2. 기존 Areas 정보를 프롬프트에 포함
    const areasContext =
      existingAreas.length > 0
        ? `\n\n사용자의 기존 영역들:\n${existingAreas
            .map(
              (area) =>
                `- ${area.name} (ID: ${area.id}): ${
                  area.description || "설명 없음"
                }`
            )
            .join(
              "\n"
            )}\n\n중요: 기존 영역과 유사하거나 동일한 영역이 있다면 새로 생성하지 말고 기존 영역을 재사용하세요. 새로운 영역만 생성하세요.`
        : "\n\n사용자의 기존 영역이 없습니다. 필요한 영역들을 새로 생성하세요.";

    // 3. 제약사항 정보 추가
    console.log("=== 제약사항 전달 확인 ===");
    console.log("전달된 제약사항:", JSON.stringify(constraints, null, 2));
    const constraintsContext = generateConstraintsGuide(constraints);
    console.log("AI에게 전달될 제약사항 컨텍스트:", constraintsContext);
    console.log("=== 제약사항 전달 확인 끝 ===");

    let { parsedPlan, originalResponse } = await requestValidatedPlan({
      anthropic,
      system: SYSTEM_PROMPT + areasContext,
      userContent: `Convert the following plan into Monthly Grow app format:${monthlyContext}${constraintsContext}\n\n${userInput}`,
      maxTokens: 3000,
      existingAreas,
    });

    console.log("=== AI 원본 응답 ===");
    console.log("파싱된 계획:", JSON.stringify(parsedPlan, null, 2));
    console.log("=== AI 원본 응답 끝 ===");

    const newAreaMap = new Map<string, any>(
      (parsedPlan.newAreas || []).map((area: any) => [area.key, area] as const)
    );

    parsedPlan.projects = (parsedPlan.projects || []).map((project: any) => {
      if (project.areaAssignment?.type === "existing") {
        const matchedExistingArea = existingAreas.find(
          (area) => area.id === project.areaAssignment.existingAreaId
        );
        return {
          ...project,
          areaName: matchedExistingArea?.name || project.areaName || "",
        };
      }

      if (project.areaAssignment?.type === "new") {
        const matchedNewArea = newAreaMap.get(project.areaAssignment.newAreaKey);
        return {
          ...project,
          areaName: matchedNewArea?.name || project.areaName || "",
        };
      }

      return project;
    });

    // 6. 시간 분배 및 estimatedDailyTime 계산
    console.log("=== 시간 분배 로직 시작 ===");
    console.log("사용자 설정 제약사항:", {
      daysPerWeek: constraints?.dailyTimeSlots?.daysPerWeek,
      durationPerDay: constraints?.dailyTimeSlots?.minutesPerDay,
      targetDuration: constraints?.targetDuration,
      difficulty: constraints?.difficulty,
      focusIntensity: constraints?.focusIntensity,
      preferredActivityStyle: constraints?.preferredActivityStyle,
    });

    if (parsedPlan.projects) {
      parsedPlan.projects = parsedPlan.projects.map((project: any) => {
        const daysPerWeek =
          constraints?.dailyTimeSlots?.daysPerWeek ||
          constraints?.dailyTimeSlots?.maxDaysPerWeek ||
          5;
        const durationPerDay =
          constraints?.dailyTimeSlots?.minutesPerDay ||
          constraints?.dailyTimeSlots?.maxMinutesPerDay ||
          60; // 분 단위
        const totalAvailableTime =
          project.durationWeeks * daysPerWeek * durationPerDay; // 총 사용 가능한 시간 (분)

        console.log(`프로젝트 "${project.title}" 분석:`, {
          category: project.category,
          durationWeeks: project.durationWeeks,
          daysPerWeek,
          durationPerDay,
          totalAvailableTime,
          currentTasks: project.tasks?.length || 0,
          targetCount: project.targetCount,
          originalTasks: project.tasks?.map((t: any) => t.title) || [],
          userConstraints: {
            targetDuration: constraints?.targetDuration,
            difficulty: constraints?.difficulty,
            focusIntensity: constraints?.focusIntensity,
            preferredActivityStyle: constraints?.preferredActivityStyle,
          },
        });

        // 태스크 검증 및 기본 태스크 생성
        console.log(`프로젝트 "${project.title}" 태스크 검증:`, {
          category: project.category,
          hasTasks: !!project.tasks,
          tasksLength: project.tasks?.length || 0,
          targetCount: project.targetCount,
        });

        // 태스크가 없거나 빈 배열인 경우 기본 태스크 생성
        if (!project.tasks || project.tasks.length === 0) {
          console.log(`프로젝트 "${project.title}"에 기본 태스크 생성 필요`);

          if (project.category === "repetitive") {
            // 반복형 프로젝트: 기본 태스크 생성
            const baseActivity = project.target || project.title || "활동";
            const targetCount = project.targetCount || 5; // 기본값 5회

            project.tasks = [];
            for (let i = 1; i <= targetCount; i++) {
              project.tasks.push({
                title: `${baseActivity} ${i}회차`,
                description: `${baseActivity} ${i}회차 수행`,
                duration: Math.max(
                  0.1,
                  Math.min(24, totalAvailableTime / targetCount / 60)
                ),
                requirements: [],
                resources: [],
                prerequisites: [],
              });
            }

            project.targetCount = targetCount;
            console.log(
              `반복형 프로젝트 "${project.title}" 기본 태스크 ${targetCount}개 생성 완료`
            );
          } else {
            // 작업형 프로젝트: 기본 태스크 생성
            project.tasks = [
              {
                title: `${project.title} 시작`,
                description: `${project.title} 프로젝트를 시작합니다.`,
                duration: Math.max(
                  0.1,
                  Math.min(24, totalAvailableTime / 3 / 60)
                ),
                requirements: [],
                resources: [],
                prerequisites: [],
              },
              {
                title: `${project.title} 진행`,
                description: `${project.title} 프로젝트를 진행합니다.`,
                duration: Math.max(
                  0.1,
                  Math.min(24, totalAvailableTime / 3 / 60)
                ),
                requirements: [],
                resources: [],
                prerequisites: [],
              },
              {
                title: `${project.title} 완료`,
                description: `${project.title} 프로젝트를 완료합니다.`,
                duration: Math.max(
                  0.1,
                  Math.min(24, totalAvailableTime / 3 / 60)
                ),
                requirements: [],
                resources: [],
                prerequisites: [],
              },
            ];

            project.targetCount = 3;
            console.log(
              `작업형 프로젝트 "${project.title}" 기본 태스크 3개 생성 완료`
            );
          }
        } else {
          // 기존 태스크가 있는 경우 검증 및 보완
          console.log(
            `프로젝트 "${project.title}" 기존 태스크 ${project.tasks.length}개 검증`
          );

          // 반복형 프로젝트: 태스크가 부족한 경우 추가
          if (project.category === "repetitive") {
            const targetCount = project.targetCount || project.tasks.length;
            if (project.tasks.length < targetCount) {
              const baseActivity = project.target || project.title || "활동";
              const additionalTasksNeeded = targetCount - project.tasks.length;

              console.log(
                `반복형 프로젝트 "${project.title}" 태스크 추가: ${additionalTasksNeeded}개 추가 생성`
              );

              for (let i = 1; i <= additionalTasksNeeded; i++) {
                const newTaskNumber = project.tasks.length + i;
                project.tasks.push({
                  title: `${baseActivity} ${newTaskNumber}회차`,
                  description: `${baseActivity} ${newTaskNumber}회차 수행`,
                  duration: Math.max(
                    0.1,
                    Math.min(24, totalAvailableTime / targetCount / 60)
                  ),
                  requirements: [],
                  resources: [],
                  prerequisites: [],
                });
              }
            }
            project.targetCount = project.tasks.length;
          } else {
            // 작업형 프로젝트: targetCount를 실제 태스크 개수로 설정
            project.targetCount = project.tasks.length;
          }
        }

        // 6. 모든 태스크의 duration 검증 및 보정
        if (project.tasks && project.tasks.length > 0) {
          // 태스크별 duration 검증 및 보정
          project.tasks = project.tasks.map((task: any, index: number) => {
            // duration이 없거나 유효하지 않은 경우 기본값 설정
            let taskDuration = task.duration || 1.0;

            // 최소 0.1시간, 최대 24시간으로 제한
            taskDuration = Math.max(0.1, Math.min(24, taskDuration));

            return {
              ...task,
              duration: taskDuration,
            };
          });

          // 프로젝트의 estimatedDailyTime 계산
          // 사용자가 설정한 일일 가용 시간을 우선 사용
          if (constraints?.dailyTimeSlots?.minutesPerDay) {
            project.estimatedDailyTime = constraints.dailyTimeSlots.minutesPerDay;
          } else {
            project.estimatedDailyTime = Math.round(
              totalAvailableTime / (project.durationWeeks * 7)
            ); // 일일 평균 시간
          }

          console.log(`프로젝트 "${project.title}" 최종 결과:`, {
            totalTasks: project.tasks.length,
            estimatedDailyTime: project.estimatedDailyTime,
            targetCount: project.targetCount,
            totalAvailableTime,
            durationWeeks: project.durationWeeks,
            calculation: `${totalAvailableTime} / (${project.durationWeeks} * 7) = ${project.estimatedDailyTime}`,
          });
        }

        return project;
      });
    }
    console.log("=== 검증 로직 완료 ===");

      return {
        success: true,
        plan: parsedPlan,
        originalResponse,
        existingAreas: existingAreas.length,
      };
    } catch (error) {
      console.error("Claude API 오류:", error);
      throw new HttpsError("internal", "AI 서비스 오류가 발생했습니다.");
    }
  }
);

// 테스트용 간단한 함수
export const testClaudeConnection = onCall(
  {
    region: AI_FUNCTION_REGION,
    serviceAccount: APP_ENGINE_SERVICE_ACCOUNT,
    secrets: [anthropicApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    try {
      const anthropic = getAnthropicClient();
      const message = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "안녕하세요! 연결 테스트입니다.",
          },
        ],
      });

      const firstContent = message.content[0];
      if (!("text" in firstContent)) {
        throw new HttpsError("internal", "AI 응답 형식이 올바르지 않습니다.");
      }

      return {
        success: true,
        response: firstContent.text,
      };
    } catch (error) {
      console.error("Claude 연결 테스트 실패:", error);
      throw new HttpsError("internal", "Claude API 연결에 실패했습니다.");
    }
  }
);

// Firebase Functions에 추가
export const refinePlan = onCall(
  {
    region: AI_FUNCTION_REGION,
    serviceAccount: APP_ENGINE_SERVICE_ACCOUNT,
    secrets: [anthropicApiKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const { originalPlan, feedback, adjustments } = request.data;
    const refinementExistingAreas = Array.isArray(originalPlan?.projects)
      ? originalPlan.projects
          .filter(
            (project: any) =>
              project?.areaAssignment?.type === "existing" &&
              project?.areaAssignment?.existingAreaId
          )
          .map((project: any) => ({
            id: project.areaAssignment.existingAreaId,
            name: project.areaName || "",
          }))
      : [];

  const refinementPrompt = `
기존 계획을 사용자 피드백을 바탕으로 개선해주세요.

## 기존 계획:
${JSON.stringify(originalPlan, null, 2)}

## 사용자 피드백:
${feedback}

## 요청된 조정사항:
${JSON.stringify(adjustments, null, 2)}

기존 계획의 구조를 유지하면서 사용자 요청을 반영한 개선된 계획을 제공해주세요.
`;

    try {
      const anthropic = getAnthropicClient();
      const { parsedPlan: refinedPlan, originalResponse } =
        await requestValidatedPlan({
          anthropic,
          system: SYSTEM_PROMPT,
          userContent: refinementPrompt,
          maxTokens: 4000,
          existingAreas: refinementExistingAreas,
        });

      return {
        success: true,
        refinedPlan,
        improvements: extractImprovements(originalResponse),
      };
    } catch (error) {
      console.error("계획 개선 오류:", error);
      throw new HttpsError("internal", "계획 개선 중 오류가 발생했습니다.");
    }
  }
);

function extractImprovements(responseText: string): string[] {
  // AI 응답에서 개선 사항을 추출하는 로직
  const improvements: string[] = [];
  const lines = responseText.split("\n");

  let inImprovementSection = false;
  for (const line of lines) {
    if (line.includes("개선") || line.includes("변경")) {
      inImprovementSection = true;
      continue;
    }

    if (inImprovementSection && line.startsWith("- ")) {
      improvements.push(line.substring(2));
    }
  }

  return improvements;
}
