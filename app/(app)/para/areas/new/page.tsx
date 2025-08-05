"use client";

import type React from "react";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  ChevronLeft,
  Compass,
  Heart,
  Brain,
  Briefcase,
  DollarSign,
  Users,
  Gamepad2,
  Dumbbell,
  BookOpen as BookOpenIcon,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import Loading from "@/components/feedback/Loading";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

// 폼 스키마 정의
const areaFormSchema = z.object({
  title: z.string().min(1, "영역 이름을 입력해주세요"),
  description: z.string().min(1, "영역 설명을 입력해주세요"),
  color: z.string().min(1, "색상을 선택해주세요"),
  icon: z.string().min(1, "아이콘을 선택해주세요"),
});

type AreaFormData = z.infer<typeof areaFormSchema>;

function NewAreaPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false); // Area 생성 중 로딩 상태

  // react-hook-form 설정
  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#8b5cf6", // 기본 색상
      icon: "compass", // 기본 아이콘
    },
  });

  // 추천 Area 템플릿
  const areaTemplates = [
    {
      title: "건강",
      description: "신체적, 정신적 건강 관리",
      color: "#10b981",
      icon: "heart",
    },
    {
      title: "커리어",
      description: "직업적 성장과 발전",
      color: "#3b82f6",
      icon: "briefcase",
    },
    {
      title: "자기계발",
      description: "개인적 성장과 학습",
      color: "#8b5cf6",
      icon: "brain",
    },
    {
      title: "인간관계",
      description: "가족, 친구, 동료와의 관계",
      color: "#f59e0b",
      icon: "users",
    },
    {
      title: "재정",
      description: "재정 관리와 투자",
      color: "#059669",
      icon: "dollarSign",
    },
    {
      title: "취미/여가",
      description: "개인적 즐거움과 휴식",
      color: "#ec4899",
      icon: "gamepad2",
    },
  ];

  // 아이콘 선택 옵션
  const iconOptions = [
    { id: "compass", icon: Compass, name: "나침반" },
    { id: "heart", icon: Heart, name: "하트" },
    { id: "brain", icon: Brain, name: "뇌" },
    { id: "briefcase", icon: Briefcase, name: "브리프케이스" },
    { id: "dollarSign", icon: DollarSign, name: "달러" },
    { id: "users", icon: Users, name: "사람들" },
    { id: "gamepad2", icon: Gamepad2, name: "게임패드" },
    { id: "dumbbell", icon: Dumbbell, name: "운동" },
    { id: "bookOpen", icon: BookOpenIcon, name: "독서" },
    { id: "home", icon: Home, name: "가정" },
    { id: "car", icon: Car, name: "교통" },
    { id: "plane", icon: Plane, name: "여행" },
    { id: "camera", icon: Camera, name: "사진" },
    { id: "music", icon: Music, name: "음악" },
    { id: "palette", icon: Palette, name: "예술" },
    { id: "utensils", icon: Utensils, name: "요리" },
  ];

  const applyTemplate = (template: (typeof areaTemplates)[0]) => {
    form.setValue("title", template.title);
    form.setValue("description", template.description);
    form.setValue("color", template.color);
    form.setValue("icon", template.icon);
  };

  const getIconComponent = (iconId: string) => {
    const option = iconOptions.find((opt) => opt.id === iconId);
    return option ? option.icon : Compass;
  };

  const onSubmit = async (data: AreaFormData) => {
    setIsSubmitting(true); // 로딩 상태 시작

    try {
      // 여기서 Area 생성 로직 구현
      toast({
        title: "Area 생성 완료",
        description: `${data.title} 영역이 생성되었습니다.`,
      });

      // 루프 생성 페이지에서 왔다면 다시 루프 생성 페이지로 돌아가기
      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl) {
        router.push(returnUrl);
      } else {
        // 일반적인 경우는 PARA areas 페이지로 이동
        router.push("/para/areas");
      }
    } catch (error) {
      console.error("Area 생성 실패:", error);
      toast({
        title: "Area 생성 실패",
        description: "Area 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // 로딩 상태 해제
    }
  };

  return (
    <div
      className={`container max-w-md px-4 py-6 relative ${
        isSubmitting ? "pointer-events-none" : ""
      }`}
    >
      {/* 로딩 오버레이 */}
      <LoadingOverlay isVisible={isSubmitting} message="영역 생성 중..." />
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">영역 만들기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">새로운 영역을 만들어보세요</h2>
        <p className="text-sm text-muted-foreground">
          영역은 프로젝트와 자료를 체계적으로 분류하고 관리하는 기준입니다.
          자신만의 영역을 만들어보세요.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">영역 이름</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="예: 건강, 커리어, 자기계발"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">영역 설명</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="이 영역에서 관리하고 싶은 내용을 설명해주세요"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">시각적 설정</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="color">색상</Label>
              <div className="mt-2 grid grid-cols-6 gap-2">
                {[
                  "#8b5cf6",
                  "#3b82f6",
                  "#10b981",
                  "#f59e0b",
                  "#ef4444",
                  "#ec4899",
                  "#6366f1",
                  "#06b6d4",
                  "#84cc16",
                  "#f97316",
                  "#8b5a2b",
                  "#64748b",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      form.watch("color") === color
                        ? "border-gray-900 scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => form.setValue("color", color)}
                  />
                ))}
              </div>
              {form.formState.errors.color && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.color.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="icon">아이콘</Label>
              <Select onValueChange={(value) => form.setValue("icon", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="아이콘을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{option.name}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {form.formState.errors.icon && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.icon.message}
                </p>
              )}
            </div>

            {/* 선택된 아이콘 미리보기 */}
            {form.watch("icon") && (
              <div className="flex items-center gap-2 p-3 rounded-lg border">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: form.watch("color") }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(form.watch("icon"));
                    return <IconComponent className="h-4 w-4 text-white" />;
                  })()}
                </div>
                <span className="text-sm font-medium">
                  {form.watch("title") || "영역 이름"}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">추천 템플릿</h2>

          <div className="mb-4 space-y-2">
            <RecommendationBadge
              type="info"
              message="자주 사용되는 영역 템플릿을 선택하여 빠르게 설정할 수 있어요"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {areaTemplates.map((template) => (
              <button
                key={template.title}
                type="button"
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                onClick={() => applyTemplate(template)}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ backgroundColor: template.color }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(template.icon);
                    return <IconComponent className="h-4 w-4 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{template.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {template.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "영역 생성"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewAreaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewAreaPageContent />
    </Suspense>
  );
}
