"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Target, Briefcase, Layers, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const navItems = [
  { href: "/home", labelKey: "bottomNav.home", icon: Home },
  { href: "/chapter", labelKey: "bottomNav.chapter", icon: Target },
  { href: "/para", labelKey: "bottomNav.para", icon: Layers },
  { href: "/settings", labelKey: "bottomNav.settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { translate } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-background border-border",
        mounted && resolvedTheme === "light" && "shadow-lg"
      )}
    >
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">
                {translate(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
