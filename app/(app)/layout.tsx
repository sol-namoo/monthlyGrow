"use client";

import type React from "react";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/widgets/bottom-nav";
import Loading from "@/components/feedback/Loading";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth(true); // 인증 필요

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return <Loading />;
  }

  // 사용자가 로그인되지 않은 경우 아무것도 렌더링하지 않음
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}
