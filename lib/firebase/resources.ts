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
  runTransaction,
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

    // 트랜잭션으로 리소스 생성과 Area counts 업데이트를 함께 처리
    const result = await runTransaction(db, async (transaction) => {
      const resourceRef = doc(collection(db, "resources"));
      transaction.set(resourceRef, newResource);

      // Area가 지정된 경우 Area의 resourceCount 증가
      if (resourceData.areaId) {
        const areaRef = doc(db, "areas", resourceData.areaId);
        const areaSnap = await transaction.get(areaRef);

        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          const currentCounts = areaData.counts || {
            projectCount: 0,
            resourceCount: 0,
          };
          transaction.update(areaRef, {
            counts: {
              projectCount: currentCounts.projectCount,
              resourceCount: currentCounts.resourceCount + 1,
            },
            updatedAt: updateTimestamp(),
          });
        }
      }

      return resourceRef.id;
    });

    return {
      id: result,
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
    // areaId가 변경되는 경우 Area counts 업데이트 필요
    if (updateData.areaId !== undefined) {
      await runTransaction(db, async (transaction) => {
        const resourceRef = doc(db, "resources", resourceId);
        const resourceSnap = await transaction.get(resourceRef);

        if (!resourceSnap.exists()) {
          throw new Error("리소스를 찾을 수 없습니다.");
        }

        const resourceData = resourceSnap.data();
        const oldAreaId = resourceData.areaId;
        const newAreaId = updateData.areaId;

        // 이전 Area의 resourceCount 감소
        if (oldAreaId) {
          const oldAreaRef = doc(db, "areas", oldAreaId);
          const oldAreaSnap = await transaction.get(oldAreaRef);

          if (oldAreaSnap.exists()) {
            const oldAreaData = oldAreaSnap.data();
            const oldCounts = oldAreaData.counts || {
              projectCount: 0,
              resourceCount: 0,
            };
            transaction.update(oldAreaRef, {
              counts: {
                projectCount: oldCounts.projectCount,
                resourceCount: Math.max(0, oldCounts.resourceCount - 1),
              },
              updatedAt: updateTimestamp(),
            });
          }
        }

        // 새 Area의 resourceCount 증가
        if (newAreaId && newAreaId !== oldAreaId) {
          const newAreaRef = doc(db, "areas", newAreaId);
          const newAreaSnap = await transaction.get(newAreaRef);

          if (newAreaSnap.exists()) {
            const newAreaData = newAreaSnap.data();
            const newCounts = newAreaData.counts || {
              projectCount: 0,
              resourceCount: 0,
            };
            transaction.update(newAreaRef, {
              counts: {
                projectCount: newCounts.projectCount,
                resourceCount: newCounts.resourceCount + 1,
              },
              updatedAt: updateTimestamp(),
            });
          }
        }

        // 리소스 업데이트
        const filteredData = filterUndefinedValues({
          ...updateData,
          updatedAt: updateTimestamp(),
        });
        transaction.update(resourceRef, filteredData);
      });
    } else {
      // areaId가 변경되지 않는 경우 일반 업데이트
      const filteredData = filterUndefinedValues({
        ...updateData,
        updatedAt: updateTimestamp(),
      });

      await updateDoc(doc(db, "resources", resourceId), filteredData);
    }
  } catch (error) {
    console.error(`❌ 리소스 업데이트 실패 - ID: ${resourceId}`, error);
    throw new Error("resourceUpdateFailed");
  }
};

export const deleteResourceById = async (resourceId: string): Promise<void> => {
  try {
    // 트랜잭션으로 리소스 삭제와 Area counts 업데이트를 함께 처리
    await runTransaction(db, async (transaction) => {
      const resourceRef = doc(db, "resources", resourceId);
      const resourceSnap = await transaction.get(resourceRef);

      if (!resourceSnap.exists()) {
        throw new Error("리소스를 찾을 수 없습니다.");
      }

      const resourceData = resourceSnap.data();
      const areaId = resourceData.areaId;

      // Area의 resourceCount 감소
      if (areaId) {
        const areaRef = doc(db, "areas", areaId);
        const areaSnap = await transaction.get(areaRef);

        if (areaSnap.exists()) {
          const areaData = areaSnap.data();
          const currentCounts = areaData.counts || {
            projectCount: 0,
            resourceCount: 0,
          };
          transaction.update(areaRef, {
            counts: {
              projectCount: currentCounts.projectCount,
              resourceCount: Math.max(0, currentCounts.resourceCount - 1),
            },
            updatedAt: updateTimestamp(),
          });
        }
      }

      // 리소스 삭제
      transaction.delete(resourceRef);
    });
  } catch (error) {
    console.error(`❌ 리소스 삭제 실패 - ID: ${resourceId}`, error);
    throw new Error("resourceDeleteFailed");
  }
};
