"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Archive, Briefcase, ChevronRight, Compass, Folder, Plus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function ParaPage() {
  // 상태 변수 추가 (useState 부분에 추가)
  const [projectStatusFilter, setProjectStatusFilter] = useState("all")
  const [showOnlyInProgress, setShowOnlyInProgress] = useState(false)

  // 샘플 데이터 수정 (프로젝트 데이터)
  const projects = [
    {
      id: 1,
      title: "아침 운동 습관화",
      progress: 18,
      total: 30,
      area: "건강",
      status: "in_progress" as const,
      loopConnection: "5월 루프: 건강 관리",
      nextLoopScheduled: false,
    },
    {
      id: 2,
      title: "식단 관리 앱 개발",
      progress: 7,
      total: 12,
      area: "개발",
      status: "in_progress" as const,
      loopConnection: "5월 루프: 건강 관리",
      nextLoopScheduled: false,
    },
    {
      id: 3,
      title: "명상 습관 만들기",
      progress: 10,
      total: 20,
      area: "마음",
      status: "in_progress" as const,
      loopConnection: "5월 루프: 건강 관리",
      nextLoopScheduled: false,
    },
    {
      id: 4,
      title: "블로그 글 작성",
      progress: 3,
      total: 8,
      area: "커리어",
      status: "planned" as const,
      loopConnection: null,
      nextLoopScheduled: true,
    },
  ]

  // 필터링된 프로젝트 계산 로직 수정
  const filteredProjects = showOnlyInProgress
    ? projects.filter((project) => project.status === "in_progress")
    : projects

  const areas = [
    { id: 1, title: "건강", items: 5 },
    { id: 2, title: "개발", items: 8 },
    { id: 3, title: "마음", items: 3 },
    { id: 4, title: "커리어", items: 6 },
    { id: 5, title: "재정", items: 2 },
    { id: 6, title: "관계", items: 4 },
    { id: 7, title: "취미", items: 3 },
    { id: 8, title: "학습", items: 5 },
  ]

  const resources = [
    { id: 1, title: "운동 루틴 아이디어", type: "노트", date: "2025.05.10" },
    { id: 2, title: "개발 참고 자료", type: "링크 모음", date: "2025.05.08" },
    { id: 3, title: "명상 가이드", type: "PDF", date: "2025.05.05" },
    { id: 4, title: "건강식 레시피", type: "노트", date: "2025.05.03" },
    { id: 5, title: "프로그래밍 강의", type: "동영상", date: "2025.05.01" },
    { id: 6, title: "독서 목록", type: "노트", date: "2025.04.28" },
  ]

  const archives = [
    {
      id: 1,
      title: "4월 루프: 독서 습관",
      type: "루프",
      date: "2025.04.30",
      completed: true,
    },
    {
      id: 2,
      title: "블로그 리뉴얼",
      type: "프로젝트",
      date: "2025.04.15",
      completed: true,
    },
    {
      id: 3,
      title: "3월 루프: 코딩 스킬",
      type: "루프",
      date: "2025.03.31",
      completed: false,
    },
    {
      id: 4,
      title: "포트폴리오 업데이트",
      type: "프로젝트",
      date: "2025.03.15",
      completed: true,
    },
  ]

  // 각 탭별 표시 항목 수 제한
  const [projectsLimit, setProjectsLimit] = useState(3)
  const [areasLimit, setAreasLimit] = useState(4)
  const [resourcesLimit, setResourcesLimit] = useState(3)
  const [archivesLimit, setArchivesLimit] = useState(3)

  // 체크박스 상태 변경 핸들러
  const handleInProgressFilterChange = (checked: boolean) => {
    setShowOnlyInProgress(checked)
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">PARA 시스템</h1>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />새 항목
        </Button>
      </div>

      <Tabs defaultValue="projects" className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>현재 진행 중인 프로젝트</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-in-progress"
                  checked={showOnlyInProgress}
                  onCheckedChange={handleInProgressFilterChange}
                />
                <Label htmlFor="show-in-progress" className="text-sm cursor-pointer">
                  실행 중만 보기
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredProjects.slice(0, projectsLimit).map((project) => (
              <Card key={project.id} className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-medium">{project.title}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs">{project.area}</span>
                </div>

                <div className="mb-2">
                  <div className="mb-1 flex justify-between text-xs">
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

                <div className="mb-2 flex flex-wrap gap-2">
                  {project.status === "in_progress" ? (
                    <Badge className="bg-primary/20 text-xs">실행 중</Badge>
                  ) : project.status === "planned" ? (
                    <Badge variant="outline" className="text-xs">
                      계획 중
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      완료됨
                    </Badge>
                  )}

                  {project.loopConnection ? (
                    <Badge className="bg-primary/10 text-xs">{project.loopConnection}</Badge>
                  ) : project.nextLoopScheduled ? (
                    <Badge variant="outline" className="border-dashed text-xs">
                      다음 루프 예약됨
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      루프 미연결
                    </Badge>
                  )}
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

            {filteredProjects.length > projectsLimit && (
              <Button variant="outline" className="w-full" onClick={() => setProjectsLimit(filteredProjects.length)}>
                {filteredProjects.length - projectsLimit}개 더보기
              </Button>
            )}

            <Button variant="outline" className="mt-2 w-full border-dashed" asChild>
              <Link href="/project/new">
                <Plus className="mr-2 h-4 w-4" />새 프로젝트 추가
              </Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Compass className="h-4 w-4" />
            <span>장기적 관심 영역</span>
          </div>

          <div className="space-y-3">
            {areas.slice(0, areasLimit).map((area) => (
              <Card key={area.id} className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{area.title}</h3>
                  <span className="text-sm text-muted-foreground">{area.items}개 항목</span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/para/areas/${area.id}`}>
                      상세 보기
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {areas.length > areasLimit && (
              <Button variant="outline" className="w-full" onClick={() => setAreasLimit(areas.length)}>
                {areas.length - areasLimit}개 더보기
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>아이디어와 참고 자료</span>
          </div>

          <div className="space-y-3">
            {resources.slice(0, resourcesLimit).map((resource) => (
              <Card key={resource.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{resource.title}</h3>
                    <span className="text-xs text-muted-foreground">{resource.type}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{resource.date}</span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/para/resources/${resource.id}`}>
                      열기
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {resources.length > resourcesLimit && (
              <Button variant="outline" className="w-full" onClick={() => setResourcesLimit(resources.length)}>
                {resources.length - resourcesLimit}개 더보기
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Archive className="h-4 w-4" />
            <span>완료된 항목</span>
          </div>

          <div className="space-y-3">
            {archives.slice(0, archivesLimit).map((archive) => (
              <Card key={archive.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{archive.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{archive.type}</span>
                      <span className={`text-xs ${archive.completed ? "text-green-600" : "text-red-600"}`}>
                        {archive.completed ? "완료" : "미완료"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{archive.date}</span>
                </div>
                <div className="flex justify-end mt-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/para/archives/${archive.id}`}>
                      열기
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}

            {archives.length > archivesLimit && (
              <Button variant="outline" className="w-full" onClick={() => setArchivesLimit(archives.length)}>
                {archives.length - archivesLimit}개 더보기
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
