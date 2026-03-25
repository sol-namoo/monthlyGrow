import { atom } from "jotai";
import { defaultSettings } from "@/lib/settings";
import { UserSettings } from "@/lib/types";

export const settingsAtom = atom<UserSettings>(defaultSettings);
export const settingsLoadingAtom = atom(true);
