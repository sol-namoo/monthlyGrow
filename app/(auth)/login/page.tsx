"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";
import Link from "next/link";

import { signInWithPopup, User } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Dialog } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("✅ 계정 인증 성공:", user.uid, user.displayName);
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      console.log("Firestore에 아직 정보가 없으니 약관 모달 오픈");
      // Todo: 약관 동의 후 등록
      registerNewbie(user);
      // Todo: 홈으로 리다이렉트 후 사용방법 안내 세션
      router.push("/home");
    } else {
      console.log("정상 로그인 → 홈으로 이동");
      router.push("/home");
    }
  };

  const registerNewbie = async (user: User) => {
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        displayName: user.displayName,
        email: user.email,
        photoUrl: user.photoURL,
      },
      { merge: true }
    );
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
          <div className="mt-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogin}
              >
                Google로 로그인 / 회원가입
              </Button>
              {/* <Button variant="outline" className="w-full">
                카카오로 계속하기
              </Button>
              <Button variant="outline" className="w-full">
                네이버로 계속하기
              </Button> */}
            </div>
          </div>

          {/* <div className="mt-6 text-center text-sm">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              회원가입
            </Link>
          </div> */}
        </Card>
      </div>

      {/* <Dialog>
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="username">사용자 이름</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="사용자 이름 입력"
                className="mt-1"
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="이메일 주소 입력"
                className="mt-1"
                required
              />
            </div>

            <div className="mb-4">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="비밀번호 입력"
                className="mt-1"
                required
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                placeholder="비밀번호 다시 입력"
                className="mt-1"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              회원가입
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button variant="outline" className="w-full">
                Google로 계속하기
              </Button>
              <Button variant="outline" className="w-full">
                카카오로 계속하기
              </Button>
              <Button variant="outline" className="w-full">
                네이버로 계속하기
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center text-sm">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              로그인
            </Link>
          </div>
        </Card>
      </Dialog> */}
    </div>
  );
}
