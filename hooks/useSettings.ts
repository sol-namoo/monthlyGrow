import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { fetchUserById, updateUserSettings } from "@/lib/firebase";
import { UserSettings } from "@/lib/types";

const defaultSettings: UserSettings = {
  defaultReward: "",
  defaultRewardEnabled: false,
  carryOver: true,
  aiRecommendations: true,
  notifications: true,
  theme: "system",
  language: "ko",
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [user, userLoading] = useAuthState(auth);

  // Firestore에서 사용자 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchUserById(user.uid);
        setSettings(userData.settings);
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
        setSettings(defaultSettings);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      loadSettings();
    }
  }, [user?.uid, userLoading]);

  // Firestore에 설정 업데이트
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.uid) {
      throw new Error("로그인된 사용자가 없습니다.");
    }

    try {
      await updateUserSettings(user.uid, updates);
      setSettings((prev) => ({ ...prev, ...updates }));
    } catch (error) {
      console.error("설정 업데이트 실패:", error);
      throw error;
    }
  };

  return {
    settings,
    updateSettings,
    isLoading: isLoading || userLoading,
  };
}
