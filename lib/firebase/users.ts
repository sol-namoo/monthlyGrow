import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  setDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { db, storage, auth } from "./config";
import {
  createBaseData,
  updateTimestamp,
  filterUndefinedValues,
} from "./utils";
import { buildNestedUpdateFields } from "./crud-helpers";
import { User, UserProfile, UserSettings, UserPreferences } from "../types";

const defaultUserProfile = {
  displayName: "",
  email: "",
  emailVerified: false,
};

const defaultUserSettings = {
  defaultReward: "",
  defaultRewardEnabled: false,
  carryOver: true,
  aiRecommendations: true,
  notifications: true,
  theme: "system" as const,
  language: "ko" as const,
  monthlyProjectCardDisplay: "monthly_only" as const,
};

const defaultUserPreferences = {
  timezone: "Asia/Seoul",
  dateFormat: "YYYY-MM-DD",
  weeklyStartDay: "monday" as const,
};

// Users
export const fetchUserById = async (userId: string): Promise<User> => {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const createdAt = data.createdAt.toDate();
    const updatedAt = data.updatedAt?.toDate() || createdAt;
    return {
      id: docSnap.id,
      profile: {
        ...defaultUserProfile,
        ...(data.profile || {}),
        createdAt: data.profile?.createdAt?.toDate?.() || createdAt,
        updatedAt: data.profile?.updatedAt?.toDate?.() || updatedAt,
      },
      settings: {
        ...defaultUserSettings,
        ...(data.settings || {}),
      },
      preferences: {
        ...defaultUserPreferences,
        ...(data.preferences || {}),
      },
    } as User;
  } else {
    // 사용자 문서가 없을 때 기본 사용자 데이터 반환

    return {
      id: userId,
      profile: {
        ...defaultUserProfile,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      settings: defaultUserSettings,
      preferences: defaultUserPreferences,
    } as User;
  }
};

export const createUser = async (userData: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
}): Promise<User> => {
  try {
    if (!userData.uid) {
      throw new Error("사용자 UID가 필요합니다.");
    }
    if (!userData.email?.trim()) {
      throw new Error("이메일이 필요합니다.");
    }

    const baseData = createBaseData(userData.uid);
    const newUser = {
      id: userData.uid,
      profile: {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || "",
        emailVerified: userData.emailVerified || false,
      },
      settings: {
        ...defaultUserSettings,
      },
      preferences: defaultUserPreferences,
      ...baseData,
    };

    // setDoc을 사용하여 특정 ID로 문서 생성
    await setDoc(doc(db, "users", userData.uid), newUser);

    return {
      id: userData.uid,
      profile: {
        displayName: userData.displayName || "",
        email: userData.email,
        photoURL: userData.photoURL || "",
        emailVerified: userData.emailVerified || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      settings: {
        ...defaultUserSettings,
      },
      preferences: defaultUserPreferences,
    } as User;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`사용자 생성에 실패했습니다: ${error.message}`);
    }
    throw new Error("사용자 생성에 실패했습니다.");
  }
};

/**
 * 사용자 문서가 존재하는지 확인하고, 없으면 기본 문서를 생성합니다.
 */
const ensureUserDocumentExists = async (userId: string): Promise<void> => {
  const userDocRef = doc(db, "users", userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // 사용자 문서가 없으면 기본 문서를 생성
    const baseData = createBaseData(userId);
    const defaultUser = {
      profile: {
        ...defaultUserProfile,
        createdAt: baseData.createdAt,
        updatedAt: baseData.updatedAt,
      },
      settings: {
        ...defaultUserSettings,
        createdAt: baseData.createdAt,
        updatedAt: baseData.updatedAt,
      },
      preferences: {
        ...defaultUserPreferences,
        createdAt: baseData.createdAt,
        updatedAt: baseData.updatedAt,
      },
      ...baseData,
    };

    await setDoc(userDocRef, defaultUser);
  }
};

export const updateUserProfile = async (
  userId: string,
  updateData: Partial<Omit<UserProfile, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    await ensureUserDocumentExists(userId);

    const filteredData = filterUndefinedValues({
      ...updateData,
      updatedAt: updateTimestamp(),
    });

    const updateFields = buildNestedUpdateFields(
      "profile",
      filteredData,
      updateTimestamp()
    );

    await updateDoc(doc(db, "users", userId), updateFields);
  } catch (error) {
    throw new Error("사용자 프로필 업데이트에 실패했습니다.");
  }
};

export const updateUserSettings = async (
  userId: string,
  updateData: Partial<Omit<UserSettings, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    await ensureUserDocumentExists(userId);

    const filteredData = filterUndefinedValues(updateData);
    const updateFields = buildNestedUpdateFields(
      "settings",
      filteredData,
      updateTimestamp()
    );

    await updateDoc(doc(db, "users", userId), updateFields);
  } catch (error) {
    console.error("설정 업데이트 실패:", error);
    throw new Error("사용자 설정 업데이트에 실패했습니다.");
  }
};

export const updateUserPreferences = async (
  userId: string,
  updateData: Partial<Omit<UserPreferences, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    await ensureUserDocumentExists(userId);

    const filteredData = filterUndefinedValues(updateData);
    const updateFields = buildNestedUpdateFields(
      "preferences",
      filteredData,
      updateTimestamp()
    );

    await updateDoc(doc(db, "users", userId), updateFields);
  } catch (error) {
    console.error("선호도 업데이트 실패:", error);
    throw new Error("사용자 선호도 업데이트에 실패했습니다.");
  }
};

export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string> => {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}/${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    throw new Error("프로필 사진 업로드에 실패했습니다.");
  }
};

export const updateUserProfilePicture = async (
  userId: string,
  photoURL: string
): Promise<void> => {
  try {
    await ensureUserDocumentExists(userId);
    const user = auth.currentUser;
    if (!user) {
      throw new Error("로그인된 사용자가 없습니다.");
    }

    await updateProfile(user, { photoURL });
    const updateFields = buildNestedUpdateFields(
      "profile",
      { photoURL },
      updateTimestamp()
    );
    await updateDoc(doc(db, "users", userId), updateFields);
  } catch (error) {
    throw new Error("프로필 사진 업데이트에 실패했습니다.");
  }
};
