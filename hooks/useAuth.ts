import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // 이미 리다이렉션을 처리했거나 로딩 중이면 무시
    if (hasRedirected || loading) {
      return;
    }

    if (requireAuth && !user) {
      // 인증이 필요한 페이지에서 로그인되지 않은 경우
      if (!isRedirecting) {
        setIsRedirecting(true);
        setHasRedirected(true);
        router.push("/login");
      }
    } else if (!requireAuth && user) {
      // 인증이 필요하지 않은 페이지(로그인 페이지)에서 로그인된 경우
      if (!isRedirecting) {
        setIsRedirecting(true);
        setHasRedirected(true);
        router.push("/home");
      }
    }
  }, [user, loading, requireAuth, router, isRedirecting, hasRedirected]);

  // 에러가 발생한 경우 리다이렉션 상태 리셋
  useEffect(() => {
    if (error) {
      setIsRedirecting(false);
      setHasRedirected(false);
    }
  }, [error]);

  return {
    user,
    loading: loading || isRedirecting,
    isAuthenticated: !!user,
    error,
    isRedirecting,
  };
}
