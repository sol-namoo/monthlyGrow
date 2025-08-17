import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import {
  generateConstraintsGuide,
  CONSTRAINTS_SYSTEM_GUIDE,
} from "./constraints-guide";

if (!admin.apps.length) {
  admin.initializeApp();
}

// Claude API 클라이언트 초기화
const anthropic = new Anthropic({
  apiKey: functions.config().anthropic.api_key,
});

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
const SYSTEM_PROMPT = `당신은 Monthly Grow 앱의 계획 생성 어시스턴트입니다. 사용자의 자연어 계획을 받아서 영역(areas), 프로젝트(projects), 작업(tasks), 리소스(resources)만 생성해주세요. Monthly는 생성하지 마세요. 다음과 같은 JSON 형식으로 변환해주세요:

{
  "areas": [
    {
      "name": "영역명 (예: '커리어', '어학', '기술')",
      "description": "영역에 대한 상세 설명",
      "icon": "적절한 아이콘명 (예: 'briefcase', 'book', 'code')",
      "color": "색상 코드 (예: '#3B82F6', '#10B981', '#F59E0B')"
    }
  ],
  "projects": [
    {
      "title": "프로젝트 제목",
      "description": "프로젝트에 대한 상세 설명",
      "category": "repetitive 또는 task_based (반드시 둘 중 하나 선택)",
      "areaName": "소속 영역명 (areas 배열의 name과 정확히 일치해야 함)",
      "durationWeeks": "프로젝트 기간 (주) - 반드시 숫자로 설정",
      "estimatedDailyTime": "일일 예상 시간 (분) - 반드시 숫자로 설정",
      "tasks": [
        {
          "title": "작업 제목",
          "description": "작업에 대한 상세 설명",
          "duration": "소요 시간 (시간 단위, 최소 0.1시간, 최대 24시간) - 반드시 숫자로 설정",
          "requirements": ["필요한 도구나 준비사항 배열"],
          "resources": ["필요한 리소스 배열"],
          "prerequisites": ["선행 조건 배열"]
        }
      ]
    }
  ]
}

**데이터 타입 및 관계:**

1. **Area (영역)**: 
   - name: string (고유한 영역명)
   - description: string (영역 설명)
   - icon: string (아이콘명)
   - color: string (색상 코드)

2. **Project (프로젝트)**:
   - title: string (프로젝트 제목)
   - description: string (프로젝트 설명)
   - category: "repetitive" | "task_based" (반드시 둘 중 하나)
   - areaName: string (areas 배열의 name과 정확히 일치)
   - durationWeeks: number (프로젝트 기간)
   - estimatedDailyTime: number (일일 예상 시간, 분 단위)
   - tasks: Task[] (작업 목록)

3. **Task (작업)**:
   - title: string (작업 제목)
   - description: string (작업 설명)
   - duration: number (소요 시간, 시간 단위)
   - requirements: string[] (필요한 도구/준비사항)
   - resources: string[] (필요한 리소스)
   - prerequisites: string[] (선행 조건)

**필수 정보 채우기 규칙:**
- 모든 숫자 필드는 반드시 숫자로 설정 (문자열 아님)
- 모든 배열 필드는 빈 배열이라도 []로 설정
- **areaName은 반드시 areas 배열의 name과 정확히 일치해야 하며, undefined나 null이 될 수 없습니다**
- **모든 프로젝트는 반드시 유효한 areaName을 가져야 합니다**
- **모든 프로젝트는 반드시 tasks 배열을 가져야 하며, 최소 1개 이상의 태스크가 있어야 합니다**
- **태스크가 없는 프로젝트는 절대 생성하지 마세요!**
- category는 반드시 "repetitive" 또는 "task_based" 중 하나

**⚠️ 태스크 생성 필수 규칙:**
- 모든 프로젝트는 반드시 구체적인 태스크를 가져야 합니다
- 태스크 제목은 명확하고 실행 가능해야 합니다
- 태스크 설명은 구체적이고 이해하기 쉬워야 합니다
- duration은 시간 단위로 설정 (최소 0.1시간, 최대 24시간, 소수점 첫째 자리까지)

⚠️ 프로젝트 생성 규칙:

**반복형 프로젝트 (repetitive):**
- tasks: 반드시 "1회차", "2회차", "3회차" 형태로 생성
- 예시: "알고리즘 문제 풀이 1회차", "알고리즘 문제 풀이 2회차", ...
- 각 태스크의 duration: 가용 시간을 고려하여 적절히 설정 (시간 단위)

**작업형 프로젝트 (task_based):**
- tasks: 목표 달성에 필요한 구체적인 작업들을 리스트업
- 예시: "이력서 템플릿 찾기", "경력 사항 정리", "자기소개서 작성", "면접 실전 연습 1회차", "리뷰", "면접 실전 연습 2회차", "리뷰"
- 작업형은 비슷한 작업을 여러 번 반복해도 됨 (면접 연습 → 리뷰 → 면접 연습 → 리뷰)

${CONSTRAINTS_SYSTEM_GUIDE}

**중요:** 
- 반복형은 동일한 활동의 반복이어야 함
- 작업형은 목표 달성에 필요한 다양한 작업들이어야 함
- **태스크 개수는 목표 달성에 필요한 만큼만 생성하세요**
- **모든 프로젝트는 반드시 최소 1개 이상의 태스크를 가져야 합니다**
- **태스크가 없는 프로젝트는 허용되지 않습니다**

**⚠️ CRITICAL: areaName 설정 규칙**
- 프로젝트의 areaName은 반드시 areas 배열에 정의된 name 중 하나와 정확히 일치해야 합니다
- 예시: areas에 "커리어"가 있다면, 프로젝트의 areaName도 "커리어"여야 합니다
- areaName을 undefined, null, 빈 문자열로 설정하면 안 됩니다
- 모든 프로젝트는 반드시 하나의 영역에 속해야 합니다`;

