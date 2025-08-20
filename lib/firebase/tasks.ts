import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Task } from "../types";
import {
  fetchAllMonthliesByUserId,
  fetchProjectsByMonthlyId,
} from "./monthlies";
import { getMonthlyStatus } from "../utils";

// Tasks
export const fetchAllTasksByUserId = async (
  userId: string
): Promise<Task[]> => {
  // 사용자의 모든 프로젝트 조회
  const projectsQuery = query(
    collection(db, "projects"),
    where("userId", "==", userId)
  );
  const projectsSnapshot = await getDocs(projectsQuery);

  const allTasks: Task[] = [];

  // 각 프로젝트의 서브컬렉션에서 태스크 조회
  for (const projectDoc of projectsSnapshot.docs) {
    const projectId = projectDoc.id;

    try {
      const tasksQuery = query(
        collection(db, "projects", projectId, "tasks"),
        orderBy("date", "desc")
      );
      const tasksSnapshot = await getDocs(tasksQuery);

      const projectTasks = tasksSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          projectId: projectId,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
        } as Task;
      });

      allTasks.push(...projectTasks);
    } catch (error) {
      console.error(`프로젝트 ${projectId}의 태스크 조회 실패:`, error);
      continue;
    }
  }

  // 완료 여부를 최우선 기준으로 정렬 (완료되지 않은 것이 먼저)
  return allTasks.sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    // 완료 여부가 같으면 날짜순 정렬
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export const fetchAllTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  const q = query(
    collection(db, "projects", projectId, "tasks"),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      projectId: projectId,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Task;
  });

  // 완료 여부를 최우선 기준으로 정렬 (완료되지 않은 것이 먼저)
  return tasks.sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    // 완료 여부가 같으면 날짜순 정렬
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export const getTaskCountsByProjectId = async (
  projectId: string
): Promise<{ total: number; completed: number; pending: number }> => {
  const q = query(collection(db, "projects", projectId, "tasks"));
  const querySnapshot = await getDocs(q);

  const tasks = querySnapshot.docs.map((doc) => doc.data());
  const total = tasks.length;
  const completed = tasks.filter((task) => task.done).length;
  const pending = total - completed;

  return { total, completed, pending };
};

export const getTaskCountsForMultipleProjects = async (
  projectIds: string[]
): Promise<
  Record<string, { total: number; completed: number; pending: number }>
> => {
  if (projectIds.length === 0) {
    return {};
  }

  const results: Record<
    string,
    { total: number; completed: number; pending: number }
  > = {};

  // 각 프로젝트의 서브컬렉션에서 태스크 조회
  for (const projectId of projectIds) {
    try {
      const q = query(collection(db, "projects", projectId, "tasks"));
      const querySnapshot = await getDocs(q);

      const tasks = querySnapshot.docs.map((doc) => doc.data());
      const total = tasks.length;
      const completed = tasks.filter((task) => task.done).length;
      const pending = total - completed;

      results[projectId] = { total, completed, pending };
    } catch (error) {
      console.error(`프로젝트 ${projectId}의 태스크 카운트 조회 실패:`, error);
      results[projectId] = { total: 0, completed: 0, pending: 0 };
    }
  }

  return results;
};

export const getTaskTimeStatsByProjectId = async (
  projectId: string
): Promise<{
  completedTime: number;
  remainingTime: number;
  totalTasks: number;
  completedTasks: number;
}> => {
  const q = query(collection(db, "projects", projectId, "tasks"));
  const querySnapshot = await getDocs(q);

  const tasks = querySnapshot.docs.map((doc) => doc.data());
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;

  // 완료된 태스크들의 duration 합계 계산 (완료된 시간)
  const completedTime = tasks
    .filter((task) => task.done && task.duration)
    .reduce((sum, task) => sum + (task.duration || 0), 0);

  // 남은 태스크들의 duration 합계 계산 (남은 시간)
  const remainingTime = tasks
    .filter((task) => !task.done && task.duration)
    .reduce((sum, task) => sum + (task.duration || 0), 0);

  return {
    completedTime,
    remainingTime,
    totalTasks,
    completedTasks,
  };
};

export const fetchTaskById = async (taskId: string): Promise<Task> => {
  const docRef = doc(db, "tasks", taskId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Task;
  } else {
    throw new Error("Task not found");
  }
};

