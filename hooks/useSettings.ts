import { useState, useEffect, useCallback } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { fetchUserById, updateUserSettings } from "@/lib/firebase";
import { UserSettings } from "@/lib/types";
import { useTheme } from "next-themes";
import { detectBrowserLanguage } from "@/lib/language-detection";
import { Language } from "@/lib/translations";

const defaultSettings: UserSettings = {
  defaultReward: "",
  defaultRewardEnabled: false,
  carryOver: true, // 기본적으로 true로 설정
  aiRecommendations: true,
  notifications: true,
  theme: "system",
  language: "en", // 서버와 클라이언트에서 동일한 기본값 사용
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [user, userLoading] = useAuthState(auth);
  const { setTheme, resolvedTheme } = useTheme();
  const [isInitialized, setIsInitialized] = useState(false);

  // 클라이언트에서만 언어 감지 및 설정
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 로그인 전 언어 설정이 있으면 우선 사용
    const preLoginLang = localStorage.getItem("preLoginLanguage") as Language;
    if (preLoginLang && preLoginLang !== settings.language) {
      setSettings((prev) => ({ ...prev, language: preLoginLang }));
      return;
    }

    // 브라우저 언어 감지 (기본값이 영어가 아닌 경우에만)
    if (settings.language === "en") {
      const detectedLang = detectBrowserLanguage();
      if (detectedLang !== "en") {
        setSettings((prev) => ({ ...prev, language: detectedLang }));
      }
    }
  }, [settings.language]);

  // Firestore에서 사용자 설정 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) {
        // 로그인하지 않은 경우 이미 초기화된 언어 설정 유지
        setIsLoading(false);
        return;
      }

      try {
        const userData = await fetchUserById(user.uid);
        const userSettings = userData.settings || defaultSettings;

        // 언어 설정이 없는 경우 브라우저 언어 감지
        if (!userSettings.language) {
          userSettings.language = detectBrowserLanguage();
        }

        setSettings(userSettings);

        // 사용자 설정의 테마가 있고 현재 테마와 다르면 업데이트
        if (userSettings.theme && userSettings.theme !== resolvedTheme) {
          setTheme(userSettings.theme);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("설정 불러오기 실패:", error);
        const detectedLang = detectBrowserLanguage();
        setSettings({ ...defaultSettings, language: detectedLang });
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
  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      if (!user?.uid) {
        throw new Error("로그인된 사용자가 없습니다.");
      }

      try {
        await updateUserSettings(user.uid, updates);
        setSettings((prev) => ({ ...prev, ...updates }));

        // 테마 변경 시 즉시 next-themes와 동기화
        if (updates.theme) {
          setTheme(updates.theme);
        }
      } catch (error) {
        console.error("설정 업데이트 실패:", error);
        throw error;
      }
    },
    [user?.uid, setSettings, resolvedTheme, setTheme]
  );

  return {
    settings,
    updateSettings,
    isLoading: isLoading || userLoading,
  };
}
