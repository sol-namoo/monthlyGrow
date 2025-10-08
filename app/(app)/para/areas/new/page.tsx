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
import { useLanguage } from "@/hooks/useLanguage";
import { createArea } from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";

// 폼 스키마 정의 (다국어화 적용)
const createAreaFormSchema = (translate: any) =>
  z.object({
    title: z.string().min(1, translate("areas.validation.titleRequired")),
    description: z
      .string()
      .min(1, translate("areas.validation.descriptionRequired")),
    color: z.string().min(1, translate("areas.validation.colorRequired")),
    icon: z.string().min(1, translate("areas.validation.iconRequired")),
  });

type AreaFormData = z.infer<ReturnType<typeof createAreaFormSchema>>;

function NewAreaPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false); // Area 생성 중 로딩 상태
  const { translate } = useLanguage();
  const [user] = useAuthState(auth);

  // react-hook-form 설정
  const areaFormSchema = createAreaFormSchema(translate);
  const form = useForm<AreaFormData>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      title: "",
      description: "",
      color: "#8b5cf6", // 기본 색상
      icon: "compass", // 기본 아이콘
    },
  });

  // 추천 Area 템플릿 (다국어화)
  const areaTemplates = [
    {
      title: translate("areas.templates.health.title"),
      description: translate("areas.templates.health.description"),
      color: "#10b981",
      icon: "heart",
    },
    {
      title: translate("areas.templates.career.title"),
      description: translate("areas.templates.career.description"),
      color: "#3b82f6",
      icon: "briefcase",
    },
    {
      title: translate("areas.templates.personal.title"),
      description: translate("areas.templates.personal.description"),
      color: "#8b5cf6",
      icon: "brain",
    },
    {
      title: translate("areas.templates.relationships.title"),
      description: translate("areas.templates.relationships.description"),
      color: "#f59e0b",
      icon: "users",
    },
    {
      title: translate("areas.templates.finance.title"),
      description: translate("areas.templates.finance.description"),
      color: "#059669",
      icon: "dollarSign",
    },
    {
      title: translate("areas.templates.hobby.title"),
      description: translate("areas.templates.hobby.description"),
      color: "#ec4899",
      icon: "gamepad2",
    },
  ];

  // 아이콘 선택 옵션
  const iconOptions = [
    { id: "compass", icon: Compass, name: translate("areas.icons.compass") },
    { id: "heart", icon: Heart, name: translate("areas.icons.heart") },
    { id: "brain", icon: Brain, name: translate("areas.icons.brain") },
    {
      id: "briefcase",
      icon: Briefcase,
      name: translate("areas.icons.briefcase"),
    },
    {
      id: "dollarSign",
      icon: DollarSign,
      name: translate("areas.icons.dollarSign"),
    },
    { id: "users", icon: Users, name: translate("areas.icons.users") },
    { id: "gamepad2", icon: Gamepad2, name: translate("areas.icons.gamepad2") },
    { id: "dumbbell", icon: Dumbbell, name: translate("areas.icons.dumbbell") },
    {
      id: "bookOpen",
      icon: BookOpenIcon,
      name: translate("areas.icons.bookOpen"),
    },
    { id: "home", icon: Home, name: translate("areas.icons.home") },
    { id: "car", icon: Car, name: translate("areas.icons.car") },
    { id: "plane", icon: Plane, name: translate("areas.icons.plane") },
    { id: "camera", icon: Camera, name: translate("areas.icons.camera") },
    { id: "music", icon: Music, name: translate("areas.icons.music") },
    { id: "palette", icon: Palette, name: translate("areas.icons.palette") },
    { id: "utensils", icon: Utensils, name: translate("areas.icons.utensils") },
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
      // Area 생성
      const newArea = await createArea({
        userId: user!.uid,
        name: data.title,
        description: data.description,
        icon: data.icon,
        color: data.color,
        status: "active",
      });

      toast({
        title: "Area 생성 완료",
        description: `${data.title} 영역이 생성되었습니다.`,
      });

      // 먼슬리 생성 페이지에서 왔다면 다시 먼슬리 생성 페이지로 돌아가기
      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl) {
        router.replace(returnUrl);
      } else {
        // 일반적인 경우는 Area 상세 페이지로 이동 (replace로 히스토리 대체)
        router.replace(`/para/areas/${newArea.id}`);
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
      className={`container max-w-md px-4 py-6 pb-20 relative ${
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
        <h1 className="text-2xl font-bold">{translate("areas.new.title")}</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">
          {translate("areas.new.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate("areas.new.description")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {translate("areas.form.title")}
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{translate("areas.form.title")}</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder={translate("areas.form.titlePlaceholder")}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">
                {translate("areas.form.description")}
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder={translate("areas.form.descriptionPlaceholder")}
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
          <h2 className="mb-4 text-lg font-semibold">
            {translate("areas.form.color")}
          </h2>

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
            {translate("common.cancel")}
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
