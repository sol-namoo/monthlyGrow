"use client";

import type React from "react";

import { useState } from "react";
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
import { ChevronLeft, Folder } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    content: "",
    url: "",
    tags: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 여기서 Resource 생성 로직 구현
    toast({
      title: "자료 저장 완료",
      description: `${formData.title} 자료가 저장되었습니다.`,
    });

    // PARA 페이지로 이동
    router.push("/para/resources");
  };

  const resourceTypes = [
    { value: "note", label: "노트" },
    { value: "link", label: "링크" },
    { value: "file", label: "파일" },
    { value: "idea", label: "아이디어" },
    { value: "reference", label: "참고자료" },
  ];

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/para/resources">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">새 자료 저장하기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Folder className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">유용한 자료를 저장해보세요</h2>
        <p className="text-sm text-muted-foreground">
          나중에 활용할 수 있는 아이디어, 참고 자료, 링크 등을 체계적으로 관리할
          수 있습니다.
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
              placeholder="예: 운동 루틴 아이디어, 개발 참고 자료"
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="type">자료 유형</Label>
            <Select onValueChange={(value) => handleChange("type", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="자료 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {resourceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="description">간단한 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="이 자료에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={2}
            />
          </div>

          {formData.type === "link" && (
            <div className="mb-4">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange("url", e.target.value)}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="자료의 상세 내용을 입력하세요."
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="태그를 쉼표로 구분해서 입력하세요 (예: 건강, 운동, 루틴)"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              태그를 사용하면 나중에 자료를 쉽게 찾을 수 있습니다.
            </p>
          </div>
        </Card>

        <Button type="submit" className="w-full">
          자료 저장하기
        </Button>
      </form>
    </div>
  );
}
