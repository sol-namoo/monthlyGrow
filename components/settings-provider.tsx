"use client";

import { ReactNode, useEffect } from "react";
import { Provider, useAtom, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { fetchUserById } from "@/lib/firebase";
import {
  defaultSettings,
  mergeUserSettings,
  persistLanguageSelection,
} from "@/lib/settings";
import { settingsAtom, settingsLoadingAtom } from "@/store/settings";
import { UserSettings } from "@/lib/types";
import { Language } from "@/lib/translations";

function HydrateSettingsAtoms({
  children,
  initialSettings,
}: {
  children: ReactNode;
  initialSettings: UserSettings;
}) {
  useHydrateAtoms([[settingsAtom, initialSettings]]);
  return children;
}

function SettingsBootstrap({ children }: { children: ReactNode }) {
  const [user, userLoading] = useAuthState(auth);
  const { setTheme } = useTheme();
  const [settings, setSettings] = useAtom(settingsAtom);
  const setSettingsLoading = useSetAtom(settingsLoadingAtom);

  useEffect(() => {
    let isCancelled = false;

    const loadSettings = async () => {
      if (userLoading) {
        return;
      }

      if (!user?.uid) {
        setSettingsLoading(false);
        return;
      }

      setSettingsLoading(true);

      try {
        const userData = await fetchUserById(user.uid);

        if (isCancelled) {
          return;
        }

        const mergedSettings = mergeUserSettings(userData.settings, settings.language);

        setSettings(mergedSettings);
        persistLanguageSelection(mergedSettings.language);
        setTheme(mergedSettings.theme);
      } catch (error) {
        console.error("설정 불러오기 실패:", error);

        if (isCancelled) {
          return;
        }

        setSettings((prev) => mergeUserSettings(prev, settings.language));
        setTheme(defaultSettings.theme);
      } finally {
        if (!isCancelled) {
          setSettingsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isCancelled = true;
    };
  }, [
    setSettings,
    setSettingsLoading,
    setTheme,
    settings.language,
    user?.uid,
    userLoading,
  ]);

  return <>{children}</>;
}

export function SettingsProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage: Language;
}) {
  const initialSettings: UserSettings = {
    ...defaultSettings,
    language: initialLanguage,
  };

  return (
    <Provider>
      <HydrateSettingsAtoms initialSettings={initialSettings}>
        <SettingsBootstrap>{children}</SettingsBootstrap>
      </HydrateSettingsAtoms>
    </Provider>
  );
}
