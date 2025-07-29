"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function NewAreaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    color: "#8b5cf6", // 기본 색상
    icon: "compass", // 기본 아이콘
  });

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 여기서 Area 생성 로직 구현
    toast({
      title: "Area 생성 완료",
      description: `${formData.title} 영역이 생성되었습니다.`,
    });

    // 루프 생성 페이지에서 왔다면 다시 루프 생성 페이지로 돌아가기
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl) {
      router.push(returnUrl);
    } else {
      // 일반적인 경우는 PARA areas 페이지로 이동
      router.push("/para/areas");
    }
  };

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
    setFormData({
      title: template.title,
      description: template.description,
      color: template.color,
      icon: template.icon,
    });
  };

  const getIconComponent = (iconId: string) => {
    const iconOption = iconOptions.find((option) => option.id === iconId);
    return iconOption ? iconOption.icon : Compass;
  };

  const SelectedIcon = getIconComponent(formData.icon);

  // 디자인 톤에 맞는 색상 팔레트
  const colorPalette = [
    { name: "보라", value: "#8b5cf6" },
    { name: "파랑", value: "#3b82f6" },
    { name: "초록", value: "#10b981" },
    { name: "청록", value: "#06b6d4" },
    { name: "주황", value: "#f59e0b" },
    { name: "빨강", value: "#ef4444" },
    { name: "핑크", value: "#ec4899" },
    { name: "회색", value: "#6b7280" },
  ];

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
        <h1 className="text-2xl font-bold">새 Area 만들기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <SelectedIcon className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">행동 영역을 만들어보세요</h2>
        <p className="text-sm text-muted-foreground">
          Area는 지속적으로 관심을 가져야 할 생활의 영역입니다. 건강, 커리어,
          자기계발 등이 될 수 있어요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="title">Area 이름 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="예: 건강, 커리어, 자기계발"
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
              placeholder="이 영역에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <Label>아이콘 선택</Label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleChange("icon", option.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors hover:bg-secondary ${
                      formData.icon === option.id
                        ? "border-primary bg-primary/10"
                        : ""
                    }`}
                  >
                    <IconComponent className="h-5 w-5" />
                    <span className="text-xs">{option.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <Label>색상 선택</Label>
            <div className="mt-2 grid grid-cols-8 gap-1">
              {colorPalette.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleChange("color", color.value)}
                  className={`flex items-center justify-center rounded-lg border p-2 transition-colors hover:bg-secondary ${
                    formData.color === color.value
                      ? "border-primary bg-primary/10"
                      : ""
                  }`}
                >
                  <div
                    className="h-5 w-5 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: color.value }}
                  />
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h3 className="mb-4 font-semibold">추천 템플릿</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            일반적인 생활 영역들을 빠르게 선택할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {areaTemplates.map((template, index) => {
              const TemplateIcon = getIconComponent(template.icon);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyTemplate(template)}
                  className="rounded-lg border p-3 text-left transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: template.color + "20" }}
                    >
                      <TemplateIcon
                        className="h-3 w-3"
                        style={{ color: template.color }}
                      />
                    </div>
                    <span className="font-medium text-sm">
                      {template.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="mb-4">
          <Card className="p-4 border-dashed border-primary/30 bg-primary/5">
            <h4 className="font-medium text-sm mb-2">미리보기</h4>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: formData.color + "20" }}
              >
                <SelectedIcon
                  className="h-5 w-5"
                  style={{ color: formData.color }}
                />
              </div>
              <div>
                <div className="font-medium">
                  {formData.title || "Area 이름"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.description || "설명이 여기에 표시됩니다"}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!formData.title.trim()}
        >
          Area 만들기
        </Button>
      </form>
    </div>
  );
}
