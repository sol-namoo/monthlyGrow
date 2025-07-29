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
import { ChevronLeft, Book } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    area: "",
  });

  // 샘플 데이터
  const areas = [
    { id: "health", name: "건강" },
    { id: "career", name: "커리어" },
    { id: "relationships", name: "인간관계" },
    { id: "finance", name: "재정" },
    { id: "personal", name: "자기계발" },
    { id: "fun", name: "취미/여가" },
  ];

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    toast({
      title: "자료 생성 완료",
      description: `${formData.title} 자료가 생성되었습니다.`,
    });

    router.push("/para/resources");
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
        <h1 className="text-2xl font-bold">새 자료</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Book className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">새로운 자료를 추가해보세요</h2>
        <p className="text-sm text-muted-foreground">
          유용한 정보, 링크, 문서 등을 자료로 저장하여 필요할 때 쉽게 찾아볼 수
          있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="title">자료 제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 효과적인 시간 관리법"
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">설명 (선택 사항)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="자료에 대한 간략한 설명을 입력하세요."
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="url">URL (선택 사항)</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleChange("url", e.target.value)}
              placeholder="예: https://example.com/article"
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="area">연결할 영역 (선택 사항)</Label>
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
        </Card>

        <Button type="submit" className="w-full">
          자료 생성
        </Button>
      </form>
    </div>
  );
}
