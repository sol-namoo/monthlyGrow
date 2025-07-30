"use client";

import type React from "react";
import { useState, useEffect, use, Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

// 로딩 스켈레톤 컴포넌트
function EditResourceSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Skeleton className="h-8 w-8 mr-2" />
        <Skeleton className="h-6 w-32" />
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    area: "",
  });
  const [loading, setLoading] = useState(true);

  // 샘플 Resource 데이터 (실제로는 ID에 따라 DB에서 데이터를 불러와야 함)
  const sampleResources = [
    {
      id: "1",
      title: "생산성 향상을 위한 팁",
      description: "시간 관리 및 효율적인 작업 방법에 대한 자료",
      url: "https://example.com/productivity-tips",
      area: "personal",
    },
    {
      id: "2",
      title: "React Hooks 완벽 가이드",
      description: "React Hooks 사용법과 예제",
      url: "https://example.com/react-hooks",
      area: "career",
    },
  ];

  useEffect(() => {
    const foundResource = sampleResources.find((r) => r.id === id);
    if (foundResource) {
      setFormData({
        title: foundResource.title,
        description: foundResource.description,
        url: foundResource.url,
        area: foundResource.area,
      });
    } else {
      toast({
        title: "자료를 찾을 수 없음",
        description:
          "해당 ID의 자료를 찾을 수 없습니다. 자료 목록으로 돌아갑니다.",
        variant: "destructive",
      });
      router.push("/para/resources");
    }
    setLoading(false);
  }, [id, router, toast]);

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

    if (!formData.title.trim()) {
      toast({
        title: "자료 수정 실패",
        description: "자료 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const updatedResource = {
      id,
      title: formData.title,
      description: formData.description,
      url: formData.url,
      area: formData.area,
      updatedAt: new Date().toISOString(),
    };

    console.log("자료 수정:", updatedResource);
    toast({
      title: "자료 수정 완료",
      description: `${formData.title} 자료가 성공적으로 수정되었습니다.`,
    });

    router.push(`/para/resources/${id}`); // 수정 후 상세 페이지로 이동
  };

  if (loading) {
    return (
      <div className="container max-w-md px-4 py-6 text-center">
        <p className="text-muted-foreground">자료를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<EditResourceSkeleton />}>
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href={`/para/resources/${id}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">자료 수정</h1>
        </div>

        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Book className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2">자료를 수정해보세요</h2>
          <p className="text-sm text-muted-foreground">
            자료의 내용이나 연결된 영역을 변경하여 최신 상태로 유지할 수
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
              <Select
                value={formData.area}
                onValueChange={(value) => handleChange("area", value)}
              >
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
            자료 수정
          </Button>
        </form>
      </div>
    </Suspense>
  );
}
