import { auth } from "@/lib/firebase";
import { Language } from "@/lib/translations";
import { UserSettings } from "@/lib/types";

export const defaultSettings: UserSettings = {
  defaultReward: "",
  defaultRewardEnabled: false,
  aiRecommendations: true,
  notifications: true,
  theme: "system",
  language: "en",
};

export function isLanguage(value: unknown): value is Language {
  return value === "ko" || value === "en";
}

export function getStoredLanguage(userId?: string | null): Language | null {
  if (typeof window === "undefined") {
    return null;
  }

  const currentUserId = userId ?? auth.currentUser?.uid;

  if (currentUserId) {
    const savedUserLanguage = localStorage.getItem(`userLanguage_${currentUserId}`);
    if (isLanguage(savedUserLanguage)) {
      return savedUserLanguage;
    }
  }

  const preLoginLanguage = localStorage.getItem("preLoginLanguage");
  if (isLanguage(preLoginLanguage)) {
    return preLoginLanguage;
  }

  return null;
}

export function getInitialSettingsSnapshot(): UserSettings {
  const storedLanguage = getStoredLanguage();

  if (!storedLanguage) {
    return defaultSettings;
  }

  return {
    ...defaultSettings,
    language: storedLanguage,
  };
}

export function mergeUserSettings(
  userSettings?: Partial<UserSettings> | null,
  fallbackLanguage?: Language | null
): UserSettings {
  return {
    ...defaultSettings,
    ...userSettings,
    language: userSettings?.language ?? fallbackLanguage ?? defaultSettings.language,
  };
}
