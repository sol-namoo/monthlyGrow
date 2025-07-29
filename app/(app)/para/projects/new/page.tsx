"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  AlertCircle,
  Plus,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/feedback/Loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 loopId와 addedMidway 값을 가져옴
  const loopId = searchParams.get("loopId");
  const addedMidway = searchParams.get("addedMidway") === "true";
  const returnUrl = searchParams.get("returnUrl");

  const [showLoopConnectionDialog, setShowLoopConnectionDialog] =
    useState(false);
  const [createdProjectData, setCreatedProjectData] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    area: "",
    loop: "", // 루프 연결은 하지 않음
    startDate: "",
    dueDate: "",
    targetCount: "",
    status: "planned",
  });

  const [tasks, setTasks] = useState([
    { id: 1, title: "", date: "", duration: 1, done: false },
  ]);

  // 샘플 데이터 - 현재 루프 정보 (loopId가 있는 경우)
  const currentLoop = loopId
    ? {
        id: loopId,
        title: "5월 루프: 건강 관리",
        projectCount: 4, // 현재 루프에 연결된 프로젝트 수
      }
    : null;

  // 샘플 데이터
  const areas = [
    { id: "health", name: "건강" },
    { id: "career", name: "커리어" },
    { id: "relationships", name: "인간관계" },
    { id: "finance", name: "재정" },
    { id: "personal", name: "자기계발" },
    { id: "fun", name: "취미/여가" },
  ];

  // 실제 생성된 루프만 표시 (아직 생성되지 않은 루프는 제외)
  const loops = [
    { id: "1", name: "5월 루프: 건강 관리", projectCount: 4 },
    { id: "none", name: "루프에 포함하지 않음", projectCount: 0 },
  ];

  // 루프 프로젝트 개수 제한 확인
  const selectedLoop = loops.find((loop) => loop.id === formData.loop);
  const isLoopFull =
    selectedLoop &&
    selectedLoop.id !== "none" &&
    selectedLoop.projectCount >= 5;

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const addTask = () => {
    const newId = Math.max(...tasks.map((t) => t.id), 0) + 1;
    setTasks([
      ...tasks,
      { id: newId, title: "", date: "", duration: 1, done: false },
    ]);
  };

  const removeTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const updateTask = (
    taskId: number,
    field: string,
    value: string | number | boolean
  ) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 프로젝트 생성 로직 (실제 구현에서는 API 호출)
    const projectData = {
      ...formData,
      tasks,
      createdAt: new Date(),
    };

    console.log("프로젝트 생성:", projectData);

    // 기존 루프에 연결하는 경우
    if (formData.loop && formData.loop !== "none") {
      console.log("기존 루프에 연결:", formData.loop);
      // 실제 구현에서는:
      // 1. 프로젝트 생성
      // 2. 루프의 projectIds 배열에 프로젝트 ID 추가
      // 3. 프로젝트의 loopId 필드 업데이트
    }

    // 원래 페이지로 복귀 (모든 파라미터 포함)
    if (returnUrl) {
      const params = new URLSearchParams();

      // returnUrl의 모든 파라미터를 그대로 전달
      const returnUrlParams = new URLSearchParams(
        returnUrl.split("?")[1] || ""
      );
      returnUrlParams.forEach((value, key) => {
        params.set(key, value);
      });

      // 프로젝트 생성 완료 표시
      params.set("projectCreated", "true");

      router.push(`${returnUrl.split("?")[0]}?${params.toString()}`);
    } else {
      // 기본적으로 PARA 페이지로 이동
      router.push("/para?tab=projects");
    }
  };

  const handleLoopConnection = (connectToLoop: boolean) => {
    setShowLoopConnectionDialog(false);

    if (connectToLoop && loopId) {
      console.log("루프에 프로젝트 연결:", loopId);
    }

    // 원래 페이지로 복귀 (모든 파라미터 포함)
    if (returnUrl) {
      const params = new URLSearchParams();

      // returnUrl의 모든 파라미터를 그대로 전달
      const returnUrlParams = new URLSearchParams(
        returnUrl.split("?")[1] || ""
      );
      returnUrlParams.forEach((value, key) => {
        params.set(key, value);
      });

      // 프로젝트 생성 완료 표시
      params.set("projectCreated", "true");

      router.push(`${returnUrl.split("?")[0]}?${params.toString()}`);
    } else {
      router.push("/para?tab=projects");
    }
  };

  const calculateDuration = (dueDate: string) => {
    const startDate = new Date(formData.startDate);
    const endDate = new Date(dueDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateWeeklyAverage = (targetCount: string) => {
    const count = parseInt(targetCount);
    if (isNaN(count) || count <= 0) return 0;
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.dueDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeklyAverage = diffDays > 0 ? count / diffDays : 0;
    return weeklyAverage;
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <AlertCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">
          새로운 프로젝트를 만들어보세요
        </h2>
        <p className="text-sm text-muted-foreground">
          프로젝트는 특정 목표를 달성하기 위한 구체적인 계획입니다. 단계별
          태스크를 설정하고 기한을 정해 체계적으로 진행해보세요.
        </p>
      </div>

      {currentLoop && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>현재 루프에 추가</AlertTitle>
          <AlertDescription>
            {currentLoop.title}에 새로운 프로젝트를 추가합니다. (현재{" "}
            {currentLoop.projectCount}/5개)
          </AlertDescription>
        </Alert>
      )}

      {addedMidway && currentLoop && (
        <Alert className="mb-6 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">
            루프 중간에 추가되는 프로젝트
          </AlertTitle>
          <AlertDescription className="text-amber-600">
            이 프로젝트는 <Badge variant="secondary">{currentLoop.title}</Badge>
            에 중간에 추가되는 프로젝트로 표시됩니다. 월말 리포트에서 '후속 투입
            항목'으로 별도 집계됩니다.
          </AlertDescription>
        </Alert>
      )}

      {isLoopFull && (
        <Alert className="mb-6 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">
            루프 프로젝트 개수 초과
          </AlertTitle>
          <AlertDescription className="text-red-600">
            선택한 루프에는 이미 5개의 프로젝트가 있습니다. 다른 루프를
            선택하거나 루프에 포함하지 않음을 선택하세요.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="title">프로젝트 제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 아침 운동 습관화"
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="프로젝트에 대한 간략한 설명을 입력하세요."
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="area">영역 (Area)</Label>
            <Select onValueChange={(value) => handleChange("area", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="영역 선택" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="loop">루프 연결</Label>
            <Select
              onValueChange={(value) => handleChange("loop", value)}
              defaultValue={formData.loop}
              disabled={loopId !== null}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="루프 선택" />
              </SelectTrigger>
              <SelectContent>
                {loops.map((loop) => (
                  <SelectItem
                    key={loop.id}
                    value={loop.id}
                    disabled={loop.id !== "none" && loop.projectCount >= 5}
                  >
                    {loop.name}{" "}
                    {loop.id !== "none" && `(${loop.projectCount}/5)`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              프로젝트를 특정 루프에 연결하거나 독립적으로 관리할 수 있습니다.
              {loopId &&
                " 루프 상세 페이지에서 생성 시 자동으로 해당 루프에 연결됩니다."}
            </p>
          </div>

          <div className="mb-4">
            <Label htmlFor="startDate">시작일</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="dueDate">목표 완료일</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              권장 기간: 2~8주 (루프 1~2개 분량)
            </p>
            {formData.dueDate && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-700">
                  📅 예상 기간: {calculateDuration(formData.dueDate)}일
                  {calculateDuration(formData.dueDate) > 56 && (
                    <span className="block text-amber-600 font-medium">
                      ⚠️ 장기 프로젝트입니다. 더 작은 단위로 나누는 것을
                      고려해보세요.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="targetCount">목표 횟수</Label>
            <Input
              id="targetCount"
              type="number"
              value={formData.targetCount}
              onChange={(e) =>
                setFormData({ ...formData, targetCount: e.target.value })
              }
              placeholder="예: 30"
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              권장: 3~10회 (일주일에 2회 이상이면 루프 집중에 도움이 돼요)
            </p>
            {formData.targetCount && (
              <div className="mt-2 p-2 bg-green-50 rounded-md">
                <p className="text-xs text-green-700">
                  📊 주당 평균: {calculateWeeklyAverage(formData.targetCount)}회
                  {calculateWeeklyAverage(formData.targetCount) < 2 && (
                    <span className="block text-amber-600 font-medium">
                      💡 더 자주 진행하면 습관 형성에 도움이 됩니다.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="status">상태</Label>
            <Select onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">예정</SelectItem>
                <SelectItem value="in_progress">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* 태스크 관리 섹션 */}
        <Card className="mb-6 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">태스크 관리</h2>
            <Button type="button" variant="outline" size="sm" onClick={addTask}>
              <Plus className="mr-2 h-4 w-4" />
              태스크 추가
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div key={task.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground flex-1">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={(e) =>
                        updateTask(task.id, "done", e.target.checked)
                      }
                      className="rounded"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(task.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor={`title-${task.id}`}
                      className="text-sm text-muted-foreground"
                    >
                      제목
                    </Label>
                    <Input
                      id={`title-${task.id}`}
                      value={task.title}
                      onChange={(e) =>
                        updateTask(task.id, "title", e.target.value)
                      }
                      placeholder="태스크 제목"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label
                        htmlFor={`date-${task.id}`}
                        className="text-sm text-muted-foreground"
                      >
                        시작일
                      </Label>
                      <Input
                        id={`date-${task.id}`}
                        type="date"
                        value={task.date}
                        onChange={(e) =>
                          updateTask(task.id, "date", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor={`duration-${task.id}`}
                        className="text-sm text-muted-foreground"
                      >
                        소요일
                      </Label>
                      <Input
                        id={`duration-${task.id}`}
                        type="number"
                        value={task.duration}
                        onChange={(e) =>
                          updateTask(
                            task.id,
                            "duration",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min="1"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoopFull}>
          프로젝트 생성
        </Button>
      </form>

      {/* 루프 연결 확인 다이얼로그 */}
      <Dialog
        open={showLoopConnectionDialog}
        onOpenChange={setShowLoopConnectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트를 루프에 연결하시겠습니까?</DialogTitle>
            <DialogDescription>
              새로 생성된 프로젝트를 현재 루프에 연결하면 루프 생성 시 함께
              관리됩니다. 연결하지 않으면 일반 프로젝트로 저장됩니다.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => handleLoopConnection(false)}
              className="sm:order-2"
            >
              연결하지 않음
            </Button>
            <Button
              onClick={() => handleLoopConnection(true)}
              className="sm:order-1"
            >
              루프에 연결
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewProjectPageContent />
    </Suspense>
  );
}
