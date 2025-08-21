"use client";

import type React from "react";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
import { Target, Mail, Lock, Eye, EyeOff, Globe } from "lucide-react";

import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  signInWithPopup,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db, googleAuthProvider } from "@/lib/firebase/index";
import { createUser, updateUserSettings } from "@/lib/firebase/users";
import Link from "next/link";
import Loading from "@/components/feedback/Loading";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLanguage } from "@/hooks/useLanguage";
import { Language } from "@/lib/translations";

export default function LoginPage() {
  const router = useRouter();
  const { translate, currentLanguage } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  let newUser: User;

  // 인증 상태 확인 (자동 리다이렉션 없이)
  const [user, loading, authError] = useAuthState(auth);

  // 이미 로그인된 경우 홈으로 리다이렉션 (회원가입 중이 아닐 때만)
  useEffect(() => {
    if (user && !loading && !isSigningUp) {
      router.push("/home");
    }
  }, [user, loading, router, isSigningUp]);

  // 로딩 중인 경우에만 로딩 화면 표시
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // 인증 에러가 발생한 경우
  if (authError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="mt-2">
            <div className="space-y-4">
              <p>{translate("login.authError")}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {translate("login.refreshButton")}
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 이미 로그인된 경우 로딩 화면 표시
  if (user) {
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
      console.log("🔍 사용자 정보 상세:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerId,
        isAnonymous: user.isAnonymous,
      });

      // Google Identity Toolkit 응답 구조 확인
      console.log("🔍 전체 사용자 객체:", user);
      console.log("🔍 사용자 객체의 모든 속성:", Object.keys(user));

      // providerData 확인 (Google 로그인의 경우)
      if (user.providerData && user.providerData.length > 0) {
        console.log("🔍 Provider Data:", user.providerData[0]);
      }
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log(
          "새로운 사용자임을 감지했습니다. 약관 동의를 위한 모달을 엽니다."
        );
        setShowTermsModal(true);
      } else {
        // 기존 사용자의 경우 로그인 전 언어 설정을 Firestore에 반영
        const preLoginLang = localStorage.getItem("preLoginLanguage");
        if (preLoginLang) {
          try {
            await updateUserSettings(user.uid, {
              language: preLoginLang as Language,
            });
            localStorage.removeItem("preLoginLanguage"); // 사용 후 제거
            console.log(
              "✅ 로그인 전 언어 설정을 Firestore에 반영:",
              preLoginLang
            );
          } catch (error) {
            console.warn("언어 설정 업데이트 실패:", error);
          }
        }
        console.log("정상 로그인 → 홈으로 이동");
        router.push("/home");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 샘플 유저 로그인 핸들러
  const handleSampleUserLogin = async (language: "ko" | "en") => {
    setIsLoading(true);
    try {
      const sampleUsers = {
        ko: {
          email: process.env.NEXT_PUBLIC_SAMPLE_USER_KO_EMAIL || "",
          password: process.env.NEXT_PUBLIC_SAMPLE_USER_KO_PASSWORD || "",
          language: "ko" as Language,
        },
        en: {
          email: process.env.NEXT_PUBLIC_SAMPLE_USER_EN_EMAIL || "",
          password: process.env.NEXT_PUBLIC_SAMPLE_USER_EN_PASSWORD || "",
          language: "en" as Language,
        },
      };

      const sampleUser = sampleUsers[language];

      // Firebase Auth로 로그인
      const result = await signInWithEmailAndPassword(
        auth,
        sampleUser.email,
        sampleUser.password
      );

      const user = result.user;

      console.log("✅ 샘플 유저 로그인 성공:", user.uid, user.email);

      // 언어 설정 저장
      localStorage.setItem("preLoginLanguage", language);

      // 홈으로 이동
      router.push("/onboarding");
    } catch (error: any) {
      console.error("❌ 샘플 유저 로그인 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const agreeRegisterNewbie = async () => {
    setIsLoading(true);

    try {
      const userRef = doc(db, "users", newUser.uid);

      // 로그인 전 언어 설정 가져오기
      const preLoginLang = localStorage.getItem("preLoginLanguage");

      await setDoc(
        userRef,
        {
          displayName: newUser.displayName,
          email: newUser.email,
          photoUrl: newUser.photoURL,
          settings: {
            language: preLoginLang || "en",
          },
        },
        { merge: true }
      );

      if (preLoginLang) {
        localStorage.removeItem("preLoginLanguage"); // 사용 후 제거
        console.log("✅ 새 사용자 언어 설정 반영:", preLoginLang);
      }

      console.log("✅ 기본 사용자 문서 생성 완료");
    } finally {
      setIsLoading(false);
      // 온보딩 페이지로 이동
      router.push("/onboarding");
    }
  };

  // 이메일/비밀번호 회원가입
  const handleEmailSignUp = async () => {
    setIsLoading(true);
    setIsSigningUp(true);
    setFormError("");

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;
      newUser = user;

      console.log("✅ 이메일 회원가입 성공:", user.uid, user.email);
      console.log("🔍 이메일 사용자 정보 상세:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerId,
        isAnonymous: user.isAnonymous,
      });

      // 새로 가입한 사용자의 경우 언어 설정을 Firestore에 반영
      const preLoginLang = localStorage.getItem("preLoginLanguage");
      if (preLoginLang) {
        try {
          await updateUserSettings(user.uid, {
            language: preLoginLang as Language,
          });
          localStorage.removeItem("preLoginLang"); // 사용 후 제거
          console.log("✅ 이메일 회원가입 시 언어 설정 반영:", preLoginLang);
        } catch (error) {
          console.warn("언어 설정 업데이트 실패:", error);
        }
      }

      // 새로 가입한 사용자는 항상 온보딩 페이지로 이동
      console.log("새로 가입한 사용자입니다. 온보딩 페이지로 이동합니다.");
      router.push("/onboarding");
    } catch (error: any) {
      console.error("❌ 이메일 회원가입 실패:", error);
      setFormError(getAuthErrorMessage(error.code));
      setIsSigningUp(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 이메일/비밀번호 로그인
  const handleEmailSignIn = async () => {
    setIsLoading(true);
    setFormError("");

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      console.log("✅ 이메일 로그인 성공:", user.uid, user.email);
      console.log("🔍 이메일 로그인 사용자 정보 상세:", {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerId,
        isAnonymous: user.isAnonymous,
      });

      // 사용자 문서가 존재하는지 확인하고, 없으면 온보딩 페이지로 이동
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log(
          "새로운 이메일 사용자임을 감지했습니다. 온보딩 페이지로 이동합니다."
        );
        router.push("/onboarding");
      } else {
        console.log("기존 사용자입니다. 홈으로 이동합니다.");
        router.push("/home");
      }
    } catch (error: any) {
      console.error("❌ 이메일 로그인 실패:", error);
      setFormError(getAuthErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Auth 에러 메시지 변환
  const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case "auth/user-not-found":
        return translate("login.userNotFound");
      case "auth/wrong-password":
        return translate("login.wrongPassword");
      case "auth/invalid-credential":
        return translate("login.invalidCredential");
      case "auth/email-already-in-use":
        return translate("login.emailAlreadyInUse");
      case "auth/weak-password":
        return translate("login.weakPassword");
      case "auth/invalid-email":
        return translate("login.invalidEmail");
      case "auth/too-many-requests":
        return translate("login.tooManyRequests");
      case "auth/user-disabled":
        return translate("login.userDisabled");
      case "auth/operation-not-allowed":
        return translate("login.operationNotAllowed");
      case "auth/network-request-failed":
        return translate("login.networkRequestFailed");
      default:
        return translate("login.defaultError");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      {/* Language Toggle */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center bg-card border rounded-lg p-1 shadow-sm">
          <button
            onClick={() => {
              localStorage.setItem("preLoginLanguage", "ko");
              window.location.reload();
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentLanguage === "ko"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            한국어
          </button>
          <button
            onClick={() => {
              localStorage.setItem("preLoginLanguage", "en");
              window.location.reload();
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              currentLanguage === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <Target className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">{translate("login.title")}</h1>
          <p className="text-muted-foreground">{translate("login.subtitle")}</p>
        </div>

        <Card className="p-6">
          {!isEmailMode ? (
            // Google 로그인 모드
            <div>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {translate("login.googleLogin")}
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {translate("login.or")}
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
                  {translate("login.emailLogin")}
                </Button>
              </div>

              {/* 샘플 유저 로그인 섹션 */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="text-center mb-4">
                  <span className="text-xs text-muted-foreground bg-card px-2">
                    {translate("login.sampleUserSection")}
                  </span>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50"
                    onClick={() => handleSampleUserLogin("ko")}
                    disabled={isLoading}
                  >
                    {translate("login.sampleUserKorean")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm border border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-muted/50"
                    onClick={() => handleSampleUserLogin("en")}
                    disabled={isLoading}
                  >
                    {translate("login.sampleUserEnglish")}
                  </Button>
                </div>

                {/* 사용방법 미리보기 버튼 */}
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-sm border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
                    onClick={() => router.push("/onboarding")}
                    disabled={isLoading}
                  >
                    <svg
                      className="mr-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    {translate("login.previewButton")}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // 이메일 로그인 모드
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{translate("login.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={translate("login.emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{translate("login.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={translate("login.passwordPlaceholder")}
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

              {formError && (
                <div className="text-sm text-red-500">{formError}</div>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleEmailSignIn}
                  disabled={isLoading || !email || !password}
                >
                  {translate("login.loginButton")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEmailSignUp}
                  disabled={isLoading || !email || !password}
                >
                  {translate("login.signupButton")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsEmailMode(false);
                    setEmail("");
                    setPassword("");
                    setFormError("");
                  }}
                  disabled={isLoading}
                >
                  {translate("login.backToGoogle")}
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
