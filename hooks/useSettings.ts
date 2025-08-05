import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { fetchUserById, updateUserSettings } from "@/lib/firebase";
import { UserSettings } from "@/lib/types";
import { useTheme } from "next-themes";

const defaultSettings: UserSettings = {
  defaultReward: "",
  defaultRewardEnabled: false,
  carryOver: true, // 기본적으로 true로 설정
  aiRecommendations: true,
  notifications: true,
  theme: "system",
  language: "ko",
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [user, userLoading] = useAuthState(auth);
  const { setTheme, resolvedTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // Firestore에서 사용자 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchUserById(user.uid);
        const userSettings = userData.settings || defaultSettings;
        setSettings(userSettings);

        // 초기 로드 시에만 테마 동기화 (이미 설정된 테마와 다를 때만)
        if (
          !isInitialized &&
          userSettings.theme &&
          userSettings.theme !== resolvedTheme
        ) {
          setTheme(userSettings.theme);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
        setSettings(defaultSettings);
        if (!isInitialized) {
          setTheme(defaultSettings.theme);
        }
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (!userLoading) {
      loadSettings();
    }
  }, [user?.uid, userLoading, setTheme, resolvedTheme, isInitialized]);

  // Firestore에 설정 업데이트
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user?.uid) {
      throw new Error("로그인된 사용자가 없습니다.");
    }

    try {
      await updateUserSettings(user.uid, updates);
      setSettings((prev) => ({ ...prev, ...updates }));

      // 테마 변경 시에만 next-themes와 동기화
      if (updates.theme && updates.theme !== resolvedTheme) {
        setTheme(updates.theme);
      }
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
