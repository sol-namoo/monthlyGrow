import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { translations, Language } from "@/lib/translations";
import { settingsAtom } from "@/store/settings";

export function useLanguage() {
  const settings = useAtomValue(settingsAtom);
  const currentLanguage = settings.language || "en";

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split(".");
      let value: any = translations[currentLanguage as Language];

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key; // 키를 찾을 수 없으면 키 자체를 반환
        }
      }

      if (typeof value !== "string") {
        return key;
      }

      // 변수 치환
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }

      return value;
    },
    [currentLanguage]
  );

  return { translate, currentLanguage };
}
