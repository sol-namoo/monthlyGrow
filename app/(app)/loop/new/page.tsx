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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import Loading from "@/components/feedback/Loading";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuthState } from "react-firebase-hooks/auth";
import { useQuery } from "@tanstack/react-query";
import {
  auth,
  findLoopByMonth,
  deleteLoopById,
  connectPendingProjectsToNewLoop,
  fetchAllProjectsByUserId,
  fetchAllAreasByUserId,
  db,
} from "@/lib/firebase";
import { addDoc, collection } from "firebase/firestore";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import { ProjectSelectionModal } from "@/components/ui/project-selection-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";

// 기본 폼 스키마 정의
const loopFormSchema = z
  .object({
    title: z.string().min(1, "루프 제목을 입력해주세요"),
    reward: z.string().min(1, "보상을 입력해주세요"),
    selectedMonth: z.string().min(1, "루프 월을 선택해주세요"),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    endDate: z.string().min(1, "종료일을 입력해주세요"),
    selectedAreas: z.array(z.string()).min(1, "최소 1개의 영역을 선택해주세요"),
    selectedExistingProjects: z.array(z.string()),
  })
  .refine(
    (data) => {
      // 6개월 제한 체크
      const selectedDate = new Date(data.selectedMonth + "-01");
      const sixMonthsLater = new Date();
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

      return selectedDate <= sixMonthsLater;
    },
    {
      message: "루프는 최대 6개월 후까지만 생성할 수 있습니다",
      path: ["selectedMonth"],
    }
  );

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
  const [user] = useAuthState(auth);

  // 사용자의 모든 프로젝트 가져오기
  const { data: allProjects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 사용자의 모든 영역 가져오기
  const { data: allAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 중복 루프 관련 상태
  const [existingLoop, setExistingLoop] = useState<any>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  const [blockedMonth, setBlockedMonth] = useState<string | null>(null);
  const [loopToDelete, setLoopToDelete] = useState<any>(null); // 삭제할 루프 정보 임시 저장

  // 6개월 후까지의 월 옵션 생성
  const getAvailableMonths = () => {
    const months = [];
    const today = new Date();

    for (let i = 0; i <= 6; i++) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const yearMonth = `${targetDate.getFullYear()}-${String(
        targetDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = targetDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
      });

      months.push({
        value: yearMonth,
        label: monthName,
        isThisMonth: i === 0,
        isNextMonth: i === 1,
      });
    }

    return months;
  };

  // react-hook-form 설정
  const form = useForm<LoopFormData>({
    resolver: zodResolver(loopFormSchema),
    defaultValues: {
      title: "",
      reward: "",
      selectedMonth: "",
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

  // 사용자 설정 불러오기 (Firestore에서)
  useEffect(() => {
    // 기본 보상이 활성화되어 있고, 보상 필드가 비어있을 때만 자동으로 채우기
    if (
      settings.defaultRewardEnabled &&
      settings.defaultReward &&
      !form.getValues("reward")
    ) {
      form.setValue("reward", settings.defaultReward);
    }
  }, [settings, form]);

  // 월 선택 변경 핸들러
  const handleMonthChange = async (selectedMonth: string) => {
    if (!selectedMonth || !user?.uid) return;

    // 빈 값이거나 유효하지 않은 형식이면 중복 확인하지 않음
    if (selectedMonth === "" || !selectedMonth.includes("-")) return;

    // 차단된 월인지 확인
    if (blockedMonth === selectedMonth) {
      form.setValue("selectedMonth", "");
      toast({
        title: "월 선택 제한",
        description:
          "이 월은 기존 루프가 있어 선택할 수 없습니다. 다른 월을 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    const [year, month] = selectedMonth.split("-").map(Number);

    // 중복 루프 확인
    try {
      const existing = await findLoopByMonth(user.uid, year, month);
      if (existing) {
        setExistingLoop(existing);
        setShowDuplicateDialog(true);
        return; // 중복 확인 대화상자가 나올 때까지 진행하지 않음
      }
    } catch (error) {
      console.error("중복 루프 확인 중 오류:", error);
    }

    // 중복이 없으면 계속 진행
    applyMonthChanges(year, month);
  };

  // 월 변경 사항 적용
  const applyMonthChanges = (year: number, month: number) => {
    // 해당 월의 첫 날과 마지막 날 계산
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    // 로컬 시간 기준으로 YYYY-MM-DD 형식 생성
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateString = formatLocalDate(startOfMonth);
    const endDateString = formatLocalDate(endOfMonth);

    form.setValue("startDate", startDateString);
    form.setValue("endDate", endDateString);

    // 제목에 기본값 설정 ("n월 루프: ")
    const monthName = startOfMonth.toLocaleDateString("ko-KR", {
      month: "long",
    });

    const currentTitle = form.getValues("title");
    // 기존 제목이 없거나 이전 월 루프 패턴이면 새로 설정
    if (!currentTitle || /^\d+월 루프:/.test(currentTitle)) {
      form.setValue("title", `${monthName} 루프: `);
    }
  };

  // 중복 루프 대체 확인
  const handleDuplicateConfirm = async (shouldReplace: boolean) => {
    if (!shouldReplace) {
      // 대체하지 않음 - 월 선택 초기화하고 해당 월 차단
      const selectedMonth = form.getValues("selectedMonth");
      setBlockedMonth(selectedMonth);
      form.setValue("selectedMonth", "");
      setShowDuplicateDialog(false);
      setExistingLoop(null);
      setLoopToDelete(null);
      return;
    }

    // 기존 루프 정보를 임시 저장하고 계속 진행
    if (existingLoop) {
      setLoopToDelete(existingLoop);
      toast({
        title: "기존 루프 대체 준비 완료",
        description:
          "루프 생성하기 버튼을 누르면 기존 루프가 삭제되고 새 루프가 생성됩니다.",
      });

      // 월 변경 사항 적용
      const selectedMonth = form.getValues("selectedMonth");
      const [year, month] = selectedMonth.split("-").map(Number);
      applyMonthChanges(year, month);
    }

    setShowDuplicateDialog(false);
    setExistingLoop(null);
  };

  // 실제 areas 데이터 사용 (allAreas)
  const areas = allAreas;

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

  // 로딩 상태 확인
  if (projectsLoading || areasLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="text-center">
          <p>로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

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

  const onSubmit = async (data: LoopFormData) => {
    // 차단된 월인지 최종 확인
    if (blockedMonth === data.selectedMonth) {
      setShowFinalConfirmDialog(true);
      return;
    }

    // 중복 루프 최종 확인
    if (user?.uid && data.selectedMonth) {
      const [year, month] = data.selectedMonth.split("-").map(Number);
      try {
        const existing = await findLoopByMonth(user.uid, year, month);
        if (existing) {
          setShowFinalConfirmDialog(true);
          return;
        }
      } catch (error) {
        console.error("최종 중복 확인 중 오류:", error);
      }
    }

    // 실제 루프 생성
    createLoop(data);
  };

  const createLoop = async (data: LoopFormData) => {
    if (!user?.uid) return;

    try {
      // 기존 루프가 있다면 먼저 삭제
      if (loopToDelete) {
        await deleteLoopById(loopToDelete.id);
        toast({
          title: "기존 루프 삭제 완료",
          description: `${loopToDelete.title}가 삭제되었습니다.`,
        });
      }

      // 루프 생성
      const loopData = {
        userId: user.uid,
        title: data.title,
        reward: data.reward,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        projectIds: data.selectedExistingProjects,
        retrospective: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firebase에 루프 추가
      const newLoopId = await addDoc(collection(db, "loops"), loopData);

      // 대기 중인 프로젝트들을 새 루프에 자동 연결
      await connectPendingProjectsToNewLoop(user.uid, newLoopId.id);

      toast({
        title: "루프 생성 완료",
        description: `${data.title} 루프가 생성되었습니다.`,
      });

      // 루프 목록 페이지로 이동
      router.push("/loop");
    } catch (error) {
      console.error("루프 생성 중 오류:", error);
      toast({
        title: "루프 생성 실패",
        description: "루프 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
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
        <h1 className="text-2xl font-bold">루프 생성</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
          <div className="space-y-4">
            {/* 월 선택 */}
            <div>
              <Label htmlFor="selectedMonth">루프 월 선택</Label>
              <Select
                value={form.watch("selectedMonth")}
                onValueChange={(value) => {
                  form.setValue("selectedMonth", value);
                  // 실제 값이 선택되었을 때만 중복 확인
                  if (value && value !== "") {
                    handleMonthChange(value);
                  }
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="루프를 진행할 월을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      <div className="flex items-center gap-2">
                        <span>{month.label}</span>
                        {month.isThisMonth && (
                          <Badge variant="secondary" className="text-xs">
                            현재
                          </Badge>
                        )}
                        {month.isNextMonth && (
                          <Badge variant="outline" className="text-xs">
                            다음
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.selectedMonth && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.selectedMonth.message}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                💡 루프는 최대 6개월 후까지 생성할 수 있습니다
              </p>
            </div>

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
                  const IconComponent = getIconComponent(
                    area.icon || "compass"
                  );

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
                        style={{
                          backgroundColor: `${area.color || "#6b7280"}20`,
                        }}
                      >
                        <IconComponent
                          className="h-3 w-3"
                          style={{ color: area.color || "#6b7280" }}
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
                {form.watch("selectedExistingProjects").map((projectId) => {
                  const project = allProjects.find((p) => p.id === projectId);
                  if (!project) return null;

                  return (
                    <div
                      key={projectId}
                      className="flex items-center justify-between p-2 bg-background rounded border"
                    >
                      <div>
                        <p className="text-sm font-medium">{project.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {project.area || "미분류"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const current = form.getValues(
                            "selectedExistingProjects"
                          );
                          form.setValue(
                            "selectedExistingProjects",
                            current.filter((id) => id !== projectId)
                          );
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
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
          newlyCreatedProjectId={newlyCreatedProjectId}
          projects={allProjects}
          areas={allAreas}
          projectsLoading={projectsLoading}
          areasLoading={areasLoading}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 프로젝트 만들기</DialogTitle>
            <DialogDescription>
              새 프로젝트를 만들어 루프에 연결하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg border border-border">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1 mt-0.5">
                  <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    새 프로젝트 생성
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    프로젝트 생성 페이지로 이동하여 새 프로젝트를 만들고, 완료
                    후 이 루프 페이지로 돌아와서 연결할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-1 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    참고 사항
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    현재 작성 중인 루프 정보는 저장되므로 안심하고 이동하세요.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button asChild>
                <Link
                  href={`/para/projects/new?returnUrl=${encodeURIComponent(
                    currentUrl
                  )}`}
                >
                  <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/para?tab=projects">기존 프로젝트 목록 보기</Link>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowNewProjectDialog(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 중복 루프 대체 확인 대화상자 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기존 루프가 있습니다</DialogTitle>
            <DialogDescription>
              선택한 월에 이미 루프가 존재합니다. 기존 루프를 대체하고 새로운
              루프를 생성하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          {existingLoop && (
            <div className="my-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">기존 루프 정보</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>제목: {existingLoop.title}</div>
                <div>
                  기간: {formatDate(existingLoop.startDate)} ~{" "}
                  {formatDate(existingLoop.endDate)}
                </div>
                <div>
                  연결된 프로젝트: {existingLoop.projectIds?.length || 0}개
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary">💡</span>
              <span>
                연결된 프로젝트는 삭제되지 않고 루프 연결만 해제됩니다.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              <span>
                기존 루프는 "루프 생성하기" 버튼을 누를 때 삭제됩니다.
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDuplicateConfirm(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDuplicateConfirm(true)}
            >
              기존 루프 대체하고 계속
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 최종 루프 생성 확인 대화상자 */}
      <Dialog
        open={showFinalConfirmDialog}
        onOpenChange={setShowFinalConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프 생성 확인</DialogTitle>
            <DialogDescription>
              선택한 월에 기존 루프가 있거나 이전에 취소한 월입니다. 정말로
              루프를 생성하시겠습니까?
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-muted-foreground">
            <p>⚠️ 기존 루프가 있는 경우 삭제되고 새로운 루프가 생성됩니다.</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalConfirmDialog(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const formData = form.getValues();
                setShowFinalConfirmDialog(false);
                createLoop(formData);
              }}
            >
              확인, 루프 생성
            </Button>
          </DialogFooter>
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
