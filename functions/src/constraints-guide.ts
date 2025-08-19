import { PlanConstraints } from "../../lib/types";

/**
 * 제약사항 활용 가이드라인 생성 함수
 * @param constraints 사용자 설정 제약사항
 * @returns AI에게 전달할 제약사항 활용 가이드라인 문자열
 */
export function generateConstraintsGuide(constraints: PlanConstraints): string {
  // max 값은 설정되지 않았을 때만 표시

  const projectWeeksText = constraints.projectWeeks
    ? `${constraints.projectWeeks} weeks`
    : `AI will set (max ${constraints.maxProjectWeeks} weeks)`;

  const daysPerWeekText = constraints.dailyTimeSlots?.daysPerWeek
    ? `${constraints.dailyTimeSlots.daysPerWeek} days`
    : `AI will set (max ${constraints.dailyTimeSlots?.maxDaysPerWeek} days)`;

  const minutesPerDayText = constraints.dailyTimeSlots?.minutesPerDay
    ? `${constraints.dailyTimeSlots.minutesPerDay} minutes`
    : `AI will set (max ${constraints.dailyTimeSlots?.maxMinutesPerDay} minutes)`;

  // 설명이 포함된 제약사항 객체 생성
  const constraintsWithDescriptions = {
    ...constraints,
    difficulty: constraints.difficulty
      ? {
          value: constraints.difficulty,
          description:
            constraints.difficulty === "beginner"
              ? "Basic concepts, step-by-step learning, fundamental principles"
              : constraints.difficulty === "intermediate"
              ? "Practical application, advanced concepts, real-world projects"
              : "Advanced techniques, complex projects, expert-level skills",
        }
      : undefined,
    preferredActivityStyle: constraints.preferredActivityStyle
      ? {
          value: constraints.preferredActivityStyle,
          description:
            constraints.preferredActivityStyle === "visual"
              ? "Images, charts, videos"
              : constraints.preferredActivityStyle === "auditory"
              ? "Audio, conversations, explanations"
              : constraints.preferredActivityStyle === "kinesthetic"
              ? "Hands-on practice, actions, experiences"
              : "Text, documents, articles",
        }
      : undefined,
  };

  return `\n\nUser Constraints:\n${JSON.stringify(
    constraintsWithDescriptions,
    null,
    2
  )}\n\nConstraints Utilization Guidelines:\n\n
  - Project Duration: ${projectWeeksText}\n
  - Days per Week: ${daysPerWeekText}\n
  - Minutes per Day: ${minutesPerDayText}\n
  ${
    constraints.difficulty
      ? `- Current Level: ${
          constraints.difficulty === "beginner"
            ? "Beginner (Basic concepts, step-by-step learning, fundamental principles)"
            : constraints.difficulty === "intermediate"
            ? "Intermediate (Practical application, advanced concepts, real-world projects)"
            : "Advanced (Advanced techniques, complex projects, expert-level skills)"
        }\n`
      : ""
  }
  ${
    constraints.focusIntensity
      ? `- Focus Intensity: ${
          constraints.focusIntensity === "light"
            ? "Light (Relaxed pace)"
            : constraints.focusIntensity === "moderate"
            ? "Moderate (Balanced approach)"
            : "Intensive (Fast results)"
        }\n`
      : ""
  }
  ${
    constraints.preferredActivityStyle
      ? `- Activity Style: ${
          constraints.preferredActivityStyle === "visual"
            ? "Visual (Images, charts, videos)"
            : constraints.preferredActivityStyle === "auditory"
            ? "Auditory (Audio, conversations, explanations)"
            : constraints.preferredActivityStyle === "kinesthetic"
            ? "Kinesthetic (Hands-on practice, actions, experiences)"
            : "Reading (Text, documents, articles)"
        }\n`
      : ""
  }
  \n
  ⚡ Key Utilization Methods:\n\n
  1. Time Constraints:\n   - Total Available Time = Project Duration × Days per Week × Minutes per Day\n   - Plan within maximum limits\n   - 30min~1hour: Simple review, reading focus\n   - 2+ hours: Practice, project work\n\n2. Learning Style:\n   - Include activities matching the preferred style in task generation\n\n3. Required Compliance:\n- All numeric fields must be set as numbers\n- All array fields must be set as [] even if empty\n- Repetitive tasks as "Session X" format, task-based as individual tasks\n- areaName must exactly match the name in areas array\n- Duration: minimum 0.1 hours, maximum 24 hours per task`;
}

/**
 * 시스템 프롬프트에 추가할 제약사항 활용 지침
 */
export const CONSTRAINTS_SYSTEM_GUIDE = `

**Constraints Utilization:**

🎯 **Plan Creation:**
- Prioritize user constraints for realistic plans
- Avoid impossible schedules

⏰ **Time Constraints:**
- Respect days per week and minutes per day
- Complete within project duration when set
- Total Time = Duration × Days × Minutes

📊 **Difficulty Adjustment:**
- Set appropriate difficulty level
- Adjust based on focus intensity

🎨 **Activity Style:**
- Match preferred activity style in tasks
- Include specified style activities

⚡ **Feasibility:**
- Ensure goals achievable within time
`;
