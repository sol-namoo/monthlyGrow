import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { db } from "./config";
import { Task, Project } from "../types";

/**
 * 기존 tasks 컬렉션의 데이터를 서브컬렉션으로 마이그레이션
 */
export const migrateTasksToSubcollections = async (userId: string): Promise<{
  success: boolean;
  migratedCount: number;
  errors: string[];
}> => {
  const batch = writeBatch(db);
  const errors: string[] = [];
  let migratedCount = 0;

  try {
    console.log("🚀 태스크 마이그레이션 시작...");

    // 1. 사용자의 모든 태스크 조회
    const tasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    const tasksSnapshot = await getDocs(tasksQuery);

    if (tasksSnapshot.empty) {
      console.log("✅ 마이그레이션할 태스크가 없습니다.");
      return { success: true, migratedCount: 0, errors: [] };
    }

    console.log(`📊 총 ${tasksSnapshot.size}개의 태스크 발견`);

    // 2. 각 태스크를 해당 프로젝트의 서브컬렉션으로 이동
    for (const taskDoc of tasksSnapshot.docs) {
      const taskData = taskDoc.data() as Task;
      
      try {
        // projectId가 없는 태스크는 건너뛰기 (오류 데이터)
        if (!taskData.projectId) {
          console.warn(`⚠️ projectId가 없는 태스크 발견: ${taskDoc.id}`);
          errors.push(`projectId가 없는 태스크: ${taskDoc.id}`);
          continue;
        }

        // 프로젝트 존재 여부 확인
        const projectRef = doc(db, "projects", taskData.projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
          console.warn(`⚠️ 존재하지 않는 프로젝트의 태스크: ${taskDoc.id} -> ${taskData.projectId}`);
          errors.push(`존재하지 않는 프로젝트의 태스크: ${taskDoc.id} -> ${taskData.projectId}`);
          continue;
        }

        // 서브컬렉션에 태스크 추가
        const subcollectionRef = collection(db, "projects", taskData.projectId, "tasks");
        const newTaskRef = doc(subcollectionRef);
        
        batch.set(newTaskRef, {
          ...taskData,
          id: newTaskRef.id, // 새로운 ID 사용
        });

        // 기존 태스크 삭제
        batch.delete(taskDoc.ref);

        migratedCount++;
        console.log(`✅ 태스크 마이그레이션: ${taskDoc.id} -> ${taskData.projectId}/${newTaskRef.id}`);

      } catch (error) {
        const errorMsg = `태스크 ${taskDoc.id} 마이그레이션 실패: ${error}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // 3. 배치 커밋
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`✅ 마이그레이션 완료: ${migratedCount}개 태스크 이동`);
    }

    return {
      success: errors.length === 0,
      migratedCount,
      errors,
    };

  } catch (error) {
    console.error("❌ 마이그레이션 중 오류 발생:", error);
    return {
      success: false,
      migratedCount,
      errors: [`마이그레이션 실패: ${error}`],
    };
  }
};

/**
 * 마이그레이션 상태 확인
 */
export const checkMigrationStatus = async (userId: string): Promise<{
  mainCollectionCount: number;
  subcollectionCount: number;
  needsMigration: boolean;
}> => {
  try {
    // 메인 컬렉션 태스크 수 확인
    const mainTasksQuery = query(
      collection(db, "tasks"),
      where("userId", "==", userId)
    );
    const mainTasksSnapshot = await getDocs(mainTasksQuery);
    const mainCollectionCount = mainTasksSnapshot.size;

    // 서브컬렉션 태스크 수 확인
    const projectsQuery = query(
      collection(db, "projects"),
      where("userId", "==", userId)
    );
    const projectsSnapshot = await getDocs(projectsQuery);
    
    let subcollectionCount = 0;
    for (const projectDoc of projectsSnapshot.docs) {
      const tasksQuery = query(collection(db, "projects", projectDoc.id, "tasks"));
      const tasksSnapshot = await getDocs(tasksQuery);
      subcollectionCount += tasksSnapshot.size;
    }

    const needsMigration = mainCollectionCount > 0;

    return {
      mainCollectionCount,
      subcollectionCount,
      needsMigration,
    };

  } catch (error) {
    console.error("마이그레이션 상태 확인 실패:", error);
    throw error;
  }
}; 