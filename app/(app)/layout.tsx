import type React from "react";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // localstorage에서 사용자 정보 저장 여부를 확인하여 user info 유무 확인
  // user info 있다면 주요 정보 새로 페칭 후 jotai에 저장 -> home으로 이동
  // user info 없다면 로그인 페이지로 이동
  
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
