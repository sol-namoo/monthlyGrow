import { useSettings } from "./useSettings";
import { translations, Language } from "@/lib/translations";

export function useLanguage() {
  const { settings } = useSettings();
  const currentLanguage = settings.language || "en";

  const translate = (key: string): string => {
    const keys = key.split(".");
    let value: any = translations[currentLanguage as Language];

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // 키를 찾을 수 없으면 키 자체를 반환
      }
    }

    return typeof value === "string" ? value : key;
  };

  return { translate, currentLanguage };
}
