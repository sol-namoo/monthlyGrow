"use client";

import type React from "react";
import { useState, useEffect, Suspense, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronLeft,
  MapPin,
  Folder,
  BookOpen,
  Plus,
  X,
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
import { SelectItemsDialog } from "@/components/widgets/select-items-dialog";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/feedback/Loading";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import {
  fetchAreaById,
  updateArea,
  fetchAllProjectsByUserId,
  fetchAllResourcesByUserId,
} from "@/lib/firebase/index";
import { getProjectStatus } from "@/lib/utils";
import type { Area, Project, Resource } from "@/lib/types";

// 로딩 스켈레톤 컴포넌트
function EditAreaSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6 pb-20">
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

function EditAreaPageContent({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { id } = use(params);
  const areaId = id!;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, userLoading] = useAuthState(auth);
  const queryClient = useQueryClient();

  // Area 데이터 가져오기
  const { data: area, isLoading: areaLoading } = useQuery({
    queryKey: ["area", areaId],
    queryFn: () => fetchAreaById(areaId),
    enabled: !!areaId,
  });

  // 모든 프로젝트 가져오기
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 모든 리소스 가져오기
  const { data: allResources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ["resources", user?.uid],
    queryFn: () => fetchAllResourcesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // Area 업데이트 mutation
  const updateAreaMutation = useMutation({
    mutationFn: (updateData: Partial<Area>) => updateArea(id, updateData),
    onSuccess: () => {
      toast({
        title: "영역 수정 완료",
        description: "영역 정보가 성공적으로 수정되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["area", id] });
      queryClient.invalidateQueries({ queryKey: ["areas", user?.uid] });
      router.push("/para");
    },
    onError: (error) => {
      toast({
        title: "영역 수정 실패",
        description: "영역 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState<Partial<Area>>({});
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isResourceSelectOpen, setIsResourceSelectOpen] = useState(false);

  // Area 데이터가 로드되면 formData 설정
  useEffect(() => {
    if (area) {
      setFormData({
        name: area.name,
        description: area.description,
        icon: area.icon,
        color: area.color,
      });
    }
  }, [area]);

  // 로딩 중이거나 데이터가 없으면 스켈레톤 표시
  if (areaLoading || !area) {
    return <EditAreaSkeleton />;
  }

  // "미분류" 영역은 수정 불가
  if (area.name === "미분류") {
    return (
      <div className="container max-w-md px-4 py-6 pb-20">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">수정 불가</h2>
          <p className="text-muted-foreground">
            "미분류" 영역은 수정할 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

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

  const getIconComponent = (iconId: string) => {
    const iconOption = iconOptions.find((option) => option.id === iconId);
    return iconOption ? iconOption.icon : Compass;
  };

  const SelectedIcon = getIconComponent(formData.icon || "compass");

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

  useEffect(() => {
    // 실제 앱에서는 여기서 params.id를 사용하여 데이터를 불러와 setFormData
    // 예: fetchArea(params.id).then(data => setFormData(data));

    const tab = searchParams.get("tab");
    if (tab === "projects") {
      setIsProjectSelectOpen(true);
    } else if (tab === "resources") {
      setIsResourceSelectOpen(true);
    }
  }, [id, searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveProjects = (selectedIds: string[]) => {
    // 프로젝트 연결 기능은 별도 페이지에서 처리
    setIsProjectSelectOpen(false);
  };

  const handleSaveResources = (selectedIds: string[]) => {
    // 리소스 연결 기능은 별도 페이지에서 처리
    setIsResourceSelectOpen(false);
  };

  const handleRemoveProject = (projectId: string) => {
    // 프로젝트 연결 해제 기능은 별도 페이지에서 처리
  };

  const handleRemoveResource = (resourceId: string) => {
    // 리소스 연결 해제 기능은 별도 페이지에서 처리
  };

  const handleCloseModal = () => {
    // 모달 닫기 시 URL 파라미터 제거
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("tab");
    const query = current.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    router.replace(newUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSubmitting(true);

    try {
      await updateAreaMutation.mutateAsync(formData);

      toast({
        title: "영역 수정 완료",
        description: `${formData.name} 영역이 업데이트되었습니다.`,
      });

      router.replace(`/para/areas/${id || ""}`);
    } catch (error) {
      console.error("Area 수정 실패:", error);
      toast({
        title: "영역 수정 실패",
        description: "영역 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`container max-w-md px-4 py-6 pb-20 relative ${
        isSubmitting ? "pointer-events-none" : ""
      }`}
    >
      {/* 로딩 오버레이 */}
      <LoadingOverlay isVisible={isSubmitting} message="영역 수정 중..." />

      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/para/areas/${id}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">영역 수정하기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div
            className="rounded-full p-4"
            style={{ backgroundColor: `${formData.color}20` }}
          >
            <SelectedIcon
              className="h-8 w-8"
              style={{ color: formData.color }}
            />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">영역 정보를 수정하세요</h2>
        <p className="text-sm text-muted-foreground">
          영역의 이름과 설명을 업데이트할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="name">영역 이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 개인 성장, 재정 관리"
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
              placeholder="이 영역에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={2}
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "변경 사항 저장"}
        </Button>
      </form>
    </div>
  );
}

export default function EditAreaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<EditAreaSkeleton />}>
      <EditAreaPageContent params={params} />
    </Suspense>
  );
}
