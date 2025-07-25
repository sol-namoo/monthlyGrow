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
import { ChevronLeft, Briefcase } from "lucide-react";
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
    name: "새로운 웹사이트 개발",
    description: "반응형 디자인과 최신 기술 스택을 활용한 웹사이트 구축",
    status: "in-progress",
    area: "개인 성장", // 예시 Area
    dueDate: "2025-12-31",
  };

  const [formData, setFormData] = useState(initialProjectData);

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
      description: `${formData.name} 프로젝트가 업데이트되었습니다.`,
    });

    // 프로젝트 상세 페이지로 이동
    router.push(`/para/projects/${params.id}`);
  };

  const projectStatuses = [
    { value: "todo", label: "할 일" },
    { value: "in-progress", label: "진행 중" },
    { value: "completed", label: "완료" },
    { value: "on-hold", label: "보류" },
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
          프로젝트의 이름, 설명, 상태 등을 업데이트할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="name">프로젝트 이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 새로운 웹사이트 개발, 독서 목표 달성"
              className="mt-1"
              required
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
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
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

        <Button type="submit" className="w-full">
          프로젝트 수정하기
        </Button>
      </form>
    </div>
  );
}