// 계획 생성 함수
export const generatePlan = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "로그인이 필요합니다."
    );
  }

  const {
    userInput,
    constraints,
    inputType = "manual",
    selectedMonthlyId,
  } = data;

  if (!userInput || typeof userInput !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "사용자 입력이 필요합니다."
    );
  }

  try {
    // 1. 사용자의 기존 Areas 조회
    const existingAreas = await fetchUserAreas(context.auth.uid);

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
            // Monthly 데이터를 프롬프트에 포함할 형태로 변환
            monthlyContext = `\n\n=== 선택된 Monthly 정보 ===\n`;
            monthlyContext += `목표: ${monthlyData.objective}\n`;

            if (monthlyData.objectiveDescription) {
              monthlyContext += `목표 설명: ${monthlyData.objectiveDescription}\n`;
            }

            if (monthlyData.keyResults && monthlyData.keyResults.length > 0) {
              monthlyContext += `\n주요 성과 지표 (Key Results):\n`;
              monthlyData.keyResults.forEach((kr: any, index: number) => {
                monthlyContext += `${index + 1}. ${kr.title}`;
                if (kr.description) {
                  monthlyContext += ` - ${kr.description}`;
                }
                if (kr.targetCount) {
                  monthlyContext += ` (목표: ${kr.targetCount}회)`;
                }
                monthlyContext += `\n`;
              });
            }

            if (monthlyData.focusAreas && monthlyData.focusAreas.length > 0) {
              monthlyContext += `\n중점 영역: ${monthlyData.focusAreas.join(
                ", "
              )}\n`;
            }

            if (monthlyData.reward) {
              monthlyContext += `보상: ${monthlyData.reward}\n`;
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

            monthlyContext += `\nMonthly 기간: ${monthlyWeeks}주 (${diffDays}일) - 참고용`;
            monthlyContext += `\n위 Monthly 정보를 바탕으로 구체적인 프로젝트와 태스크를 생성해주세요.`;
            monthlyContext += `\n=== Monthly 정보 끝 ===\n`;
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

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Sonnet 4가 출시되면 변경
      max_tokens: 2000,
      temperature: 0.3,
      system: SYSTEM_PROMPT + areasContext,
      messages: [
        {
          role: "user",
          content: `다음 계획을 Monthly Grow 앱 형식으로 변환해주세요:${monthlyContext}${constraintsContext}\n\n${userInput}`,
        },
      ],
    });

    // Claude 응답에서 JSON 추출
    const firstContent = message.content[0];
    if (!firstContent || !("text" in firstContent)) {
      throw new functions.https.HttpsError(
        "internal",
        "AI 응답 형식이 올바르지 않습니다."
      );
    }
    const responseText = (firstContent as any).text;
    let parsedPlan;

    try {
      // JSON 부분만 추출 (```json으로 감싸진 경우 처리)
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch
        ? jsonMatch[1] || jsonMatch[0]
        : responseText;
      parsedPlan = JSON.parse(jsonString);

      console.log("=== AI 원본 응답 ===");
      console.log("응답 텍스트:", responseText);
      console.log("파싱된 계획:", JSON.stringify(parsedPlan, null, 2));
      console.log("=== AI 원본 응답 끝 ===");
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      throw new functions.https.HttpsError(
        "internal",
        "AI 응답을 처리할 수 없습니다."
      );
    }

    // 4. 기존 Areas와 매칭하여 existingId 추가
    if (existingAreas.length > 0 && parsedPlan.areas) {
      parsedPlan.areas = parsedPlan.areas.map((aiArea: any) => {
        const matchingArea = existingAreas.find(
          (existing) =>
            existing.name.toLowerCase().includes(aiArea.name.toLowerCase()) ||
            aiArea.name.toLowerCase().includes(existing.name.toLowerCase())
        );

        if (matchingArea) {
          return {
            ...aiArea,
            existingId: matchingArea.id,
          };
        }
        return aiArea;
      });
    }

    // 5. areaName 검증 및 수정
    console.log("=== areaName 검증 시작 ===");
    if (parsedPlan.projects && parsedPlan.areas) {
      const validAreaNames = parsedPlan.areas.map((area: any) => area.name);
      console.log("유효한 area 이름들:", validAreaNames);

      parsedPlan.projects = parsedPlan.projects.map(
        (project: any, index: number) => {
          console.log(`프로젝트 "${project.title}" areaName 검증:`, {
            currentAreaName: project.areaName,
            validAreaNames,
            isValid: validAreaNames.includes(project.areaName),
          });

          // areaName이 undefined, null, 빈 문자열이거나 유효하지 않은 경우 수정
          if (
            !project.areaName ||
            project.areaName === "undefined" ||
            project.areaName === "null" ||
            !validAreaNames.includes(project.areaName)
          ) {
            console.warn(
              `⚠️ 프로젝트 "${project.title}"의 areaName이 유효하지 않습니다. 첫 번째 area로 설정합니다.`
            );
            project.areaName = validAreaNames[0]; // 첫 번째 area로 설정
            console.log(
              `✅ 프로젝트 "${project.title}" areaName 수정: ${project.areaName}`
            );
          }

          return project;
        }
      );
    }

    // 6. 시간 분배 및 estimatedDailyTime 계산
    console.log("=== 시간 분배 로직 시작 ===");
    console.log("사용자 설정 제약사항:", {
      daysPerWeek: constraints?.dailyTimeSlots?.daysPerWeek,
      durationPerDay: constraints?.dailyTimeSlots?.duration,
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
          constraints?.dailyTimeSlots?.duration ||
          constraints?.dailyTimeSlots?.maxDuration ||
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
          if (constraints?.dailyTimeSlots?.duration) {
            project.estimatedDailyTime = constraints.dailyTimeSlots.duration;
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
      originalResponse: responseText,
      existingAreas: existingAreas.length,
    };
  } catch (error) {
    console.error("Claude API 오류:", error);
    throw new functions.https.HttpsError(
      "internal",
      "AI 서비스 오류가 발생했습니다."
    );
  }
});

