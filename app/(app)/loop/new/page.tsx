"use client";

import type React from "react";
import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  Plus,
  Compass,
  Heart,
  Briefcase,
  Users,
  DollarSign,
  Brain,
  Gamepad2,
  BookOpen,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import Loading from "@/components/feedback/Loading";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import { ProjectSelectionModal } from "@/components/ui/project-selection-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 기본 폼 스키마 정의
const loopFormSchema = z.object({
  title: z.string().min(1, "루프 제목을 입력해주세요"),
  reward: z.string().min(1, "보상을 입력해주세요"),
  startDate: z.string().min(1, "시작일을 입력해주세요"),
  endDate: z.string().min(1, "종료일을 입력해주세요"),
  selectedAreas: z.array(z.string()).min(1, "최소 1개의 영역을 선택해주세요"),
  selectedExistingProjects: z.array(z.string()),
});

type LoopFormData = z.infer<typeof loopFormSchema>;

// 아이콘 컴포넌트 매핑 함수
const getIconComponent = (iconName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    heart: Heart,
    briefcase: Briefcase,
    users: Users,
    dollarSign: DollarSign,
    brain: Brain,
    gamepad2: Gamepad2,
    bookOpen: BookOpen,
    palette: Palette,
  };
  return iconMap[iconName] || Compass;
};

function NewLoopPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { settings } = useSettings();
  const searchParams = useSearchParams();

  // react-hook-form 설정
  const form = useForm<LoopFormData>({
    resolver: zodResolver(loopFormSchema),
    defaultValues: {
      title: "",
      reward: "",
      startDate: "",
      endDate: "",
      selectedAreas: [],
      selectedExistingProjects: [],
    },
  });

  // 기존 상태들
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newlyCreatedProjectId, setNewlyCreatedProjectId] = useState<
    string | undefined
  >();
  const [projectModalRefreshKey, setProjectModalRefreshKey] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("/loop/new");

  // 사용자 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      // 기본 보상이 활성화되어 있고, 보상 필드가 비어있을 때만 자동으로 채우기
      if (
        settings.defaultRewardEnabled &&
        settings.defaultReward &&
        !form.getValues("reward")
      ) {
        form.setValue("reward", settings.defaultReward);
      }
    }
  }, [form]);

  // 월 단위 날짜 자동 설정
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // 해당 월의 1일
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-01`;

    // 해당 월의 마지막 날
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const endDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;

    // 폼에 자동 설정
    form.setValue("startDate", startDate);
    form.setValue("endDate", endDate);
  }, [form]);

  // 샘플 데이터
  const areas = [
    { id: "area1", name: "건강", color: "#ef4444", icon: "heart" },
    { id: "area2", name: "커리어", color: "#3b82f6", icon: "briefcase" },
    { id: "area3", name: "학습", color: "#8b5cf6", icon: "bookOpen" },
    { id: "area4", name: "재정", color: "#10b981", icon: "dollarSign" },
    { id: "area5", name: "관계", color: "#f59e0b", icon: "users" },
    { id: "area6", name: "취미", color: "#ec4899", icon: "gamepad2" },
  ];

  // 폼 데이터를 URL에 자동 저장
  useEffect(() => {
    const formData = form.watch();
    const url = new URL(window.location.href);

    // 루프 기본 정보 저장
    if (formData.title) {
      url.searchParams.set("loopTitle", formData.title);
    } else {
      url.searchParams.delete("loopTitle");
    }

    if (formData.reward) {
      url.searchParams.set("loopReward", formData.reward);
    } else {
      url.searchParams.delete("loopReward");
    }

    if (formData.startDate) {
      url.searchParams.set("startDate", formData.startDate);
    } else {
      url.searchParams.delete("startDate");
    }

    if (formData.endDate) {
      url.searchParams.set("endDate", formData.endDate);
    } else {
      url.searchParams.delete("endDate");
    }

    // 선택된 Areas 저장
    if (formData.selectedAreas && formData.selectedAreas.length > 0) {
      url.searchParams.set("selectedAreas", formData.selectedAreas.join(","));
    } else {
      url.searchParams.delete("selectedAreas");
    }

    // 선택된 프로젝트 저장
    if (
      formData.selectedExistingProjects &&
      formData.selectedExistingProjects.length > 0
    ) {
      url.searchParams.set(
        "selectedExistingProjects",
        formData.selectedExistingProjects.join(",")
      );
    } else {
      url.searchParams.delete("selectedExistingProjects");
    }

    // URL 업데이트 (브라우저 히스토리에 추가하지 않음)
    window.history.replaceState({}, "", url.toString());
  }, [form.watch()]);

  // 클라이언트 사이드에서 현재 URL 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // URL 파라미터에서 상태 복원
  useEffect(() => {
    const loopTitleParam = searchParams.get("loopTitle");
    const loopRewardParam = searchParams.get("loopReward");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const selectedAreasParam = searchParams.get("selectedAreas");
    const selectedExistingProjectsParam = searchParams.get(
      "selectedExistingProjects"
    );
    const newProjectId = searchParams.get("newProjectId");

    // 루프 기본 정보 복원
    if (loopTitleParam) {
      form.setValue("title", loopTitleParam);
    }
    if (loopRewardParam) {
      form.setValue("reward", loopRewardParam);
    }
    if (startDateParam) {
      form.setValue("startDate", startDateParam);
    }
    if (endDateParam) {
      form.setValue("endDate", endDateParam);
    }

    // 선택된 Areas 복원
    if (selectedAreasParam) {
      form.setValue("selectedAreas", selectedAreasParam.split(","));
    }

    // 선택된 기존 프로젝트 복원
    if (selectedExistingProjectsParam) {
      form.setValue(
        "selectedExistingProjects",
        selectedExistingProjectsParam.split(",")
      );
    }

    // 새로 생성된 프로젝트가 있다면 리프레시만 수행
    if (newProjectId) {
      // 새로 생성된 프로젝트 ID 저장 (시각적 표시용)
      setNewlyCreatedProjectId(newProjectId);

      // 프로젝트 모달 리프레시 키 업데이트
      setProjectModalRefreshKey((prev) => prev + 1);

      // URL에서 newProjectId 파라미터 제거
      const url = new URL(window.location.href);
      url.searchParams.delete("newProjectId");
      window.history.replaceState({}, "", url.toString());

      toast({
        title: "프로젝트 생성 완료",
        description:
          "새로 생성된 프로젝트가 목록에 추가되었습니다. 프로젝트 선택에서 확인하세요.",
      });
    }
  }, [searchParams, form, toast]);

  // Area가 있는지 확인
  const hasAreas = areas.length > 0;

  const toggleArea = (areaId: string) => {
    const currentAreas = form.getValues("selectedAreas");
    if (currentAreas.includes(areaId)) {
      form.setValue(
        "selectedAreas",
        currentAreas.filter((id) => id !== areaId)
      );
    } else {
      if (currentAreas.length < 4) {
        form.setValue("selectedAreas", [...currentAreas, areaId]);
      }
    }
  };

  const toggleExistingProject = (projectId: string) => {
    const currentProjects = form.getValues("selectedExistingProjects");
    if (currentProjects.includes(projectId)) {
      form.setValue(
        "selectedExistingProjects",
        currentProjects.filter((id) => id !== projectId)
      );
    } else {
      // 프로젝트 개수 제한 (최대 5개)
      if (currentProjects.length < 5) {
        form.setValue("selectedExistingProjects", [
          ...currentProjects,
          projectId,
        ]);
      }
    }
  };

  const onSubmit = (data: LoopFormData) => {
    // 루프 생성 로직 (실제 구현에서는 API 호출)
    const loopData = {
      ...data,
      createdAt: new Date(),
    };

    console.log("루프 생성:", loopData);

    toast({
      title: "루프 생성 완료",
      description: `${data.title} 루프가 생성되었습니다.`,
    });

    // 루프 목록 페이지로 이동
    router.push("/loop");
  };

  // 프로젝트 개수 계산
  const totalProjectCount = form.watch("selectedExistingProjects").length;

  // 프로젝트 개수 제한 초과 여부
  const isProjectLimitExceeded = totalProjectCount > 5;

  // 프로젝트 개수 경고 표시 여부
  const showProjectCountWarning = totalProjectCount > 3;

  // 시작 날짜로부터 월 정보 추출
  const getMonthFromDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("ko-KR", { month: "long" });
    } catch (e) {
      return "이번 달";
    }
  };

  const monthName = getMonthFromDate(form.watch("startDate"));

  const handleCreateCurrentLoop = () => {
    if (!hasAreas) {
      // Area가 없으면 Area 생성 페이지로 이동하면서 돌아올 URL 전달
      const currentUrl = `/loop/new${
        searchParams.get("startDate")
          ? `?startDate=${searchParams.get("startDate")}`
          : ""
      }`;
      window.location.href = `/para/areas/new?returnUrl=${encodeURIComponent(
        currentUrl
      )}`;
      return;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(
      2,
      "0"
    )}-01`;
    form.setValue("startDate", startDate);
    form.setValue(
      "endDate",
      new Date(currentYear, currentMonth + 1, 0).toISOString().split("T")[0]
    );
    form.setValue("title", `${getMonthFromDate(startDate)} 루프`);
  };

  // Area가 없는 경우 전체 페이지를 다르게 렌더링
  if (!hasAreas) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/loop">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{monthName} 루프 생성</h1>
        </div>

        <div className="text-center py-12">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted/50 p-8">
              <Compass className="h-16 w-16 text-muted-foreground/50" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-4">등록된 활동 영역이 없어요</h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            루프를 만들기 위해서는 먼저 활동 영역(Area)을 등록해야 합니다. 건강,
            커리어, 자기계발 등 관심 있는 영역을 만들어보세요.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full max-w-xs">
              <Link
                href={`/para/areas/new?returnUrl=${encodeURIComponent(
                  `/loop/new${
                    searchParams.get("startDate")
                      ? `?startDate=${searchParams.get("startDate")}`
                      : ""
                  }`
                )}`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Area 만들기
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full max-w-xs bg-transparent"
            >
              <Link href="/para">PARA 시스템 보기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{monthName} 루프 생성</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">루프 제목</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="예: 1월 건강 루프"
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reward">보상</Label>
              <Input
                id="reward"
                {...form.register("reward")}
                placeholder="예: 새로운 운동화 구매"
                className="mt-1"
              />
              {!settings.defaultRewardEnabled && (
                <p className="text-sm text-muted-foreground mt-1">
                  💡 기본 보상 설정이 비활성화되어 있습니다. 설정에서 활성화하면
                  새 루프 생성 시 자동으로 보상이 채워집니다.
                </p>
              )}
              {form.formState.errors.reward && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.reward.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                  className="mt-1"
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  루프는 월 단위로 설정됩니다
                </p>
              </div>

              <div>
                <Label htmlFor="endDate">종료일</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register("endDate")}
                  className="mt-1"
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  해당 월의 마지막 날까지
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleCreateCurrentLoop}
              className="w-full"
            >
              이번 달 루프 자동 생성
            </Button>
          </div>
        </Card>

        {/* 중점 Areas */}
        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">중점 Areas (최대 4개)</h2>

          <div className="mb-4 space-y-2">
            <RecommendationBadge
              type="info"
              message="권장: 2개 영역에 집중하면 루프의 효과를 높일 수 있어요"
            />
            {form.watch("selectedAreas").length > 2 && (
              <RecommendationBadge
                type="warning"
                message="많은 영역을 선택하면 집중도가 떨어질 수 있습니다"
              />
            )}
          </div>
          {areas.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {areas.map((area) => {
                  const IconComponent = getIconComponent(area.icon);

                  return (
                    <div
                      key={area.id}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors ${
                        form.watch("selectedAreas").includes(area.id)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleArea(area.id)}
                    >
                      <div
                        className="mb-1 rounded-full p-1"
                        style={{ backgroundColor: `${area.color}20` }}
                      >
                        <IconComponent
                          className="h-3 w-3"
                          style={{ color: area.color }}
                        />
                      </div>
                      <span className="text-xs">{area.name}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.watch("selectedAreas").map((areaId) => {
                  const area = areas.find((a) => a.id === areaId);
                  const IconComponent = getIconComponent(
                    area?.icon || "compass"
                  );

                  return (
                    <Badge
                      key={areaId}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <IconComponent className="h-3 w-3" />
                      {area?.name}
                    </Badge>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-muted/50 p-3">
                  <Compass className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                등록된 활동 영역이 없습니다.
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/para/areas/new?returnUrl=/loop/new">
                  Area 만들기
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* 프로젝트 연결 */}
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">프로젝트 연결</h2>
            <p className="text-sm text-muted-foreground mb-4">
              이 루프와 연결할 프로젝트를 선택하거나 새 프로젝트를 만들어보세요.
              프로젝트는 나중에 추가할 수도 있습니다.
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProjectModal(true)}
                className="flex-1"
              >
                기존 프로젝트 선택
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewProjectDialog(true)}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
              </Button>
            </div>
          </div>

          {/* 선택된 프로젝트 표시 */}
          {form.watch("selectedExistingProjects").length > 0 && (
            <div className="space-y-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">선택된 프로젝트</h3>
                <Badge variant="secondary" className="text-xs">
                  {form.watch("selectedExistingProjects").length}개
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  프로젝트 선택 모달에서 선택한 프로젝트들이 여기에 표시됩니다.
                </p>
              </div>
            </div>
          )}

          {/* 프로젝트가 없을 때 안내 */}
          {form.watch("selectedExistingProjects").length === 0 && (
            <div className="text-center py-6">
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-muted/50 p-3">
                  <Briefcase className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                아직 선택된 프로젝트가 없습니다
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <RecommendationBadge
              type="info"
              message="권장: 2~3개 프로젝트에 집중하면 루프의 효과를 높일 수 있어요"
            />

            {form.watch("selectedExistingProjects").length > 3 && (
              <RecommendationBadge
                type="warning"
                message="많은 프로젝트를 선택하면 집중도가 떨어질 수 있습니다"
              />
            )}
          </div>
        </Card>

        {/* 프로젝트 선택 모달 */}
        <ProjectSelectionModal
          open={showProjectModal}
          onOpenChange={(open) => {
            setShowProjectModal(open);
            if (!open) {
              // 모달이 닫힐 때 새로 생성된 프로젝트 ID 초기화
              setNewlyCreatedProjectId(undefined);
            }
          }}
          selectedProjects={form.watch("selectedExistingProjects")}
          onProjectToggle={toggleExistingProject}
          onConfirm={() => setShowProjectModal(false)}
          maxProjects={5}
          newlyCreatedProjectId={newlyCreatedProjectId}
          key={projectModalRefreshKey} // 리프레시를 위한 키
        />

        {/* 제출 버튼 */}
        <Button type="submit" className="w-full" size="lg">
          루프 생성하기
        </Button>
      </form>

      {/* 새 프로젝트 만들기 안내 다이얼로그 - 폼 밖으로 이동 */}
      <Dialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
        <DialogContent className="w-full max-w-none max-h-none rounded-none border-0 m-0 p-2 sm:max-w-md sm:max-h-fit sm:rounded-lg sm:border sm:mx-2 sm:my-4">
          <DialogHeader className="px-6 pt-4 pb-3">
            <DialogTitle>새 프로젝트 만들기</DialogTitle>
            <DialogDescription>
              새 프로젝트를 만들어 루프에 연결하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4 space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    새 프로젝트 생성
                  </h4>
                  <p className="text-xs text-blue-700">
                    프로젝트 생성 페이지로 이동하여 새 프로젝트를 만들고, 완료
                    후 이 루프 페이지로 돌아와서 연결할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="rounded-full bg-amber-100 p-1 mt-0.5">
                  <Briefcase className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 mb-1">
                    나중에 추가 가능
                  </h4>
                  <p className="text-xs text-amber-700">
                    지금 프로젝트를 만들지 않아도 괜찮습니다. 루프 생성 후
                    편집에서 언제든지 프로젝트를 추가할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewProjectDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button type="button" asChild className="flex-1">
                <Link
                  href={`/para/projects/new?returnUrl=${encodeURIComponent(
                    currentUrl
                  )}`}
                >
                  <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewLoopPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewLoopPageContent />
    </Suspense>
  );
}
