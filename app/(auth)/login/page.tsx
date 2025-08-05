"use client";

import type React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Mail, Lock, Eye, EyeOff } from "lucide-react";

import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  signInWithPopup,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db, googleAuthProvider } from "@/lib/firebase";
import Link from "next/link";
import Loading from "@/components/feedback/Loading";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  let newUser: User;

  // 인증 상태 확인 (로그인 페이지에서는 인증 불필요)
  const { user, loading } = useAuth(false);

  // 로딩 중이거나 이미 로그인된 경우 로딩 화면 표시
  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      newUser = user;

      console.log("✅ 계정 인증 성공:", user.uid, user.displayName);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log(
          "새로운 사용자임을 감지했습니다. 약관 동의를 위한 모달을 엽니다."
        );
        setShowTermsModal(true);
      } else {
        console.log("정상 로그인 → 홈으로 이동");
        router.push("/home");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const agreeRegisterNewbie = async () => {
    setIsLoading(true);

    try {
      const userRef = doc(db, "users", newUser.uid);
      await setDoc(
        userRef,
        {
          displayName: newUser.displayName,
          email: newUser.email,
          photoUrl: newUser.photoURL,
        },
        { merge: true }
      );
      alert("✅ 가입을 환영합니다!");
    } finally {
      setIsLoading(false);
      router.push("/home");
    }
  };

  // 이메일/비밀번호 회원가입
  const handleEmailSignUp = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;
      newUser = user;

      console.log("✅ 이메일 회원가입 성공:", user.uid, user.email);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log(
          "새로운 사용자임을 감지했습니다. 약관 동의를 위한 모달을 엽니다."
        );
        setShowTermsModal(true);
      } else {
        console.log("정상 로그인 → 홈으로 이동");
        router.push("/home");
      }
    } catch (error: any) {
      console.error("❌ 이메일 회원가입 실패:", error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      console.log("✅ 이메일 로그인 성공:", user.uid, user.email);
      router.push("/home");
    } catch (error: any) {
      console.error("❌ 이메일 로그인 실패:", error);
      setError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Auth 에러 메시지 변환
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "등록되지 않은 이메일입니다.";
      case "auth/wrong-password":
        return "비밀번호가 올바르지 않습니다.";
      case "auth/email-already-in-use":
        return "이미 사용 중인 이메일입니다.";
      case "auth/weak-password":
        return "비밀번호는 최소 6자 이상이어야 합니다.";
      case "auth/invalid-email":
        return "올바른 이메일 형식이 아닙니다.";
      case "auth/too-many-requests":
        return "너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
      default:
        return "로그인 중 오류가 발생했습니다. 다시 시도해주세요.";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <Target className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">MonthlyGrow</h1>
          <p className="text-muted-foreground">월간 루프 기반 자기계발 앱</p>
        </div>

        <Card className="p-6">
          {!isEmailMode ? (
            // Google 로그인 모드
            <div className="mt-6">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  Google로 로그인 / 회원가입
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      또는
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsEmailMode(true)}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  이메일로 로그인
                </Button>
              </div>
            </div>
          ) : (
            // 이메일 로그인 모드
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="이메일을 입력하세요"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호를 입력하세요"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleEmailSignIn}
                  disabled={isLoading || !email || !password}
                >
                  로그인
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEmailSignUp}
                  disabled={isLoading || !email || !password}
                >
                  회원가입
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsEmailMode(false);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  disabled={isLoading}
                >
                  Google 로그인으로 돌아가기
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      <Dialog open={showTermsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
            <DialogDescription>
              These are the terms and conditions. By agreeing, you consent to
              our data handling practices. We are not responsible for any user
              generated content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => agreeRegisterNewbie()} loading={isLoading}>
              동의함
            </Button>
            <Button onClick={() => router.push("/login")}>동의하지 않음</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
