"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Briefcase, Plus, X, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();

  // 샘플 데이터 로드 (실제 앱에서는 params.id를 사용하여 데이터베이스에서 가져옴)
  const initialProjectData = {
    title: "새로운 웹사이트 개발",
    description: "반응형 디자인과 최신 기술 스택을 활용한 웹사이트 구축",
    status: "completed", // 테스트를 위해 완료 상태로 설정
    area: "개인 성장", // 예시 Area
    startDate: "2025-01-01",
    dueDate: "2025-12-31",
    targetCount: 10,
    loopIds: ["1"],
  };

  const [formData, setFormData] = useState(initialProjectData);
  const [tasks, setTasks] = useState([
    { id: 1, title: "기획 단계", date: "2025-01-01", duration: 2, done: false },
    {
      id: 2,
      title: "디자인 단계",
      date: "2025-01-03",
      duration: 3,
      done: false,
    },
    { id: 3, title: "개발 단계", date: "2025-01-06", duration: 5, done: false },
  ]);

  useEffect(() => {
    // 실제 앱에서는 여기서 params.id를 사용하여 데이터를 불러와 setFormData
    // 예: fetchProject(params.id).then(data => setFormData(data));
  }, [params.id]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 여기서 Project 업데이트 로직 구현
    toast({
      title: "프로젝트 수정 완료",
      description: `${formData.title} 프로젝트가 업데이트되었습니다.`,
    });

    // 프로젝트 상세 페이지로 이동
    router.push(`/para/projects/${params.id}`);
  };

  const projectStatuses = [
    { value: "planned", label: "예정" },
    { value: "in_progress", label: "진행 중" },
    { value: "completed", label: "완료" },
  ];

  // 예시 Area 목록 (실제 앱에서는 데이터베이스에서 가져옴)
  const areas = [
    { value: "개인 성장", label: "개인 성장" },
    { value: "재정 관리", label: "재정 관리" },
    { value: "건강", label: "건강" },
  ];

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/para/projects/${params.id}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 수정하기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">프로젝트 정보를 수정하세요</h2>
        <p className="text-sm text-muted-foreground">
          {formData.status === "completed"
            ? "완료된 프로젝트는 마감일만 수정할 수 있습니다."
            : "프로젝트의 이름, 설명, 상태 등을 업데이트할 수 있습니다."}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="title">프로젝트 제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 새로운 웹사이트 개발, 독서 목표 달성"
              className="mt-1"
              required
              disabled={formData.status === "completed"}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">간단한 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="이 프로젝트에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={2}
              disabled={formData.status === "completed"}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
              disabled={formData.status === "completed"}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="프로젝트 상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {projectStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="area">연결된 영역 (Area)</Label>
            <Select
              value={formData.area}
              onValueChange={(value) => handleChange("area", value)}
              disabled={formData.status === "completed"}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="연결할 영역을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="dueDate">마감일</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="mt-1"
            />
          </div>
        </Card>

        {/* 태스크 관리 섹션 */}
        <Card className="mb-6 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">태스크 관리</h3>
            {formData.status !== "completed" && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newTask = {
                      id: Date.now(),
                      title: "",
                      date: formData.startDate,
                      duration: 1,
                      done: false,
                    };
                    setTasks([...tasks, newTask]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  태스크 추가
                </Button>
                {tasks.some((task) => task.done) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("선택된 태스크를 삭제하시겠습니까?")) {
                        setTasks(tasks.filter((task) => !task.done));
                      }
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    선택 삭제
                  </Button>
                )}
              </div>
            )}
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
                      onChange={(e) => {
                        const newTasks = [...tasks];
                        newTasks[index].done = e.target.checked;
                        setTasks(newTasks);
                      }}
                    />
                    <span className="text-xs text-muted-foreground">선택</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newTasks = tasks.filter((_, i) => i !== index);
                      setTasks(newTasks);
                    }}
                    disabled={formData.status === "completed"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
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
                      placeholder="예: 기획 단계, 디자인 작업"
                      value={task.title}
                      onChange={(e) => {
                        const newTasks = [...tasks];
                        newTasks[index].title = e.target.value;
                        setTasks(newTasks);
                      }}
                      disabled={formData.status === "completed"}
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
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          newTasks[index].date = e.target.value;
                          setTasks(newTasks);
                        }}
                        className="flex-1"
                        disabled={formData.status === "completed"}
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
                        onChange={(e) => {
                          const newTasks = [...tasks];
                          newTasks[index].duration =
                            parseInt(e.target.value) || 1;
                          setTasks(newTasks);
                        }}
                        className="w-full"
                        min="1"
                        disabled={formData.status === "completed"}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>아직 태스크가 없습니다.</p>
              <p className="text-sm">
                태스크를 추가하여 프로젝트를 세분화하세요.
              </p>
            </div>
          )}
        </Card>

        <Button type="submit" className="w-full">
          프로젝트 수정하기
        </Button>
      </form>
    </div>
  );
}
