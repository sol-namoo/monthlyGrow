"use client";

import type React from "react";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/widgets/bottom-nav";
import Loading from "@/components/feedback/Loading";
import { TimeZoneInitializer } from "@/components/TimeZoneInitializer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, error, isRedirecting } = useAuth(true); // 인증 필요

  // 로딩 중일 때 로딩 화면 표시
  if (loading) {
    return <Loading />;
  }

  // 인증 에러가 발생한 경우
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <div className="space-y-4">
              <p>인증 상태를 확인하는 중 오류가 발생했습니다.</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  새로고침
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => (window.location.href = "/login")}
                >
                  로그인 페이지로
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 사용자가 로그인되지 않은 경우 (리다이렉션 중)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <TimeZoneInitializer />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  );
}
