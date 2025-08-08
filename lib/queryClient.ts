// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 staleTime 설정 (5분)
      staleTime: 5 * 60 * 1000,
      // 기본 gcTime 설정 (10분)
      gcTime: 10 * 60 * 1000,
      // 재시도 횟수 제한
      retry: 2,
      // 네트워크 오류 시에만 재시도
      retryOnMount: false,
      // 윈도우 포커스 시 자동 리페치 비활성화
      refetchOnWindowFocus: false,
      // 네트워크 재연결 시 자동 리페치 비활성화
      refetchOnReconnect: false,
    },
  },
});
