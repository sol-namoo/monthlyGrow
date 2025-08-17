"use client";

import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { resetTimeZoneCache } from "@/lib/utils";

export function TimeZoneInitializer() {
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    // 로딩이 완료되고 사용자 상태가 변경되었을 때만 실행
    if (!loading) {
      // 사용자가 로그인되었거나 로그아웃되었을 때 타임존 캐시 초기화
      resetTimeZoneCache();

      // 개발 환경에서 로그 출력
      if (process.env.NODE_ENV === "development") {
        console.log(
          "TimeZone cache reset due to auth state change:",
          user ? "User logged in" : "User logged out"
        );
      }
    }
  }, [user, loading]);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
