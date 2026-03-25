import { Language } from "@/lib/translations";
import { UserSettings } from "@/lib/types";

export const LANGUAGE_COOKIE_NAME = "language";

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

export function getLanguageCookieValue(): Language | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${LANGUAGE_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  const value = decodeURIComponent(cookie.split("=")[1] ?? "");
  return isLanguage(value) ? value : null;
}

export function persistLanguageSelection(language: Language) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${LANGUAGE_COOKIE_NAME}=${encodeURIComponent(language)}; Path=/; Max-Age=31536000; SameSite=Lax`;
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