// 테스트용 간단한 함수
export const testClaudeConnection = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "로그인이 필요합니다."
      );
    }

    try {
      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
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
        throw new functions.https.HttpsError(
          "internal",
          "AI 응답 형식이 올바르지 않습니다."
        );
      }

      return {
        success: true,
        response: firstContent.text,
      };
    } catch (error) {
      console.error("Claude 연결 테스트 실패:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Claude API 연결에 실패했습니다."
      );
    }
  }
);

// Firebase Functions에 추가
export const refinePlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "로그인이 필요합니다."
    );
  }

  const { originalPlan, feedback, adjustments } = data;

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
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.3,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: refinementPrompt }],
    });

    const firstContent = message.content[0];
    if (!firstContent || !("text" in firstContent)) {
      throw new functions.https.HttpsError(
        "internal",
        "AI 응답 형식이 올바르지 않습니다."
      );
    }
    const responseText = (firstContent as any).text;
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) ||
      responseText.match(/\{[\s\S]*\}/);
    const refinedPlan = JSON.parse(
      jsonMatch ? jsonMatch[1] || jsonMatch[0] : responseText
    );

    return {
      success: true,
      refinedPlan,
      improvements: extractImprovements(responseText),
    };
  } catch (error) {
    console.error("계획 개선 오류:", error);
    throw new functions.https.HttpsError(
      "internal",
      "계획 개선 중 오류가 발생했습니다."
    );
  }
});

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
