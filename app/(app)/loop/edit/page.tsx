"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronLeft, Calendar, Info } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

export default function EditNextLoopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const monthParam = searchParams.get("month")

  // 현재 날짜 정보
  const currentDate = new Date()

  // 월 파라미터에서 날짜 정보 추출
  const getMonthInfo = () => {
    if (!monthParam) return { year: currentDate.getFullYear(), month: currentDate.getMonth() + 1 }

    const [year, month] = monthParam.split("-").map(Number)
    return { year, month }
  }

  const { year, month } = getMonthInfo()
  const monthName = new Date(year, month - 1, 1).toLocaleString("ko-KR", { month: "long" })

  // 샘플 데이터 - 실제로는 API에서 가져와야 함
  const [loop, setLoop] = useState({
    id: "next",
    title: `${monthName} 루프: 독서 습관`,
    reward: "만화책 사기",
    startDate: `${year}-${String(month).padStart(2, "0")}-01`,
    endDate: new Date(year, month, 0).toISOString().split("T")[0], // 해당 월의 마지막 날
    areas: ["자기계발", "지식", "창의성"],
    projects: [
      { id: 10, title: "매일 30분 독서하기", progress: 0, total: 30 },
      { id: 11, title: "독서 노트 작성", progress: 0, total: 15 },
      { id: 12, title: "도서관 정기 방문", progress: 0, total: 4 },
    ],
  })

  // 수정 가능한 필드 상태
  const [title, setTitle] = useState(loop.title)
  const [reward, setReward] = useState(loop.reward)

  // 루프 시작일이 지났는지 확인
  const hasLoopStarted = () => {
    const startDate = new Date(loop.startDate)
    return currentDate >= startDate
  }

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 여기서 데이터 처리 로직 구현
    router.push("/loop")
  }

  // 시작일이 지났으면 루프 페이지로 리다이렉트
  useEffect(() => {
    if (hasLoopStarted()) {
      router.push("/loop")
    }
  }, [])

  if (hasLoopStarted()) {
    return null // 리다이렉트 중이므로 아무것도 렌더링하지 않음
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">다음 루프 수정</h1>
      </div>

      <Alert className="mb-6 bg-purple-50 border-purple-200">
        <Info className="h-4 w-4 text-purple-500" />
        <AlertTitle className="text-purple-700">다음 루프 수정</AlertTitle>
        <AlertDescription className="text-purple-700">
          다음 루프는 시작일({new Date(loop.startDate).toLocaleDateString("ko-KR")}) 전까지 모든 항목을 자유롭게 수정할
          수 있습니다.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4 border-purple-200">
          <div className="mb-4">
            <Label htmlFor="title">루프 제목</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" required />
          </div>

          <div className="mb-4">
            <Label htmlFor="reward">달성 보상</Label>
            <Input id="reward" value={reward} onChange={(e) => setReward(e.target.value)} className="mt-1" required />
            <p className="mt-1 text-xs text-muted-foreground">루프를 완료했을 때 자신에게 줄 보상을 설정하세요.</p>
          </div>

          <div className="mb-4">
            <Label>루프 기간</Label>
            <div className="mt-1 flex items-center gap-2 rounded-md border p-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(loop.startDate).toLocaleDateString("ko-KR")} ~{" "}
                {new Date(loop.endDate).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-4 border-purple-200">
          <h2 className="mb-4 text-lg font-semibold">중점 Areas</h2>

          <div className="flex flex-wrap gap-2">
            {loop.areas.map((area, index) => (
              <Badge key={index} variant="secondary" className="bg-purple-100">
                {area}
              </Badge>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full">
              Areas 수정
            </Button>
          </div>
        </Card>

        <Card className="mb-6 p-4 border-purple-200">
          <h2 className="mb-4 text-lg font-semibold">연결된 프로젝트</h2>

          <div className="space-y-2">
            {loop.projects.map((project) => (
              <div key={project.id} className="rounded-lg bg-purple-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span>{project.title}</span>
                  <span>목표: {project.total}회</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button variant="outline" size="sm" className="w-full">
              프로젝트 추가/제거
            </Button>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            변경사항 저장
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/loop">취소</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
