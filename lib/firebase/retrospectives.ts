import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Retrospective } from "../types";

// Retrospectives
export const fetchAllRetrospectivesByUserId = async (
  userId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

export const fetchRetrospectiveById = async (
  retrospectiveId: string
): Promise<Retrospective> => {
  const docRef = doc(db, "retrospectives", retrospectiveId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  } else {
    throw new Error("Retrospective not found");
  }
};

export const fetchRetrospectivesByMonthlyId = async (
  chapterId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("chapterId", "==", chapterId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

export const fetchRetrospectivesByProjectId = async (
  projectId: string
): Promise<Retrospective[]> => {
  const q = query(
    collection(db, "retrospectives"),
    where("projectId", "==", projectId),
    orderBy("createdAt", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Retrospective;
  });
};

export const createRetrospective = async (
  retrospectiveData: Omit<Retrospective, "id" | "createdAt" | "updatedAt">
): Promise<Retrospective> => {
  try {
    if (!retrospectiveData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }

    const baseData = createBaseData(retrospectiveData.userId);
    const newRetrospective = {
      ...retrospectiveData,
      ...baseData,
    };

    const docRef = await addDoc(
      collection(db, "retrospectives"),
      newRetrospective
    );
    console.log(`✅ 회고 생성 완료 - ID: ${docRef.id}`);

    return {
      id: docRef.id,
      ...newRetrospective,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Retrospective;
  } catch (error) {
    console.error("❌ 회고 생성 실패:", error);
    if (error instanceof Error) {
      throw new Error(`회고 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("회고 생성에 실패했습니다.");
  }
};

export const updateRetrospective = async (
  retrospectiveId: string,
  updateData: Partial<Omit<Retrospective, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "retrospectives", retrospectiveId), filteredData);
    console.log(`✅ 회고 업데이트 완료 - ID: ${retrospectiveId}`);
  } catch (error) {
    console.error(`❌ 회고 업데이트 실패 - ID: ${retrospectiveId}`, error);
    throw new Error("회고 업데이트에 실패했습니다.");
  }
};
