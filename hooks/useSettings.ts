import { useState, useEffect } from "react";

export interface UserSettings {
  username: string;
  email: string;
  defaultReward: string;
  defaultRewardEnabled: boolean;
  carryOver: boolean;
  aiRecommendations: boolean;
  notifications: boolean;
}

const defaultSettings: UserSettings = {
  username: "루퍼",
  email: "looper@example.com",
  defaultReward: "좋아하는 카페에서 디저트 먹기",
  defaultRewardEnabled: true,
  carryOver: true,
  aiRecommendations: true,
  notifications: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error("설정 파싱 오류:", error);
        setSettings(defaultSettings);
      }
    }
    setIsLoading(false);
  }, []);

  // 설정 저장
  const saveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    localStorage.setItem("userSettings", JSON.stringify(newSettings));
  };

  // 설정 업데이트
  const updateSettings = (updates: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...updates };
    saveSettings(updatedSettings);
  };

  return {
    settings,
    saveSettings,
    updateSettings,
    isLoading,
  };
}
