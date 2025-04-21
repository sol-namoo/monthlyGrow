import type React from "react"
import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  )
}
