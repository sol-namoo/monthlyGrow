"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronLeft, Star } from "lucide-react"
import Link from "next/link"

export default function LoopSummaryPage() {
  const [reflection, setReflection] = useState("")
  const [rewardClaimed, setRewardClaimed] = useState(false)

  // 샘플 데이터
  const loopData = {
    title: "5월 루프: 건강 관리",
    reward: "새 운동화 구매",
    progress: 85,
    total: 100,
    startDate: "2025년 5월 1일",
    endDate: "2025년 5월 31일",
    projects: [
      { title: "아침 운동 습관화", completed: 25, total: 30 },
      { title: "식단 관리 앱 개발", completed: 10, total: 12 },
      { title: "명상 습관 만들기", completed: 15, total: 20 },
    ],
    previousReflections: [
      {
        date: "2025년 5월 15일",
        content:
          "중간 회고: 아침 운동은 꾸준히 진행 중이지만, 식단 관리가 어려움을 겪고 있다. 앞으로 2주 동안은 식단 관리에 더 집중해야겠다.",
      },
      {
        date: "2025년 5월 8일",
        content:
          "첫 주 회고: 아침에 일어나는 것이 가장 어려운 부분이었다. 알람을 침대에서 멀리 두는 방법을 시도해봐야겠다.",
      },
    ],
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">월간 회고</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-4 text-xl font-bold">{loopData.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>보상: {loopData.reward}</span>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {loopData.progress}%</span>
            <span>
              {loopData.progress}/{loopData.total}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-value" style={{ width: `${loopData.progress}%` }}></div>
          </div>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">프로젝트 달성 현황</h2>
        <div className="space-y-3">
          {loopData.projects.map((project, index) => (
            <Card key={index} className="p-4">
              <h3 className="mb-2 font-medium">{project.title}</h3>
              <div className="mb-1 flex justify-between text-sm">
                <span>달성률: {Math.round((project.completed / project.total) * 100)}%</span>
                <span>
                  {project.completed}/{project.total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{
                    width: `${Math.round((project.completed / project.total) * 100)}%`,
                  }}
                ></div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">이전 회고</h2>
        <Accordion type="single" collapsible className="w-full">
          {loopData.previousReflections.map((reflection, index) => (
            <AccordionItem key={index} value={`reflection-${index}`}>
              <AccordionTrigger className="text-sm font-medium">{reflection.date}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground">{reflection.content}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">활동 분석</h2>
        <Card className="p-4">
          <div className="flex justify-center">
            <div className="h-64 w-full rounded-lg bg-secondary p-4 text-center flex items-center justify-center">
              <p className="text-muted-foreground">활동 분석 차트가 표시됩니다</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">자유 회고</h2>
        <Card className="p-4">
          <Textarea
            placeholder="이번 루프에서 배운 점, 어려웠던 점, 다음 루프에 적용할 점 등을 자유롭게 작성해보세요."
            className="min-h-32"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
          />
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">보상 받기</h2>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium">{loopData.reward}</h3>
              <p className="text-sm text-muted-foreground">달성률 {loopData.progress}%로 보상을 받을 수 있습니다.</p>
            </div>
            <Button onClick={() => setRewardClaimed(true)} disabled={rewardClaimed}>
              {rewardClaimed ? "받음" : "받기"}
            </Button>
          </div>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/loop/new">새 루프 시작하기</Link>
        </Button>
      </div>
    </div>
  )
}
