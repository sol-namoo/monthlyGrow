"use client";

import type React from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Book, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchAllAreasByUserId, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useLanguage } from "@/hooks/useLanguage";

// 폼 스키마 정의
const resourceFormSchema = z.object({
  title: z.string().min(1, "자료 제목을 입력해주세요"),
  description: z.string().optional(),
  url: z.string().url("올바른 URL을 입력해주세요").optional().or(z.literal("")),
  text: z.string().optional(),
  area: z.string().min(1, "영역을 선택해주세요"),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false); // Resource 생성 중 로딩 상태
  const { translate } = useLanguage();

  // react-hook-form 설정
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      text: "",
      area: "",
    },
  });

  // 영역 데이터 가져오기
  const { data: allAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const areas = allAreas;

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true); // 로딩 상태 시작

    try {
      toast({
        title: "자료 생성 완료",
        description: `${data.title} 자료가 생성되었습니다.`,
      });

      router.push("/para/resources");
    } catch (error) {
      console.error("Resource 생성 실패:", error);
      toast({
        title: "자료 생성 실패",
        description: "자료 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // 로딩 상태 해제
    }
  };

  if (userLoading || areasLoading) {
    return (
      <div
        className={`container max-w-md px-4 py-6 relative ${
          isSubmitting ? "pointer-events-none" : ""
        }`}
      >
        {/* 로딩 오버레이 */}
        <LoadingOverlay isVisible={isSubmitting} message="자료 생성 중..." />
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">자료 추가하기</h1>
        </div>
        <div className="text-center text-muted-foreground">
          {translate("settings.loading.loading")}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">자료 추가하기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Book className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">새로운 자료를 추가해보세요</h2>
        <p className="text-sm text-muted-foreground">
          자료는 영역에 대한 참고 정보, 링크 등입니다.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">자료 제목</Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="예: 효과적인 시간 관리법"
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="area">소속 영역</Label>
            <Select onValueChange={(value) => form.setValue("area", value)}>
              <SelectTrigger>
                <SelectValue placeholder="영역을 선택해주세요" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.area && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.area.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">설명 (선택 사항)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="자료에 대한 간단한 설명을 입력하세요 (리스트에서 미리보기로 표시됩니다)"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="url">링크 (선택 사항)</Label>
            <Input
              id="url"
              type="url"
              {...form.register("url")}
              placeholder="https://example.com"
            />
            {form.formState.errors.url && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="text">내용 (선택 사항)</Label>
            <Textarea
              id="text"
              {...form.register("text")}
              placeholder="자료의 상세한 내용을 입력하세요 (긴 텍스트, 메모, 요약 등)"
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            자료 생성
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
