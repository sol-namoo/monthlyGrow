// utils/savePlanToFirestore.ts
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  writeBatch,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { GeneratedPlan } from "./types";
import { validateGeneratedPlanForSave } from "./ai-plan";

interface SavePlanOptions {
  plan: GeneratedPlan;
  userId?: string;
  customizations?: {
    startDate?: Date;
    adjustments?: Record<string, any>;
    selectedMonthlyId?: string;
    monthlyStartDate?: Date;
  };
}

export async function savePlanToFirestore(options: SavePlanOptions) {
  const db = getFirestore();
  const auth = getAuth();
  const userId = options.userId || auth.currentUser?.uid;

  if (!userId) {
    throw new Error("사용자 인증이 필요합니다.");
  }

  const { plan, customizations = {} } = options;
  const validation = validateGeneratedPlanForSave(plan);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  return await runTransaction(db, async (transaction) => {
    const now = serverTimestamp();
    const areaIdMap: Record<string, string> = {};
    const areaColorMap: Record<string, string | undefined> = {};
    const projectRefs: string[] = [];

    try {
      const newAreasByKey = new Map(
        (plan.newAreas || []).map((area) => [area.key, area] as const)
      );

      // 1. 프로젝트가 실제로 참조하는 영역만 생성/연결
      for (const project of plan.projects) {
        if (project.areaAssignment.type === "existing") {
          const existingAreaId = project.areaAssignment.existingAreaId;
          if (!existingAreaId) {
            throw new Error(
              `프로젝트 "${project.title}"의 기존 영역 ID가 없습니다.`
            );
          }

          areaIdMap[project.areaName] = existingAreaId;
          continue;
        }

        const newAreaKey = project.areaAssignment.newAreaKey;
        if (!newAreaKey) {
          throw new Error(
            `프로젝트 "${project.title}"의 새 영역 키가 없습니다.`
          );
        }

        const newArea = newAreasByKey.get(newAreaKey);
        if (!newArea) {
          throw new Error(
            `프로젝트 "${project.title}"가 참조하는 새 영역 정의를 찾을 수 없습니다.`
          );
        }

        if (!areaIdMap[newAreaKey]) {
          const areaRef = doc(collection(db, "areas"));
          areaIdMap[newAreaKey] = areaRef.id;
          areaColorMap[newAreaKey] = newArea.color;

          transaction.set(areaRef, {
            name: newArea.name,
            description: newArea.description,
            icon: newArea.icon,
            color: newArea.color,
            userId,
            createdAt: now,
            updatedAt: now,
          });
        }

        areaIdMap[project.areaName] = areaIdMap[newAreaKey];
        areaColorMap[project.areaName] = newArea.color;
      }

      // 모든 프로젝트의 areaName이 areaIdMap에 있는지 확인
      for (const project of plan.projects) {
        if (!areaIdMap[project.areaName]) {
          console.error(
            `❌ 프로젝트 "${project.title}"의 areaName "${project.areaName}"이 areaIdMap에 없습니다!`
          );
          console.error("사용 가능한 areas:", Object.keys(areaIdMap));
          throw new Error(
            `프로젝트 "${project.title}"의 영역 "${project.areaName}"을 찾을 수 없습니다.`
          );
        }
      }

      // 2. Projects 및 Tasks 저장 (Monthly 생성 없음)
      // Monthly 기반 입력인 경우 Monthly 시작일과 오늘 중 더 늦은 날짜를 사용
      let startDate = customizations.startDate || new Date();

      // Monthly 기반 입력이고 Monthly 시작일이 과거인 경우 오늘부터 시작
      if (customizations.selectedMonthlyId && customizations.monthlyStartDate) {
        const monthlyStartDate = new Date(customizations.monthlyStartDate);
        const today = new Date();
        startDate = new Date(
          Math.max(monthlyStartDate.getTime(), today.getTime())
        );
      }

      for (const project of plan.projects) {
        const projectRef = doc(collection(db, "projects"));
        projectRefs.push(projectRef.id);

        // 프로젝트 시작일/종료일 계산
        const projectStartDate = new Date(startDate);
        const projectEndDate = new Date(
          projectStartDate.getTime() +
            project.durationWeeks * 7 * 24 * 60 * 60 * 1000
        );

        const projectAreaId = areaIdMap[project.areaName];
        transaction.set(projectRef, {
          id: projectRef.id,
          userId,
          title: project.title,
          description: project.description,
          category: project.category || "task_based", // 기본값 설정
          areaId: projectAreaId,
          area: project.areaName, // denormalized
          target: project.target,
          targetCount: project.targetCount || project.tasks.length || 1, // 기본값 1
          completedTasks: 0,
          startDate: projectStartDate,
          endDate: projectEndDate,
          connectedMonthlies: [], // Monthly 생성 없음
          difficulty: project.difficulty || "intermediate", // 기본값 설정
          createdAt: now,
          updatedAt: now,
          retrospective: null,
          notes: [],
        });

        // 4. Tasks 서브컬렉션 저장
        if (project.tasks && project.tasks.length > 0) {
          for (let i = 0; i < project.tasks.length; i++) {
            const task = project.tasks[i];
            const taskRef = doc(
              collection(db, "projects", projectRef.id, "tasks")
            );

            // 작업 날짜를 프로젝트 기간 내에 균등하게 분산
            const taskDate = new Date(
              projectStartDate.getTime() +
                (i / (project.tasks.length - 1)) *
                  (projectEndDate.getTime() - projectStartDate.getTime())
            );

            // 첫 번째 태스크는 시작일, 마지막 태스크는 종료일로 설정
            if (i === 0) {
              taskDate.setTime(projectStartDate.getTime());
            } else if (i === project.tasks.length - 1) {
              taskDate.setTime(projectEndDate.getTime());
            }

            const taskData = {
              id: taskRef.id,
              userId,
              projectId: projectRef.id,
              title: task.title || `Task ${i + 1}`,
              description: task.description || "",
              date: taskDate,
              duration: task.duration || 1.0,
              done: false,
              status: "active",
              requirements: task.requirements || [],
              resources: task.resources || [],
              prerequisites: task.prerequisites || [],
              createdAt: now,
              updatedAt: now,
            };

            transaction.set(taskRef, taskData);
          }
        } else {
          // 태스크가 없는 경우 기본 태스크 생성
          const taskRef = doc(
            collection(db, "projects", projectRef.id, "tasks")
          );
          const taskDate = new Date(projectStartDate.getTime());

          const defaultTaskData = {
            id: taskRef.id,
            userId,
            projectId: projectRef.id,
            title: "프로젝트 시작",
            description: `${project.title} 프로젝트를 시작합니다.`,
            date: taskDate,
            duration: 1.0,
            done: false,
            status: "active",
            requirements: [],
            resources: [],
            prerequisites: [],
            createdAt: now,
            updatedAt: now,
          };

          transaction.set(taskRef, defaultTaskData);
        }

        // 5. Project Resources 저장
        for (const resource of project.resources || []) {
          const resourceRef = doc(collection(db, "resources"));

          transaction.set(resourceRef, {
            id: resourceRef.id,
            userId,
            name: resource.name,
            description: resource.description,
            areaId: areaIdMap[project.areaName],
            area: project.areaName, // denormalized
            areaColor: areaColorMap[project.areaName],
            text: resource.description,
            link: resource.url,
            status: "active",
            type: resource.type,
            cost: resource.cost,
            priority: resource.priority,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      // 6. 계획 메타데이터 저장 (선택사항)
      const planMetaRef = doc(collection(db, "planMetadata"));

      // timeline과 successMetrics에 대한 안전한 기본값 설정
      const safeTimeline =
        plan.timeline && typeof plan.timeline === "object"
          ? plan.timeline
          : { totalWeeks: 4, weeklySchedule: [] };

      const safeSuccessMetrics = Array.isArray(plan.successMetrics)
        ? plan.successMetrics
        : [];

      // originalPlan에서 undefined 값들을 제거
      const cleanOriginalPlan = JSON.parse(
        JSON.stringify(plan, (key, value) => {
          return value === undefined ? null : value;
        })
      );

      transaction.set(planMetaRef, {
        id: planMetaRef.id,
        userId,
        projectIds: projectRefs,
        originalPlan: cleanOriginalPlan,
        timeline: safeTimeline,
        successMetrics: safeSuccessMetrics,
        milestones: plan.projects.flatMap((p) => p.milestones || []),
        generatedAt: now,
        status: "active",
      });

      // 트랜잭션 완료 - 모든 데이터가 원자적으로 저장됨

      return {
        success: true,
        projectIds: projectRefs,
        areaIds: Object.values(areaIdMap),
      };
    } catch (error) {
      console.error("❌ AI 계획 저장 트랜잭션 실패:", error);
      throw new Error("계획을 저장하는 중 오류가 발생했습니다.");
    }
  });
}