export const createTask = async (
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> => {
  try {
    if (!taskData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!taskData.title?.trim()) {
      throw new Error("태스크 제목을 입력해주세요.");
    }
    if (!taskData.projectId) {
      throw new Error("프로젝트 ID가 필요합니다.");
    }

    const baseData = createBaseData(taskData.userId);
    const newTask = {
      ...taskData,
      ...baseData,
    };

    // 서브컬렉션에 저장
    const subcollectionRef = collection(
      db,
      "projects",
      taskData.projectId,
      "tasks"
    );
    const docRef = await addDoc(subcollectionRef, newTask);
    console.log(
      `✅ 프로젝트 서브컬렉션에 태스크 생성 완료 - Project: ${taskData.projectId}, Task: ${docRef.id}`
    );

    return {
      id: docRef.id,
      userId: taskData.userId,
      projectId: taskData.projectId,
      title: taskData.title,
      date: taskData.date,
      duration: taskData.duration,
      done: taskData.done,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;
  } catch (error) {
    console.error("❌ 태스크 생성 실패:", error);
    if (error instanceof Error) {
      throw new Error(`태스크 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("태스크 생성에 실패했습니다.");
  }
};

export const updateTask = async (
  taskId: string,
  projectId: string,
  updateData: Partial<Omit<Task, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(
      doc(db, "projects", projectId, "tasks", taskId),
      filteredData
    );
    console.log(
      `✅ 프로젝트 서브컬렉션 태스크 업데이트 완료 - Project: ${projectId}, Task: ${taskId}`
    );
  } catch (error) {
    console.error(
      `❌ 프로젝트 서브컬렉션 태스크 업데이트 실패 - Project: ${projectId}, Task: ${taskId}`,
      error
    );
    throw new Error("태스크 업데이트에 실패했습니다.");
  }
};

export const addTaskToProject = async (
  projectId: string,
  taskData: Omit<Task, "id" | "createdAt" | "updatedAt">
): Promise<Task> => {
  try {
    if (!taskData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!taskData.title?.trim()) {
      throw new Error("태스크 제목을 입력해주세요.");
    }

    const baseData = createBaseData(taskData.userId);
    const newTask = {
      ...taskData,
      projectId,
      ...baseData,
    };

    // 서브컬렉션에 저장
    const subcollectionRef = collection(db, "projects", projectId, "tasks");
    const docRef = await addDoc(subcollectionRef, newTask);

    console.log(
      `✅ 프로젝트 서브컬렉션에 태스크 추가 완료 - Project: ${projectId}, Task: ${docRef.id}`
    );

    return {
      id: docRef.id,
      userId: taskData.userId,
      projectId,
      title: taskData.title,
      date: taskData.date,
      duration: taskData.duration,
      done: taskData.done,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Task;
  } catch (error) {
    console.error("❌ 프로젝트에 태스크 추가 실패:", error);
    if (error instanceof Error) {
      throw new Error(`태스크 추가에 실패했습니다: ${error.message}`);
    }
    throw new Error("태스크 추가에 실패했습니다.");
  }
};

export const updateTaskInProject = async (
  projectId: string,
  taskId: string,
  updateData: Partial<Omit<Task, "id" | "userId" | "projectId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    // 서브컬렉션에서 업데이트
    await updateDoc(
      doc(db, "projects", projectId, "tasks", taskId),
      filteredData
    );
    console.log(
      `✅ 프로젝트 서브컬렉션 태스크 업데이트 완료 - Project: ${projectId}, Task: ${taskId}`
    );
  } catch (error) {
    console.error(
      `❌ 프로젝트 서브컬렉션 태스크 업데이트 실패 - Project: ${projectId}, Task: ${taskId}`,
      error
    );
    throw new Error("태스크 업데이트에 실패했습니다.");
  }
};

export const deleteTaskFromProject = async (
  projectId: string,
  taskId: string
): Promise<void> => {
  try {
    // 서브컬렉션에서 삭제
    await deleteDoc(doc(db, "projects", projectId, "tasks", taskId));
    console.log(
      `✅ 서브컬렉션 태스크 삭제 완료 - Project: ${projectId}, Task: ${taskId}`
    );
  } catch (error) {
    console.error(
      `❌ 서브컬렉션 태스크 삭제 실패 - Project: ${projectId}, Task: ${taskId}`,
      error
    );
    throw new Error("태스크 삭제에 실패했습니다.");
  }
};

// 이 함수는 더 이상 사용되지 않습니다. 서브컬렉션 구조로 변경되었으므로 toggleTaskCompletionInSubcollection을 사용하세요.
// export const toggleTaskCompletion = async (taskId: string): Promise<void> => {
//   try {
//     const taskRef = doc(db, "tasks", taskId);
//     const taskSnap = await getDoc(taskRef);

//     if (!taskSnap.exists()) {
//       throw new Error("Task not found");
//     }

//     const taskData = taskSnap.data();
//     const newDone = !taskData.done;

//     const updateData: any = {
//       done: newDone,
//       updatedAt: updateTimestamp(),
//     };

//     // 완료 상태가 true로 변경되면 completedAt 설정, false로 변경되면 제거
//     if (newDone) {
//       updateData.completedAt = updateTimestamp();
//     } else {
//       updateData.completedAt = null;
//     }

//     await updateDoc(taskRef, updateData);

//     console.log(
//       `✅ Task completion toggled - ID: ${taskId}, completed: ${newDone}`
//     );
//   } catch (error) {
//     console.error(`❌ Task completion toggle failed - ID: ${taskId}`, error);
//     throw new Error("Task completion toggle failed");
//   }
// };

export const toggleTaskCompletionInSubcollection = async (
  projectId: string,
  taskId: string
): Promise<void> => {
  try {
    const taskRef = doc(db, "projects", projectId, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      throw new Error("Task not found");
    }

    const taskData = taskSnap.data();
    const newDone = !taskData.done;

    const updateData: any = {
      done: newDone,
      updatedAt: updateTimestamp(),
    };

    // 완료 상태가 true로 변경되면 completedAt 설정, false로 변경되면 제거
    if (newDone) {
      updateData.completedAt = updateTimestamp();
    } else {
      updateData.completedAt = null;
    }

    await updateDoc(taskRef, updateData);

    console.log(
      `✅ Task completion toggled in subcollection - Project: ${projectId}, Task: ${taskId}, completed: ${newDone}`
    );
  } catch (error) {
    console.error(
      `❌ Task completion toggle in subcollection failed - Project: ${projectId}, Task: ${taskId}`,
      error
    );
    throw new Error("Task completion toggle failed");
  }
};

export const getTodayTasks = async (
  userId: string,
  currentMonthlyId?: string
): Promise<Task[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // collectionGroup 쿼리로 모든 태스크 서브컬렉션에서 오늘 날짜의 태스크를 한 번에 조회
    const tasksQuery = query(
      collectionGroup(db, "tasks"),
      where("userId", "==", userId),
      where("date", ">=", Timestamp.fromDate(today)),
      where("date", "<", Timestamp.fromDate(tomorrow))
    );

    const tasksSnapshot = await getDocs(tasksQuery);
    const todayTasks: Task[] = [];

    // 각 태스크 문서에서 프로젝트 ID 추출 (경로에서)
    tasksSnapshot.docs.forEach((doc) => {
      const data = doc.data() as any;
      // 경로에서 프로젝트 ID 추출: projects/{projectId}/tasks/{taskId}
      const pathParts = doc.ref.path.split("/");
      const projectId = pathParts[1]; // projects 다음 부분이 projectId

      todayTasks.push({
        id: doc.id,
        projectId: projectId,
        ...data,
        date: data.date.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Task);
    });

    return sortTasksByDateAndTitle(todayTasks);
  } catch (error) {
    console.error("오늘 task 조회 실패:", error);
    return [];
  }
};

// 태스크를 완료 여부, 날짜, 제목으로 정렬하는 유틸리티 함수
const sortTasksByDateAndTitle = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    // 1. 완료 여부를 최우선 기준으로 정렬 (완료되지 않은 것이 먼저)
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    // 2. 완료 여부가 같으면 날짜로 정렬
    const dateComparison =
      new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // 3. 날짜가 같으면 제목으로 정렬
    return a.title.localeCompare(b.title);
  });
};

// 먼슬리 기간 동안 완료된 모든 태스크를 조회하는 함수 (서브컬렉션 전용)
export const getCompletedTasksByMonthlyPeriod = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<
  {
    taskId: string;
    projectId: string;
    projectTitle: string;
    areaName: string;
    taskTitle: string;
    completedAt: Date;
    date: Date;
  }[]
> => {
  try {
    // 미래 monthly인 경우 빈 결과 반환
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    if (startDate > currentDate) {
      return [];
    }

    // 먼슬리 기간 설정
    const startOfMonth = new Date(startDate);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(endDate);
    endOfMonth.setHours(23, 59, 59, 999);

    // 1. 사용자의 모든 프로젝트 ID 목록 가져오기
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    const projectIds = projectsSnapshot.docs.map((doc) => doc.id);

    if (projectIds.length === 0) {
      return [];
    }

    // 2. 각 프로젝트의 서브컬렉션에서 완료된 태스크들을 병렬로 조회 (단순화된 쿼리)
    const tasksPromises = projectIds.map(async (projectId) => {
      try {
        // 단순히 완료된 태스크만 조회 (날짜 필터링은 클라이언트에서)
        const tasksQuery = query(
          collection(db, "projects", projectId, "tasks"),
          where("done", "==", true)
        );
        const tasksSnapshot = await getDocs(tasksQuery);

        const projectTasks = tasksSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            projectId,
            ...data,
            date: data.date.toDate(),
            completedAt: data.completedAt?.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
          } as Task;
        });

        return projectTasks;
      } catch (error) {
        console.error(
          `프로젝트 ${projectId}의 완료된 태스크 조회 실패:`,
          error
        );
        return [];
      }
    });

    const allTasksResults = await Promise.all(tasksPromises);
    const allCompletedTasks = allTasksResults.flat();

    if (allCompletedTasks.length === 0) {
      return [];
    }

    // 3. 클라이언트에서 날짜 범위 필터링
    const monthlyCompletedTasks = allCompletedTasks.filter((task) => {
      const completedAt = task.completedAt || task.date;
      const completedDate =
        completedAt instanceof Date ? completedAt : new Date(completedAt);
      return completedDate >= startOfMonth && completedDate <= endOfMonth;
    });

    if (monthlyCompletedTasks.length === 0) {
      return [];
    }

    // 4. 프로젝트 정보를 배치로 가져와서 성능 최적화
    const uniqueProjectIds = [
      ...new Set(monthlyCompletedTasks.map((task) => task.projectId)),
    ];
    const projectDocs = await Promise.all(
      uniqueProjectIds.map((projectId) =>
        getDoc(doc(db, "projects", projectId))
      )
    );

    const projectDataMap = new Map();
    projectDocs.forEach((doc, index) => {
      if (doc.exists()) {
        projectDataMap.set(uniqueProjectIds[index], doc.data());
      }
    });

    // 5. Area 정보를 배치로 가져와서 성능 최적화
    const areaIds = [
      ...new Set(
        Array.from(projectDataMap.values())
          .map((project) => project.areaId)
          .filter(Boolean)
      ),
    ];

    const areaDocs = await Promise.all(
      areaIds.map((areaId) => getDoc(doc(db, "areas", areaId)))
    );

    const areaDataMap = new Map();
    areaDocs.forEach((doc, index) => {
      if (doc.exists()) {
        areaDataMap.set(areaIds[index], doc.data().name);
      }
    });

    // 6. 결과 구성
    const result = monthlyCompletedTasks
      .map((task) => {
        const projectData = projectDataMap.get(task.projectId);
        if (!projectData) {
          return null;
        }

        const areaName = projectData.areaId
          ? areaDataMap.get(projectData.areaId) || "기타"
          : "기타";

        return {
          taskId: task.id,
          projectId: task.projectId,
          projectTitle: projectData.title || "제목 없음",
          areaName,
          taskTitle: task.title,
          completedAt: task.completedAt || task.date,
          date: task.date,
        };
      })
      .filter((item) => item !== null) as {
      taskId: string;
      projectId: string;
      projectTitle: string;
      areaName: string;
      taskTitle: string;
      completedAt: Date;
      date: Date;
    }[];

    return result;
  } catch (error) {
    console.error("먼슬리 기간 완료 태스크 조회 실패:", error);
    return [];
  }
};
