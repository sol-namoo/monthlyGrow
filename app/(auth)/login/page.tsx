"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Target } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 로그인 로직 구현
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <Target className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">루프</h1>
          <p className="text-muted-foreground">월간 루프 기반 자기계발 앱</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 주소 입력"
                className="mt-1"
                required
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="mt-1"
                required
              />
              <div className="mt-1 text-right">
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full">
              로그인
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
            계정이 없으신가요?{" "}
            <Link href="/register" className="font-medium text-primary hover:underline">
              회원가입
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
