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
import { ChevronLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터에서 loopId와 addedMidway 값을 가져옴
  const loopId = searchParams.get("loopId");
  const addedMidway = searchParams.get("addedMidway") === "true";

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    area: "",
    loop: loopId || "",
    dueDate: "",
    goal: "",
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 여기서 데이터 처리 로직 구현
    router.push("/para");
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={loopId ? `/loop/${loopId}` : "/para"}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
      </div>

      {addedMidway && currentLoop && (
        <Alert className="mb-6 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">
            루프 중간에 추가되는 프로젝트
          </AlertTitle>
          <AlertDescription className="text-amber-600">
            이 프로젝트는{" "}
            <Badge className="bg-primary/20">{currentLoop.title}</Badge>에
            중간에 추가되는 프로젝트로 표시됩니다. 월말 리포트에서 '후속 투입
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
            <Label htmlFor="dueDate">마감일</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange("dueDate", e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="goal">목표 설정</Label>
            <Textarea
              id="goal"
              value={formData.goal}
              onChange={(e) => handleChange("goal", e.target.value)}
              placeholder="이 프로젝트를 통해 달성하고자 하는 구체적인 목표를 설정하세요."
              className="mt-1"
            />
          </div>
        </Card>

        <Button type="submit" className="w-full" disabled={isLoopFull}>
          프로젝트 생성
        </Button>
      </form>
    </div>
  );
}
