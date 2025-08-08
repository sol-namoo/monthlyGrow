"use client";

import * as React from "react";
import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { useLanguage } from "@/hooks/useLanguage";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const { settings, updateSettings } = useSettings();
  const { translate, currentLanguage } = useLanguage();

  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);

    // Firestore에 설정 저장
    try {
      await updateSettings({ theme: newTheme });
    } catch (error) {
      console.error("테마 설정 저장 실패:", error);
    }
  };

  const handleLanguageChange = async (newLanguage: "ko" | "en") => {
    try {
      await updateSettings({ language: newLanguage });
    } catch (error) {
      console.error("언어 설정 저장 실패:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">테마 전환</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleThemeChange("light")}>
          {translate("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("dark")}>
          {translate("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleThemeChange("system")}>
          {translate("theme.system")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleLanguageChange("ko")}>
          {translate("language.korean")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange("en")}>
          {translate("language.english")}
        </DropdownMenuItem>
        <div className="px-2 py-1.5 text-xs text-muted-foreground border-t mt-1">
          {translate("theme.mobileNotice")}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
