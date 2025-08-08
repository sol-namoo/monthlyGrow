import { Language } from "./translations";

export function detectBrowserLanguage(): Language {
  // 브라우저 환경이 아닌 경우 기본값 반환
  if (typeof window === "undefined") {
    return "en";
  }

  const browserLang = navigator.language || navigator.languages?.[0] || "en";
  const primaryLang = browserLang.split("-")[0]; // "ko-KR" -> "ko"

  return primaryLang === "ko" ? "ko" : "en";
}
