"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, Briefcase, Layers, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/home", label: "홈", icon: Home },
  { href: "/loop", label: "루프", icon: Target },
  { href: "/project", label: "프로젝트", icon: Briefcase },
  { href: "/para", label: "PARA", icon: Layers },
  { href: "/settings", label: "설정", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <nav className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
