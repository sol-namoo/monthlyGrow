"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, Filter, Plus, Search } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ProjectPage() {
  // 프로젝트 데이터 모델에 상태 정보를 추가합니다.
  // 샘플 데이터 부분을 수정합니다.

  // 샘플 데이터
  const projects = [
    {
      id: 1,
      title: "아침 운동 습관화",
      progress: 18,
      total: 30,
      area: "건강",
      loop: "5월 루프: 건강 관리",
      loopId: 1,
      dueDate: "2025년 5월 31일",
      status: "in_progress" as const,
    },
    {
      id: 2,
      title: "식단 관리 앱 개발",
      progress: 7,
      total: 12,
      area: "개발",
      loop: "5월 루프: 건강 관리",
      loopId: 1,
      dueDate: "2025년 5월 31일",
      status: "in_progress" as const,
    },
    {
      id: 3,
      title: "명상 습관 만들기",
      progress: 10,
      total: 20,
      area: "마음",
      loop: "5월 루프: 건강 관리",
      loopId: 1,
      dueDate: "2025년 5월 31일",
      status: "in_progress" as const,
    },
    {
      id: 4,
      title: "블로그 글 작성",
      progress: 3,
      total: 8,
      area: "커리어",
      loop: null,
      loopId: null,
      dueDate: "2025년 6월 15일",
      status: "planned" as const,
    },
    {
      id: 5,
      title: "재테크 공부",
      progress: 2,
      total: 10,
      area: "재정",
      loop: null,
      loopId: null,
      dueDate: "2025년 6월 30일",
      status: "planned" as const,
    },
    {
      id: 6,
      title: "외국어 학습",
      progress: 5,
      total: 30,
      area: "자기계발",
      loop: null,
      loopId: null,
      dueDate: "2025년 7월 15일",
      status: "planned" as const,
    },
  ]

  // 필터 상태 추가
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // 필터 함수 추가
  const filteredProjects = statusFilter ? projects.filter((project) => project.status === statusFilter) : projects

  // 프로젝트 표시 개수 제한
  const [displayCount, setDisplayCount] = useState(3)
  const hasMoreProjects = filteredProjects.length > displayCount

  // 필터 버튼 클릭 핸들러
  const handleFilterClick = () => {
    // 필터 순환: null -> "in_progress" -> "planned" -> null
    if (statusFilter === null) {
      setStatusFilter("in_progress")
    } else if (statusFilter === "in_progress") {
      setStatusFilter("planned")
    } else {
      setStatusFilter(null)
    }
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">프로젝트</h1>
        <Button asChild>
          <Link href="/project/new">
            <Plus className="mr-2 h-4 w-4" />새 프로젝트
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="프로젝트 검색..."
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <Button variant="outline" size="icon" onClick={handleFilterClick}>
          <Filter className={`h-4 w-4 ${statusFilter ? "text-primary" : ""}`} />
        </Button>
        {statusFilter && (
          <Badge variant="outline" className="ml-2">
            {statusFilter === "in_progress" ? "실행 중" : "계획 중"}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {filteredProjects.slice(0, displayCount).map((project) => (
          <Card key={project.id} className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold">{project.title}</h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">{project.area}</span>
            </div>

            <div className="mb-3">
              <div className="mb-1 flex justify-between text-sm">
                <span>진행률: {Math.round((project.progress / project.total) * 100)}%</span>
                <span>
                  {project.progress}/{project.total}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{
                    width: `${Math.round((project.progress / project.total) * 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {project.loop ? (
                <Badge className="bg-primary/20 hover:bg-primary/30">{project.loop}</Badge>
              ) : (
                <Badge variant="outline" className="border-dashed">
                  루프 미연결
                </Badge>
              )}

              <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
                {project.status === "in_progress" ? "실행 중" : "계획 중"}
              </Badge>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/project/${project.id}`}>
                  상세 보기
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}

        {hasMoreProjects && (
          <Button variant="outline" className="w-full" onClick={() => setDisplayCount(filteredProjects.length)}>
            {filteredProjects.length - displayCount}개 더 보기
          </Button>
        )}
      </div>
    </div>
  )
}
