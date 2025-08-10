import { ko } from "./ko";
import { en } from "./en";

export type Language = "ko" | "en";

export const translations = {
  ko,
  en,
} as const;

export type TranslationKey = keyof typeof translations.ko;
