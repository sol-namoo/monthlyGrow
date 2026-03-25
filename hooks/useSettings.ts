import { useCallback } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { updateUserSettings } from "@/lib/firebase";
import { useTheme } from "next-themes";
import { settingsAtom, settingsLoadingAtom } from "@/store/settings";

export function useSettings() {
  const [user, userLoading] = useAuthState(auth);
  const { setTheme } = useTheme();
  const [settings, setSettings] = useAtom(settingsAtom);
  const settingsLoading = useAtomValue(settingsLoadingAtom);

  const updateSettings = useCallback(
    async (updates: Partial<typeof settings>) => {
      if (!user?.uid) {
        throw new Error("로그인된 사용자가 없습니다.");
      }

      try {
        await updateUserSettings(user.uid, updates);
        setSettings((prev) => ({ ...prev, ...updates }));

        if (updates.language) {
          localStorage.setItem(`userLanguage_${user.uid}`, updates.language);
        }

        if (updates.theme) {
          setTheme(updates.theme);
        }
      } catch (error) {
        console.error("설정 업데이트 실패:", error);
        throw error;
      }
    },
    [setSettings, setTheme, user?.uid]
  );

  return {
    settings,
    updateSettings,
    isLoading: settingsLoading || userLoading,
  };
}
