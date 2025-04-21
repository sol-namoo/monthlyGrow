"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronLeft, Clock, Plus, Timer, Trash2, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const [newTask, setNewTask] = useState("")
  const [tasks, setTasks] = useState([
    { id: 1, title: "30분 조깅하기", completed: true, timeSpent: 35, date: "2025-05-01" },
    { id: 2, title: "스트레칭 10분", completed: true, timeSpent: 12, date: "2025-05-01" },
    { id: 3, title: "아침 6시 기상", completed: false, timeSpent: 0, date: "2025-05-02" },
    { id: 4, title: "물 2L 마시기", completed: false, timeSpent: 0, date: "2025-05-02" },
    { id: 5, title: "헬스장 가기", completed: false, timeSpent: 0, date: "2025-05-03" },
    { id: 6, title: "단백질 섭취하기", completed: false, timeSpent: 0, date: "2025-05-03" },
    { id: 7, title: "스트레칭 10분", completed: false, timeSpent: 0, date: "2025-05-04" },
    { id: 8, title: "물 2L 마시기", completed: false, timeSpent: 0, date: "2025-05-04" },
  ])
  const [isTracking, setIsTracking] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [visibleTasks, setVisibleTasks] = useState(4)
  const taskListRef = useRef<HTMLDivElement>(null)

  // 샘플 데이터
  const project = {
    id: params.id,
    title: "아침 운동 습관화",
    progress: 18,
    total: 30,
    area: "건강",
    dueDate: "2025년 5월 31일",
    description: "매일 아침 운동 습관을 만들어 건강한 생활 패턴을 형성합니다.",
    status: "in_progress" as const,
    connectedLoops: [
      {
        id: 1,
        title: "5월 루프: 건강 관리",
        status: "진행 중",
        progress: 65,
        total: 100,
        startDate: "2025년 5월 1일",
        endDate: "2025년 5월 31일",
      },
      {
        id: 2,
        title: "4월 루프: 생활 습관 개선",
        status: "완료",
        progress: 90,
        total: 100,
        startDate: "2025년 4월 1일",
        endDate: "2025년 4월 30일",
        reflection: true,
      },
    ],
  }

  // 날짜별로 태스크 그룹화
  const groupedTasks = tasks.reduce(
    (groups, task) => {
      if (!groups[task.date]) {
        groups[task.date] = []
      }
      groups[task.date].push(task)
      return groups
    },
    {} as Record<string, typeof tasks>,
  )

  // 날짜 포맷팅 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(date)
  }

  // 무한 스크롤 처리
  useEffect(() => {
    const handleScroll = () => {
      if (taskListRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = taskListRef.current
        if (scrollTop + clientHeight >= scrollHeight - 20 && visibleTasks < tasks.length) {
          setVisibleTasks((prev) => Math.min(prev + 4, tasks.length))
        }
      }
    }

    const currentRef = taskListRef.current
    if (currentRef) {
      currentRef.addEventListener("scroll", handleScroll)
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll)
      }
    }
  }, [visibleTasks, tasks.length])

  const addTask = () => {
    if (newTask.trim()) {
      const today = new Date().toISOString().split("T")[0]
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          title: newTask,
          completed: false,
          timeSpent: 0,
          date: today,
        },
      ])
      setNewTask("")
    }
  }

  const toggleTask = (id: number) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const removeTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const startTracking = (id: number) => {
    setIsTracking(true)
    setActiveTaskId(id)
  }

  const stopTracking = () => {
    setIsTracking(false)
    setActiveTaskId(null)
  }

  const completedTasks = tasks.filter((task) => task.completed).length
  const totalTasks = tasks.length
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/project">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 상세</h1>
      </div>

      <Card className="mb-6 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold">{project.title}</h2>
          <Badge variant={project.status === "in_progress" ? "default" : "secondary"}>
            {project.status === "in_progress" ? "실행 중" : "계획 중"}
          </Badge>
        </div>
        <p className="mb-4 text-muted-foreground">{project.description}</p>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>진행률: {progressPercentage}%</span>
            <span>
              {completedTasks}/{totalTasks} 작업
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-value" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>마감일: {project.dueDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{project.area}</Badge>
          </div>
        </div>
      </Card>

      {/* 연결된 루프 섹션 */}
      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">연결된 루프</h2>
        <div className="space-y-3">
          {project.connectedLoops.map((loop) => (
            <Card key={loop.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{loop.title}</h3>
                    <Badge variant={loop.status === "진행 중" ? "default" : "secondary"}>{loop.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {loop.startDate} ~ {loop.endDate}
                  </p>
                </div>
              </div>

              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs">
                  <span>달성률: {Math.round((loop.progress / loop.total) * 100)}%</span>
                  <span>
                    {loop.progress}/{loop.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-value"
                    style={{ width: `${Math.round((loop.progress / loop.total) * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/loop/${loop.id}`}>
                    {loop.reflection ? "회고 보기" : "루프 상세"}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">작업 목록</h2>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm">
            {completedTasks}/{totalTasks}
          </span>
        </div>

        <div className="mb-4 flex gap-2">
          <Input
            placeholder="새 작업 추가..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <Button onClick={addTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4" ref={taskListRef} style={{ maxHeight: "400px", overflowY: "auto" }}>
          <Accordion type="multiple" className="w-full">
            {Object.entries(groupedTasks).map(([date, dateTasks], index) => (
              <AccordionItem key={date} value={date}>
                <AccordionTrigger className="text-sm font-medium">
                  {formatDate(date)} ({dateTasks.filter((t) => t.completed).length}/{dateTasks.length})
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {dateTasks.map((task) => (
                      <Card key={task.id} className={`p-3 ${task.completed ? "bg-primary/5" : ""}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} />
                            <span className={task.completed ? "text-muted-foreground line-through" : ""}>
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {task.timeSpent > 0 && (
                              <span className="text-xs text-muted-foreground">{task.timeSpent}분</span>
                            )}
                            {!isTracking && !task.completed && (
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => startTracking(task.id)}
                              >
                                <Timer className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeTask(task.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {isTracking && (
        <div className="fixed bottom-20 left-0 right-0 bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div>
            <p className="text-sm">시간 기록 중...</p>
            <p className="font-bold">{tasks.find((t) => t.id === activeTaskId)?.title}</p>
          </div>
          <Button variant="secondary" onClick={stopTracking}>
            중지
          </Button>
        </div>
      )}
    </div>
  )
}
