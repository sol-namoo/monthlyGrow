// utils/savePlanToFirestore.ts
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { GeneratedPlan } from "./types";

interface SavePlanOptions {
  plan: GeneratedPlan;
  userId?: string;
  customizations?: {
    startDate?: Date;
    adjustments?: Record<string, any>;
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
  const batch = writeBatch(db);
  const now = serverTimestamp();

  try {
    // 1. Areas 저장 (기존 Areas 재사용)
    const areaIdMap: Record<string, string> = {};

    for (const area of plan.areas) {
      if (area.existingId) {
        // 기존 Areas 재사용
        areaIdMap[area.name] = area.existingId;
        console.log(`기존 영역 재사용: ${area.name} (ID: ${area.existingId})`);
      } else {
        // 새로운 Areas 생성
        const areaRef = doc(collection(db, "areas"));
        areaIdMap[area.name] = areaRef.id;

        batch.set(areaRef, {
          ...area,
          userId,
          status: "active",
          createdAt: now,
          updatedAt: now,
        });
        console.log(`새 영역 생성: ${area.name} (ID: ${areaRef.id})`);
      }
    }

    // Area 매핑 검증 및 디버깅
    console.log("생성된 areaIdMap:", areaIdMap);
    console.log(
      "프로젝트들의 areaName:",
      plan.projects.map((p) => p.areaName)
    );

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
    const startDate = customizations.startDate || new Date();
    const projectRefs: string[] = [];

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
      batch.set(projectRef, {
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
      console.log(
        `프로젝트 "${project.title}"의 태스크 개수:`,
        project.tasks?.length || 0
      );

      if (project.tasks && project.tasks.length > 0) {
        console.log(
          `프로젝트 "${project.title}"에 ${project.tasks.length}개 태스크 저장 시작`
        );

        for (let i = 0; i < project.tasks.length; i++) {
          const task = project.tasks[i];
          const taskRef = doc(
            collection(db, "projects", projectRef.id, "tasks")
          );

          // 작업 날짜를 프로젝트 기간 내에 분산
          const taskDate = new Date(
            projectStartDate.getTime() +
              (i / project.tasks.length) *
                (projectEndDate.getTime() - projectStartDate.getTime())
          );

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

          console.log(
            `태스크 ${i + 1} 저장: "${taskData.title}" (ID: ${taskRef.id})`
          );
          batch.set(taskRef, taskData);
        }

        console.log(`프로젝트 "${project.title}" 태스크 저장 완료`);
      } else {
        // 태스크가 없는 경우 기본 태스크 생성
        console.log(`프로젝트 "${project.title}"에 기본 태스크 생성`);
        const taskRef = doc(collection(db, "projects", projectRef.id, "tasks"));
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

        console.log(
          `기본 태스크 저장: "${defaultTaskData.title}" (ID: ${taskRef.id})`
        );
        batch.set(taskRef, defaultTaskData);
      }

      // 5. Project Resources 저장
      for (const resource of project.resources || []) {
        const resourceRef = doc(collection(db, "resources"));

        batch.set(resourceRef, {
          id: resourceRef.id,
          userId,
          name: resource.name,
          description: resource.description,
          areaId: areaIdMap[project.areaName],
          area: project.areaName, // denormalized
          areaColor: plan.areas.find((a) => a.name === project.areaName)?.color,
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

    console.log("저장할 timeline:", safeTimeline);
    console.log("저장할 successMetrics:", safeSuccessMetrics);

    // originalPlan에서 undefined 값들을 제거
    const cleanOriginalPlan = JSON.parse(
      JSON.stringify(plan, (key, value) => {
        return value === undefined ? null : value;
      })
    );

    batch.set(planMetaRef, {
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

    // 배치 실행
    await batch.commit();

    return {
      success: true,
      projectIds: projectRefs,
      areaIds: Object.values(areaIdMap),
    };
  } catch (error) {
    console.error("계획 저장 실패:", error);
    throw new Error("계획을 저장하는 중 오류가 발생했습니다.");
  }
}
