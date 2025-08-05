import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // 인증이 필요한 페이지에서 로그인되지 않은 경우
        setIsRedirecting(true);
        router.push("/login");
      } else if (!requireAuth && user) {
        // 인증이 필요하지 않은 페이지(로그인 페이지)에서 로그인된 경우
        setIsRedirecting(true);
        router.push("/home");
      }
    }
  }, [user, loading, requireAuth, router]);

  return {
    user,
    loading: loading || isRedirecting,
    isAuthenticated: !!user,
  };
}
