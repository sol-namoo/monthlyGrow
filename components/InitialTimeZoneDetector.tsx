"use client";

import { useEffect } from "react";
import { getUserTimeZone } from "@/lib/utils";

export function InitialTimeZoneDetector() {
  useEffect(() => {
    // 앱 초기 로드 시 타임존을 한 번만 감지
    getUserTimeZone();
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음
  return null;
}
