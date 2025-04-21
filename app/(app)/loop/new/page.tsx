"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Plus, Trash2, BookOpen, Target, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function NewLoopPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // URL에서 시작 날짜 파라미터 가져오기
  const startDateParam = searchParams.get("startDate")

  const [newProjects, setNewProjects] = useState<{ title: string; goal: string }[]>([{ title: "", goal: "" }])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedExistingProjects, setSelectedExistingProjects] = useState<number[]>([])
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new")
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(false)

  // 루프 제목과 날짜 상태
  const [loopTitle, setLoopTitle] = useState("")
  const [loopReward, setLoopReward] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // 시작 날짜에 따라 루프 제목 자동 생성
  useEffect(() => {
    if (startDateParam) {
      setStartDate(startDateParam)

      // 시작 날짜로부터 월 정보 추출
      try {
        const date = new Date(startDateParam)
        const monthName = date.toLocaleString("ko-KR", { month: "long" })
        setLoopTitle(`${monthName} 루프: `)

        // 종료일 계산 (해당 월의 마지막 날)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        setEndDate(lastDay.toISOString().split("T")[0])
      } catch (e) {
        console.error("날짜 파싱 오류:", e)
      }
    } else {
      // 기본값: 현재 월의 1일부터 말일까지
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(lastDay.toISOString().split("T")[0])

      const monthName = today.toLocaleString("ko-KR", { month: "long" })
      setLoopTitle(`${monthName} 루프: `)
    }
  }, [startDateParam])

  // 샘플 데이터 - 영역(Areas)
  const areas = [
    { id: "health", name: "건강" },
    { id: "career", name: "커리어" },
    { id: "relationships", name: "인간관계" },
    { id: "finance", name: "재정" },
    { id: "personal", name: "자기계발" },
    { id: "fun", name: "취미/여가" },
    { id: "knowledge", name: "지식" },
    { id: "creativity", name: "창의성" },
  ]

  // 샘플 데이터 - 기존 프로젝트
  const existingProjects = [
    {
      id: 1,
      title: "유튜브 채널 기획",
      description: "개인 브랜딩을 위한 유튜브 채널 운영",
      area: "커리어",
      progress: 30,
      total: 100,
      connectedLoop: null,
      recentlyUsed: true,
    },
    {
      id: 2,
      title: "주 3회 헬스장 가기",
      description: "규칙적인 운동 습관 형성",
      area: "건강",
      progress: 50,
      total: 100,
      connectedLoop: "4월 루프: 생활 습관 개선",
      recentlyUsed: true,
    },
    {
      id: 3,
      title: "독서 습관 만들기",
      description: "매일 30분 독서하기",
      area: "자기계발",
      progress: 20,
      total: 100,
      connectedLoop: null,
      recentlyUsed: false,
    },
    {
      id: 4,
      title: "재테크 공부",
      description: "투자 관련 지식 습득",
      area: "재정",
      progress: 10,
      total: 100,
      connectedLoop: null,
      recentlyUsed: false,
    },
  ]

  // 필터링된 프로젝트 계산 로직 추가
  const filteredExistingProjects = showOnlyUnconnected
    ? existingProjects.filter((project) => !project.connectedLoop)
    : existingProjects

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter((id) => id !== areaId))
    } else {
      if (selectedAreas.length < 3) {
        setSelectedAreas([...selectedAreas, areaId])
      }
    }
  }

  const toggleExistingProject = (projectId: number) => {
    if (selectedExistingProjects.includes(projectId)) {
      setSelectedExistingProjects(selectedExistingProjects.filter((id) => id !== projectId))
    } else {
      // 프로젝트 개수 제한 (최대 5개)
      if (totalProjectCount < 5) {
        setSelectedExistingProjects([...selectedExistingProjects, projectId])
      }
    }
  }

  const addNewProject = () => {
    // 프로젝트 개수 제한 (최대 5개)
    if (totalProjectCount < 5) {
      setNewProjects([...newProjects, { title: "", goal: "" }])
    }
  }

  const removeNewProject = (index: number) => {
    if (newProjects.length > 1) {
      setNewProjects(newProjects.filter((_, i) => i !== index))
    }
  }

  const updateNewProject = (index: number, field: "title" | "goal", value: string) => {
    const updatedProjects = [...newProjects]
    updatedProjects[index][field] = value
    setNewProjects(updatedProjects)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 여기서 데이터 처리 로직 구현
    router.push("/loop")
  }

  // 상태 관리 부분에 totalProjectCount 계산 로직 추가
  const totalProjectCount = activeTab === "new" ? newProjects.length : selectedExistingProjects.length

  // 프로젝트 개수 제한 초과 여부
  const isProjectLimitExceeded = totalProjectCount > 5

  // 프로젝트 개수 경고 표시 여부
  const showProjectCountWarning = totalProjectCount > 3

  // 시작 날짜로부터 월 정보 추출
  const getMonthFromDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleString("ko-KR", { month: "long" })
    } catch (e) {
      return "이번 달"
    }
  }

  const monthName = getMonthFromDate(startDate)

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{monthName} 루프 생성</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Target className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="mb-4">
            <Label htmlFor="title">루프 제목</Label>
            <Input
              id="title"
              value={loopTitle}
              onChange={(e) => setLoopTitle(e.target.value)}
              placeholder={`${monthName} 루프: 건강 관리`}
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="reward">달성 보상</Label>
            <Input
              id="reward"
              value={loopReward}
              onChange={(e) => setLoopReward(e.target.value)}
              placeholder="예: 새 운동화 구매"
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">루프를 완료했을 때 자신에게 줄 보상을 설정하세요.</p>
          </div>

          <div className="mb-4">
            <Label>루프 기간</Label>
            <div className="mt-1 flex items-center gap-2 rounded-md border p-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(startDate).toLocaleDateString("ko-KR")} ~ {new Date(endDate).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              루프는 월 단위로 진행되며, {monthName} 한 달 동안 진행됩니다.
            </p>
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">중점 Areas (최대 3개)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {areas.map((area) => (
              <div
                key={area.id}
                className={`flex cursor-pointer items-center justify-center rounded-lg border p-3 text-center transition-colors ${
                  selectedAreas.includes(area.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleArea(area.id)}
              >
                <span className="text-sm">{area.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedAreas.map((areaId) => (
              <Badge key={areaId} variant="secondary">
                {areas.find((a) => a.id === areaId)?.name}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">프로젝트 목표 설정</h2>

          {showProjectCountWarning && (
            <Alert className={`mb-4 ${isProjectLimitExceeded ? "bg-red-50" : "bg-amber-50"}`}>
              <AlertCircle className={isProjectLimitExceeded ? "h-4 w-4 text-red-600" : "h-4 w-4 text-amber-600"} />
              <AlertTitle className={isProjectLimitExceeded ? "text-red-600" : "text-amber-600"}>
                {isProjectLimitExceeded ? "프로젝트 개수 초과" : "프로젝트 개수 주의"}
              </AlertTitle>
              <AlertDescription className={isProjectLimitExceeded ? "text-red-600" : "text-amber-600"}>
                {isProjectLimitExceeded
                  ? "한 루프에는 최대 5개의 프로젝트만 등록할 수 있습니다."
                  : "루프에는 2-3개의 프로젝트를 권장합니다. 현재 " + totalProjectCount + "개가 선택되었습니다."}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="new"
            className="mb-4"
            onValueChange={(value) => setActiveTab(value as "new" | "existing")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">새 프로젝트 생성</TabsTrigger>
              <TabsTrigger value="existing">기존 프로젝트 불러오기</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4 space-y-4">
              {newProjects.map((project, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">프로젝트 {index + 1}</h3>
                    {newProjects.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeNewProject(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="mb-3 mt-2">
                    <Label htmlFor={`project-title-${index}`}>프로젝트 제목</Label>
                    <Input
                      id={`project-title-${index}`}
                      value={project.title}
                      onChange={(e) => updateNewProject(index, "title", e.target.value)}
                      placeholder="예: 아침 운동 습관화"
                      className="mt-1"
                      required={activeTab === "new"}
                    />
                  </div>

                  <div>
                    <Label htmlFor={`project-goal-${index}`}>목표 설정</Label>
                    <Textarea
                      id={`project-goal-${index}`}
                      value={project.goal}
                      onChange={(e) => updateNewProject(index, "goal", e.target.value)}
                      placeholder="예: 매일 아침 30분 운동하기"
                      className="mt-1"
                      required={activeTab === "new"}
                    />
                  </div>
                </Card>
              ))}

              {totalProjectCount < 5 && (
                <Button type="button" variant="outline" className="w-full border-dashed" onClick={addNewProject}>
                  <Plus className="mr-2 h-4 w-4" />
                  프로젝트 추가
                </Button>
              )}

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  새 프로젝트:{" "}
                  <span className={newProjects.length > 3 ? "text-amber-600 font-medium" : ""}>
                    {newProjects.length}/5
                  </span>
                </span>
                <span className="text-muted-foreground">권장 프로젝트: 2-3개</span>
              </div>
            </TabsContent>

            <TabsContent value="existing" className="mt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium">기존 프로젝트 선택</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnlyUnconnected(!showOnlyUnconnected)}
                  className="text-xs"
                >
                  {showOnlyUnconnected ? "모든 프로젝트 보기" : "루프 미연결만 보기"}
                </Button>
              </div>

              <div className="space-y-3">
                {filteredExistingProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-all ${
                      selectedExistingProjects.includes(project.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    } ${totalProjectCount >= 5 && !selectedExistingProjects.includes(project.id) ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => toggleExistingProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedExistingProjects.includes(project.id)}
                          onCheckedChange={() => toggleExistingProject(project.id)}
                          disabled={totalProjectCount >= 5 && !selectedExistingProjects.includes(project.id)}
                        />
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-xs text-muted-foreground">{project.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{project.area}</Badge>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>진행률: {project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-value" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.connectedLoop ? (
                        <Badge className="bg-primary/20 text-xs">{project.connectedLoop}에 연결됨</Badge>
                      ) : (
                        <Badge variant="outline" className="border-dashed text-xs">
                          루프 미연결
                        </Badge>
                      )}

                      {project.recentlyUsed && (
                        <Badge variant="secondary" className="text-xs">
                          최근 사용됨
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}

                {filteredExistingProjects.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {showOnlyUnconnected
                        ? "루프에 연결되지 않은 프로젝트가 없습니다"
                        : "기존 프로젝트를 선택하여 이 루프에 연결하세요"}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  선택된 프로젝트:{" "}
                  <span className={selectedExistingProjects.length > 3 ? "text-amber-600 font-medium" : ""}>
                    {selectedExistingProjects.length}/5
                  </span>
                </span>
                <span className="text-muted-foreground">권장 프로젝트: 2-3개</span>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Button type="submit" className="w-full" disabled={isProjectLimitExceeded || totalProjectCount === 0}>
          {monthName} 루프 시작하기
        </Button>
      </form>
    </div>
  )
}
