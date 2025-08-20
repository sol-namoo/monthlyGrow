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
  startAfter,
  limit,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { UnifiedArchive } from "../types";

// 통합 아카이브 조회 (페이징 포함)
export const fetchUnifiedArchivesWithPaging = async (
  userId: string,
  pageSize: number = 20,
  lastDoc?: any,
  filter?: "all" | "monthly" | "project" | "retrospective" | "note"
): Promise<{ archives: UnifiedArchive[]; lastDoc: any; hasMore: boolean }> => {
  try {
    let archivesQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId)
    );

    // 필터 적용
    if (filter === "monthly") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_retrospective", "monthly_note"])
      );
    } else if (filter === "project") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["project_retrospective", "project_note"])
      );
    } else if (filter === "retrospective") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_retrospective", "project_retrospective"])
      );
    } else if (filter === "note") {
      archivesQuery = query(
        archivesQuery,
        where("type", "in", ["monthly_note", "project_note"])
      );
    }

    // 정렬 및 페이징 (생성일 기준)
    archivesQuery = query(
      archivesQuery,
      orderBy("createdAt", "desc"),
      limit(pageSize)
    );

    if (lastDoc) {
      archivesQuery = query(
        archivesQuery,
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(archivesQuery);

    const archives = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        type: data.type,
        parentId: data.parentId,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userRating: data.userRating,
        bookmarked: data.bookmarked,
        bestMoment: data.bestMoment,
        routineAdherence: data.routineAdherence,
        unexpectedObstacles: data.unexpectedObstacles,
        nextMonthlyApplication: data.nextMonthlyApplication,
        goalAchieved: data.goalAchieved,
        memorableTask: data.memorableTask,
        stuckPoints: data.stuckPoints,
        newLearnings: data.newLearnings,
        nextProjectImprovements: data.nextProjectImprovements,
      } as UnifiedArchive;
    });

    const lastVisible = snapshot.docs[snapshot.docs.length - 1];
    const hasMore = snapshot.docs.length === pageSize;

    return {
      archives,
      lastDoc: lastVisible,
      hasMore,
    };
  } catch (error) {
    return {
      archives: [],
      lastDoc: null,
      hasMore: false,
    };
  }
};

// 통합 아카이브 수 조회
export const fetchUnifiedArchiveCountByUserId = async (
  userId: string,
  filter?: "all" | "monthly" | "project" | "retrospective" | "note"
): Promise<number> => {
  try {
    let countQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId)
    );

    // 필터 적용
    if (filter === "monthly") {
      countQuery = query(
        countQuery,
        where("type", "in", ["monthly_retrospective", "monthly_note"])
      );
    } else if (filter === "project") {
      countQuery = query(
        countQuery,
        where("type", "in", ["project_retrospective", "project_note"])
      );
    } else if (filter === "retrospective") {
      countQuery = query(
        countQuery,
        where("type", "in", ["monthly_retrospective", "project_retrospective"])
      );
    } else if (filter === "note") {
      countQuery = query(
        countQuery,
        where("type", "in", ["monthly_note", "project_note"])
      );
    }

    const snapshot = await getDocs(countQuery);
    return snapshot.size;
  } catch (error) {
    return 0;
  }
};

// 통합 아카이브 생성
export const createUnifiedArchive = async (
  archiveData: Omit<UnifiedArchive, "id" | "createdAt" | "updatedAt">
): Promise<UnifiedArchive> => {
  try {
    const newArchive = {
      ...archiveData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "unified_archives"), newArchive);

    return {
      id: docRef.id,
      ...newArchive,
    } as UnifiedArchive;
  } catch (error) {
    console.error("통합 아카이브 생성 실패:", error);
    console.error("저장하려던 데이터:", archiveData);
    throw new Error(
      `통합 아카이브 생성에 실패했습니다: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

// 통합 아카이브 업데이트
export const updateUnifiedArchive = async (
  archiveId: string,
  updateData: Partial<Omit<UnifiedArchive, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = {
      ...updateData,
      updatedAt: new Date(),
    };

    await updateDoc(doc(db, "unified_archives", archiveId), filteredData);
  } catch (error) {
    throw new Error("통합 아카이브 업데이트에 실패했습니다.");
  }
};

// 통합 아카이브 삭제
export const deleteUnifiedArchive = async (
  archiveId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, "unified_archives", archiveId));
  } catch (error) {
    throw new Error("통합 아카이브 삭제에 실패했습니다.");
  }
};

// 통합 아카이브 ID로 조회
export const fetchUnifiedArchiveById = async (
  archiveId: string
): Promise<UnifiedArchive | null> => {
  try {
    const docRef = doc(db, "unified_archives", archiveId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        userId: data.userId,
        type: data.type,
        parentId: data.parentId,
        title: data.title,
        content: data.content,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        userRating: data.userRating,
        bookmarked: data.bookmarked,
        bestMoment: data.bestMoment,
        routineAdherence: data.routineAdherence,
        unexpectedObstacles: data.unexpectedObstacles,
        nextMonthlyApplication: data.nextMonthlyApplication,
        keyResultsReview: data.keyResultsReview,
        completedKeyResults: data.completedKeyResults,
        failedKeyResults: data.failedKeyResults,
        goalAchieved: data.goalAchieved,
        memorableTask: data.memorableTask,
        stuckPoints: data.stuckPoints,
        newLearnings: data.newLearnings,
        nextProjectImprovements: data.nextProjectImprovements,
      } as UnifiedArchive;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

// 먼슬리/프로젝트 상세 페이지용 단일 아카이브 조회
export const fetchSingleArchive = async (
  userId: string,
  parentId: string,
  type:
    | "monthly_retrospective"
    | "monthly_note"
    | "project_retrospective"
    | "project_note"
): Promise<UnifiedArchive | null> => {
  try {
    const archivesQuery = query(
      collection(db, "unified_archives"),
      where("userId", "==", userId),
      where("parentId", "==", parentId),
      where("type", "==", type),
      limit(1)
    );

    const snapshot = await getDocs(archivesQuery);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      userId: data.userId,
      type: data.type,
      parentId: data.parentId,
      title: data.title,
      content: data.content,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      userRating: data.userRating,
      bookmarked: data.bookmarked,
      bestMoment: data.bestMoment,
      routineAdherence: data.routineAdherence,
      unexpectedObstacles: data.unexpectedObstacles,
      nextMonthlyApplication: data.nextMonthlyApplication,
      keyResultsReview: data.keyResultsReview,
      completedKeyResults: data.completedKeyResults,
      failedKeyResults: data.failedKeyResults,
      goalAchieved: data.goalAchieved,
      memorableTask: data.memorableTask,
      stuckPoints: data.stuckPoints,
      newLearnings: data.newLearnings,
      nextProjectImprovements: data.nextProjectImprovements,
    } as UnifiedArchive;
  } catch (error) {
    throw new Error("단일 아카이브 조회에 실패했습니다.");
  }
};
