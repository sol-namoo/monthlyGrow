import {
  collection,
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
  const q = query(
    collection(db, "tasks"),
    where("userId", "==", userId),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Task;
  });
};

export const fetchAllTasksByProjectId = async (
  projectId: string
): Promise<Task[]> => {
  const q = query(
    collection(db, "tasks"),
    where("projectId", "==", projectId),
    orderBy("date", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Task;
  });
};

export const getTaskCountsByProjectId = async (
  projectId: string
): Promise<{ total: number; completed: number; pending: number }> => {
  const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
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

  // Firestore의 'in' 쿼리는 최대 10개만 지원하므로 배치로 처리
  const batchSize = 10;
  for (let i = 0; i < projectIds.length; i += batchSize) {
    const batch = projectIds.slice(i, i + batchSize);

    const q = query(collection(db, "tasks"), where("projectId", "in", batch));
    const querySnapshot = await getDocs(q);

    // 각 프로젝트별로 카운트 계산
    const tasksByProject: Record<string, any[]> = {};
    querySnapshot.docs.forEach((doc) => {
      const taskData = doc.data();
      const projectId = taskData.projectId;
      if (!tasksByProject[projectId]) {
        tasksByProject[projectId] = [];
      }
      tasksByProject[projectId].push(taskData);
    });

    // 각 프로젝트의 통계 계산
    batch.forEach((projectId) => {
      const tasks = tasksByProject[projectId] || [];
      const total = tasks.length;
      const completed = tasks.filter((task) => task.done).length;
      const pending = total - completed;

      results[projectId] = { total, completed, pending };
    });
  }

  return results;
};

export const getTaskTimeStatsByProjectId = async (
  projectId: string
): Promise<{
  totalFocusTime: number;
  averageFocusTime: number;
  totalTasks: number;
  completedTasks: number;
}> => {
  const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
  const querySnapshot = await getDocs(q);

  const tasks = querySnapshot.docs.map((doc) => doc.data());
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.done).length;

  // focusTime이 있는 태스크들만 필터링
  const tasksWithFocusTime = tasks.filter(
    (task) => task.focusTime && task.focusTime > 0
  );
  const totalFocusTime = tasksWithFocusTime.reduce(
    (sum, task) => sum + (task.focusTime || 0),
    0
  );
  const averageFocusTime =
    tasksWithFocusTime.length > 0
      ? totalFocusTime / tasksWithFocusTime.length
      : 0;

  return {
    totalFocusTime,
    averageFocusTime,
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

    const baseData = createBaseData(taskData.userId);
    const newTask = {
      ...taskData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    console.log(`✅ 태스크 생성 완료 - ID: ${docRef.id}`);

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
  updateData: Partial<Omit<Task, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "tasks", taskId), filteredData);
    console.log(`✅ 태스크 업데이트 완료 - ID: ${taskId}`);
  } catch (error) {
    console.error(`❌ 태스크 업데이트 실패 - ID: ${taskId}`, error);
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

    const docRef = await addDoc(collection(db, "tasks"), newTask);
    console.log(
      `✅ 프로젝트에 태스크 추가 완료 - Project: ${projectId}, Task: ${docRef.id}`
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

    await updateDoc(doc(db, "tasks", taskId), filteredData);
    console.log(
      `✅ 프로젝트 태스크 업데이트 완료 - Project: ${projectId}, Task: ${taskId}`
    );
  } catch (error) {
    console.error(
      `❌ 프로젝트 태스크 업데이트 실패 - Project: ${projectId}, Task: ${taskId}`,
      error
    );
    throw new Error("태스크 업데이트에 실패했습니다.");
  }
};

export const deleteTaskFromProject = async (taskId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    console.log(`✅ 태스크 삭제 완료 - ID: ${taskId}`);
  } catch (error) {
    console.error(`❌ 태스크 삭제 실패 - ID: ${taskId}`, error);
    throw new Error("태스크 삭제에 실패했습니다.");
  }
};

export const toggleTaskCompletion = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, "tasks", taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      throw new Error("Task not found");
    }

    const taskData = taskSnap.data();
    const newDone = !taskData.done;

    await updateDoc(taskRef, {
      done: newDone,
      updatedAt: updateTimestamp(),
    });

    console.log(
      `✅ Task completion toggled - ID: ${taskId}, completed: ${newDone}`
    );
  } catch (error) {
    console.error(`❌ Task completion toggle failed - ID: ${taskId}`, error);
    throw new Error("Task completion toggle failed");
  }
};

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

    await updateDoc(taskRef, {
      done: newDone,
      updatedAt: updateTimestamp(),
    });

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

    // Firestore에서 오늘 날짜의 태스크만 서버사이드에서 필터링
    // 이 쿼리를 실행하면 Firestore가 필요한 인덱스를 자동으로 제안함
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("date", ">=", Timestamp.fromDate(today)),
      where("date", "<", Timestamp.fromDate(tomorrow))
    );

    const querySnapshot = await getDocs(q);
    const todayTasks = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Task;
    });

    return sortTasksByDateAndTitle(todayTasks);
  } catch (error) {
    console.error("오늘 task 조회 실패:", error);
    return [];
  }
};

// 태스크를 날짜와 제목으로 정렬하는 유틸리티 함수
const sortTasksByDateAndTitle = (tasks: Task[]): Task[] => {
  return tasks.sort((a, b) => {
    // 먼저 날짜로 정렬
    const dateComparison =
      new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // 날짜가 같으면 제목으로 정렬
    return a.title.localeCompare(b.title);
  });
};

// 먼슬리 기간 동안 완료된 모든 태스크를 조회하는 함수 (느슨한 관계 지원)
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

    // 먼슬리 기간 동안의 모든 완료된 태스크를 조회
    const startOfMonth = new Date(startDate);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(endDate);
    endOfMonth.setHours(23, 59, 59, 999);

    // Firestore에서 완료된 태스크만 조회 (서버사이드 필터링)
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", userId),
      where("done", "==", true)
    );

    const querySnapshot = await getDocs(q);
    const allCompletedTasks = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        completedAt: data.completedAt?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Task;
    });

    // 먼슬리 기간 내의 태스크만 필터링 (completedAt 기준)
    const monthlyCompletedTasks = allCompletedTasks.filter((task) => {
      const completedAt = task.completedAt || task.date; // completedAt이 없으면 date 사용
      const completedDate =
        completedAt instanceof Date ? completedAt : new Date(completedAt);
      return completedDate >= startOfMonth && completedDate <= endOfMonth;
    });

    // 프로젝트 정보를 배치로 가져와서 성능 최적화
    const projectIds = [
      ...new Set(monthlyCompletedTasks.map((task) => task.projectId)),
    ];
    const projectDocs = await Promise.all(
      projectIds.map((projectId) => getDoc(doc(db, "projects", projectId)))
    );

    const projectDataMap = new Map();
    projectDocs.forEach((doc, index) => {
      if (doc.exists()) {
        projectDataMap.set(projectIds[index], doc.data());
      }
    });

    // Area 정보를 배치로 가져와서 성능 최적화
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

    // 결과 구성
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
          completedAt: task.completedAt || task.date, // 완료 시점 (completedAt이 있으면 사용, 없으면 date 사용)
          date: task.date,
        };
      })
      .filter(
        (
          item
        ): item is {
          taskId: string;
          projectId: string;
          projectTitle: string;
          areaName: string;
          taskTitle: string;
          completedAt: Date;
          date: Date;
        } => item !== null
      );

    return result;
  } catch (error) {
    console.error("먼슬리 기간 완료 태스크 조회 실패:", error);
    return [];
  }
};
