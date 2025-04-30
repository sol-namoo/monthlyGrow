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
import { Target } from "lucide-react";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { signInWithPopup, User } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db, googleProvider } from "@/lib/firebase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  let newUser: User;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      newUser = user;

      console.log("✅ 계정 인증 성공:", user.uid, user.displayName);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        console.log("새로운 사용자임을 감지했습니다. 약관 동의를 위한 모달을 엽니다.");
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
    }finally{
    setIsLoading(false);
    router.push(
      "/home"
    );
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
          <div className="mt-6">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogin}
                loading={isLoading}
              >
                Google로 로그인 / 회원가입
              </Button>
            </div>
          </div>
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
            <Button onClick={() => agreeRegisterNewbie()} loading={isLoading}>동의함</Button>
            <Button onClick={() => router.push("/login")}>
              동의하지 않음
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
