"use client";

import { ReactNode, useEffect, useState } from "react";
import { Provider, useAtom, useSetAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useAuthState } from "react-firebase-hooks/auth";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { fetchUserById } from "@/lib/firebase";
import {
  defaultSettings,
  getInitialSettingsSnapshot,
  getStoredLanguage,
  mergeUserSettings,
} from "@/lib/settings";
import { settingsAtom, settingsLoadingAtom } from "@/store/settings";
import { UserSettings } from "@/lib/types";

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
    const storedLanguage = getStoredLanguage(user?.uid);

    if (storedLanguage && storedLanguage !== settings.language) {
      setSettings((prev) => ({
        ...prev,
        language: storedLanguage,
      }));
    }
  }, [settings.language, setSettings, user?.uid]);

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

        const mergedSettings = mergeUserSettings(
          userData.settings,
          getStoredLanguage(user.uid)
        );

        setSettings(mergedSettings);
        localStorage.setItem(`userLanguage_${user.uid}`, mergedSettings.language);
        setTheme(mergedSettings.theme);
      } catch (error) {
        console.error("설정 불러오기 실패:", error);

        if (isCancelled) {
          return;
        }

        setSettings((prev) =>
          mergeUserSettings(prev, getStoredLanguage(user?.uid))
        );
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
  }, [setSettings, setSettingsLoading, setTheme, user?.uid, userLoading]);

  return <>{children}</>;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [initialSettings] = useState(() => getInitialSettingsSnapshot());

  return (
    <Provider>
      <HydrateSettingsAtoms initialSettings={initialSettings}>
        <SettingsBootstrap>{children}</SettingsBootstrap>
      </HydrateSettingsAtoms>
    </Provider>
  );
}
