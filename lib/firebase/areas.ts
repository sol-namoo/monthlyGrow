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
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Area } from "../types";

// Areas
export const fetchAllAreasByUserId = async (
  userId: string
): Promise<Area[]> => {
  try {
    const q = query(collection(db, "areas"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Area;
    });
  } catch (error) {
    console.error("영역 조회 실패:", error);
    throw new Error("areaLoadFailed");
  }
};

export const fetchAreaById = async (areaId: string): Promise<Area> => {
  try {
    const docRef = doc(db, "areas", areaId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Area;
    } else {
      throw new Error("Area not found");
    }
  } catch (error) {
    console.error("영역 조회 실패:", error);
    throw new Error("areaLoadFailed");
  }
};

export const createArea = async (
  areaData: Omit<Area, "id" | "createdAt" | "updatedAt">
): Promise<Area> => {
  try {
    if (!areaData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!areaData.name?.trim()) {
      throw new Error("영역 이름을 입력해주세요.");
    }

    const baseData = createBaseData(areaData.userId);
    const newArea = {
      ...areaData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "areas"), newArea);

    return {
      id: docRef.id,
      userId: areaData.userId,
      name: areaData.name,
      description: areaData.description || "",
      color: areaData.color || "#3B82F6",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Area;
  } catch (error) {
    console.error("영역 생성 실패:", error);
    if (error instanceof Error) {
      throw new Error(`areaCreateFailed: ${error.message}`);
    }
    throw new Error("areaCreateFailed");
  }
};

export const getOrCreateUncategorizedArea = async (
  userId: string
): Promise<Area> => {
  try {
    // 기존 미분류 영역이 있는지 확인
    const q = query(
      collection(db, "areas"),
      where("userId", "==", userId),
      where("name", "==", "미분류")
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Area;
    }

    // 미분류 영역이 없으면 생성
    const uncategorizedArea = await createArea({
      userId,
      name: "미분류",
      description: "분류되지 않은 항목들을 위한 기본 영역입니다.",
      color: "#6B7280",
    });

    return uncategorizedArea;
  } catch (error) {
    console.error("미분류 영역 조회/생성 실패:", error);
    throw new Error("uncategorizedAreaLoadFailed");
  }
};

export const updateArea = async (
  areaId: string,
  updateData: Partial<Omit<Area, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "areas", areaId), filteredData);
  } catch (error) {
    console.error("영역 업데이트 실패:", error);
    throw new Error("areaUpdateFailed");
  }
};

export const deleteAreaById = async (areaId: string): Promise<void> => {
  try {
    await runTransaction(db, async (transaction) => {
      const areaRef = doc(db, "areas", areaId);
      const areaDoc = await transaction.get(areaRef);

      if (!areaDoc.exists()) {
        throw new Error("영역을 찾을 수 없습니다.");
      }

      // 해당 영역에 속한 프로젝트들을 미분류 영역으로 이동
      const projectsQuery = query(
        collection(db, "projects"),
        where("areaId", "==", areaId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);

      // 미분류 영역 찾기
      const uncategorizedQuery = query(
        collection(db, "areas"),
        where("name", "==", "미분류")
      );
      const uncategorizedSnapshot = await getDocs(uncategorizedQuery);

      if (!uncategorizedSnapshot.empty) {
        const uncategorizedAreaId = uncategorizedSnapshot.docs[0].id;

        // 프로젝트들을 미분류 영역으로 이동
        projectsSnapshot.docs.forEach((projectDoc) => {
          transaction.update(projectDoc.ref, {
            areaId: uncategorizedAreaId,
            updatedAt: updateTimestamp(),
          });
        });
      }

      // 해당 영역에 속한 리소스들을 미분류 영역으로 이동
      const resourcesQuery = query(
        collection(db, "resources"),
        where("areaId", "==", areaId)
      );
      const resourcesSnapshot = await getDocs(resourcesQuery);

      if (!uncategorizedSnapshot.empty) {
        const uncategorizedAreaId = uncategorizedSnapshot.docs[0].id;

        // 리소스들을 미분류 영역으로 이동
        resourcesSnapshot.docs.forEach((resourceDoc) => {
          transaction.update(resourceDoc.ref, {
            areaId: uncategorizedAreaId,
            updatedAt: updateTimestamp(),
          });
        });
      }

      // 영역 삭제
      transaction.delete(areaRef);
    });
  } catch (error) {
    console.error("영역 삭제 실패:", error);
    if (error instanceof Error) {
      throw new Error(`areaDeleteFailed: ${error.message}`);
    }
    throw new Error("areaDeleteFailed");
  }
};
