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
} from "firebase/firestore";
import { db } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { Resource } from "../types";

// Resources
export const fetchAllResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  try {
    const q = query(collection(db, "resources"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Resource;
    });
  } catch (error) {
    console.error("리소스 조회 실패:", error);
    throw new Error("resourceLoadFailed");
  }
};

export const fetchActiveResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Resource[];
  } catch (error) {
    console.error("활성 리소스 조회 실패:", error);
    throw new Error("activeResourceLoadFailed");
  }
};

export const fetchArchivedResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  try {
    const q = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      where("status", "==", "archived")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Resource[];
  } catch (error) {
    console.error("아카이브된 리소스 조회 실패:", error);
    throw new Error("archivedResourceLoadFailed");
  }
};

export const fetchResourceById = async (
  resourceId: string
): Promise<Resource> => {
  try {
    const docRef = doc(db, "resources", resourceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Resource;
    } else {
      throw new Error("Resource not found");
    }
  } catch (error) {
    console.error("리소스 조회 실패:", error);
    throw new Error("resourceLoadFailed");
  }
};

// 리소스와 연결된 영역 정보를 함께 가져오는 함수
export const fetchResourceWithAreaById = async (
  resourceId: string
): Promise<Resource> => {
  const docRef = doc(db, "resources", resourceId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const resource = {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Resource;

    // 영역 정보 가져오기
    if (resource.areaId) {
      try {
        const areaRef = doc(db, "areas", resource.areaId);
        const areaSnap = await getDoc(areaRef);
        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          return {
            ...resource,
            area: areaData.name || "기타",
          } as Resource;
        }
      } catch (error) {
        console.error("Error fetching area for resource:", error);
      }
    }

    return resource;
  } else {
    throw new Error("Resource not found");
  }
};

export const fetchUncategorizedResourcesByUserId = async (
  userId: string
): Promise<Resource[]> => {
  try {
    // 먼저 미분류 영역을 찾습니다
    const areasQuery = query(
      collection(db, "areas"),
      where("userId", "==", userId),
      where("name", "==", "미분류")
    );
    const areasSnapshot = await getDocs(areasQuery);

    if (areasSnapshot.empty) {
      return []; // 미분류 영역이 없으면 빈 배열 반환
    }

    const uncategorizedAreaId = areasSnapshot.docs[0].id;

    // 미분류 영역에 속한 리소스들만 가져옵니다
    const resourcesQuery = query(
      collection(db, "resources"),
      where("userId", "==", userId),
      where("areaId", "==", uncategorizedAreaId)
    );

    const querySnapshot = await getDocs(resourcesQuery);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
      } as Resource;
    });
  } catch (error) {
    console.error("미분류 리소스 조회 실패:", error);
    throw new Error("uncategorizedResourceLoadFailed");
  }
};

export const createResource = async (
  resourceData: Omit<Resource, "id" | "createdAt" | "updatedAt">
): Promise<Resource> => {
  try {
    if (!resourceData.userId) {
      throw new Error("사용자 ID가 필요합니다.");
    }
    if (!resourceData.name?.trim()) {
      throw new Error("리소스 이름을 입력해주세요.");
    }

    const baseData = createBaseData(resourceData.userId);
    const newResource = {
      ...resourceData,
      ...baseData,
    };

    const docRef = await addDoc(collection(db, "resources"), newResource);

    return {
      id: docRef.id,
      userId: resourceData.userId,
      name: resourceData.name,
      description: resourceData.description || "",
      link: resourceData.link || "",
      areaId: resourceData.areaId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Resource;
  } catch (error) {
    console.error("❌ 리소스 생성 실패:", error);
    if (error instanceof Error) {
      throw new Error(`resourceCreateFailed: ${error.message}`);
    }
    throw new Error("resourceCreateFailed");
  }
};

export const updateResource = async (
  resourceId: string,
  updateData: Partial<Omit<Resource, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    await updateDoc(doc(db, "resources", resourceId), filteredData);
  } catch (error) {
    console.error(`❌ 리소스 업데이트 실패 - ID: ${resourceId}`, error);
    throw new Error("resourceUpdateFailed");
  }
};

export const deleteResourceById = async (resourceId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, "resources", resourceId));
  } catch (error) {
    console.error(`❌ 리소스 삭제 실패 - ID: ${resourceId}`, error);
    throw new Error("resourceDeleteFailed");
  }
};
