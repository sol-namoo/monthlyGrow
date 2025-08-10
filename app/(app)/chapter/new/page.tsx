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
import { useAuthState } from "react-firebase-hooks/auth";
import { useQuery } from "@tanstack/react-query";
import {
  auth,
  findChapterByMonth,
  deleteChapterById,
  connectPendingProjectsToNewChapter,
  fetchAllProjectsByUserId,
  fetchAllAreasByUserId,
  fetchUnconnectedProjects,
  db,
} from "@/lib/firebase";
import {
  addDoc,
  collection,
  writeBatch,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import { ProjectSelectionSheet } from "@/components/ui/project-selection-sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import Loading from "@/components/feedback/Loading";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatDateForInput } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

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

function NewChapterPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();

  // 기본 폼 스키마 정의
  const chapterFormSchema = z
    .object({
      title: z
        .string()
        .min(1, translate("chapterNew.validation.titleRequired")),
      reward: z
        .string()
        .min(1, translate("chapterNew.validation.rewardRequired")),
      selectedMonth: z
        .string()
        .min(1, translate("chapterNew.validation.monthRequired")),
      startDate: z
        .string()
        .min(1, translate("chapterNew.validation.startDateRequired")),
      endDate: z
        .string()
        .min(1, translate("chapterNew.validation.endDateRequired")),
      selectedAreas: z
        .array(z.string())
        .min(1, translate("chapterNew.validation.areasRequired")),
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
        message: translate("chapterNew.monthLimit"),
        path: ["selectedMonth"],
      }
    );

  type ChapterFormData = z.infer<typeof chapterFormSchema>;

  // 로그인 상태 확인 및 리다이렉션
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: translate("chapterNew.loginRequired.title"),
        description: translate("chapterNew.loginRequired.description"),
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, userLoading, toast, router]);

  // URL 파라미터에서 chapterId와 addedMidway 값을 가져옴

  // 사용자의 연결되지 않은 프로젝트들만 가져오기
  const { data: unconnectedProjects = [], isLoading: projectsLoading } =
    useQuery({
      queryKey: ["unconnectedProjects", user?.uid],
      queryFn: () => fetchUnconnectedProjects(user?.uid || ""),
      enabled: !!user?.uid,
    });

  // 사용자의 모든 영역 가져오기
  const { data: allAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 중복 챕터 관련 상태
  const [existingChapter, setExistingChapter] = useState<any>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false);
  const [blockedMonth, setBlockedMonth] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<any>(null); // 삭제할 챕터 정보 임시 저장

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
  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
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
  const [currentUrl, setCurrentUrl] = useState("/chapter/new");

  // 월 선택 변경 핸들러
  const handleMonthChange = async (selectedMonth: string) => {
    if (!selectedMonth || !user?.uid) return;

    // 빈 값이거나 유효하지 않은 형식이면 중복 확인하지 않음
    if (selectedMonth === "" || !selectedMonth.includes("-")) return;

    // 차단된 월인지 확인
    if (blockedMonth === selectedMonth) {
      form.setValue("selectedMonth", "");
      toast({
        title: translate("chapterNew.monthSelection.limitTitle"),
        description: translate("chapterNew.monthSelection.limitDescription"),
        variant: "destructive",
      });
      return;
    }

    const [year, month] = selectedMonth.split("-").map(Number);

    // 중복 챕터 확인
    try {
      const existing = await findChapterByMonth(user.uid, year, month);
      if (existing) {
        setExistingChapter(existing);
        setShowDuplicateDialog(true);
        return; // 중복 확인 대화상자가 나올 때까지 진행하지 않음
      }
    } catch (error) {
      console.error("중복 챕터 확인 중 오류:", error);
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

    // 제목에 기본값 설정 ("n월 챕터: ")
    const monthName = startOfMonth.toLocaleDateString("ko-KR", {
      month: "long",
    });

    const currentTitle = form.getValues("title");
    // 기존 제목이 없거나 이전 월 챕터 패턴이면 새로 설정
    if (!currentTitle || /^\d+월 챕터:/.test(currentTitle)) {
      form.setValue("title", `${monthName} 챕터: `);
    }
  };

  // 중복 챕터 대체 확인
  const handleDuplicateConfirm = async (shouldReplace: boolean) => {
    if (!shouldReplace) {
      // 대체하지 않음 - 월 선택 초기화하고 해당 월 차단
      const selectedMonth = form.getValues("selectedMonth");
      setBlockedMonth(selectedMonth);
      form.setValue("selectedMonth", "");
      setShowDuplicateDialog(false);
      setExistingChapter(null);
      setChapterToDelete(null);
      return;
    }

    // 기존 챕터 정보를 임시 저장하고 계속 진행
    if (existingChapter) {
      setChapterToDelete(existingChapter);
      toast({
        title: translate("chapterNew.success.existingChapterDeleted.title"),
        description: translate(
          "chapterNew.success.existingChapterDeleted.description"
        ),
      });

      // 월 변경 사항 적용
      const selectedMonth = form.getValues("selectedMonth");
      const [year, month] = selectedMonth.split("-").map(Number);
      applyMonthChanges(year, month);
    }

    setShowDuplicateDialog(false);
    setExistingChapter(null);
  };

  // 실제 areas 데이터 사용 (allAreas)
  const areas = allAreas;

  // 폼 데이터를 URL에 자동 저장
  useEffect(() => {
    const formData = form.watch();
    const url = new URL(window.location.href);

    // 챕터 기본 정보 저장
    if (formData.title) {
      url.searchParams.set("chapterTitle", formData.title);
    } else {
      url.searchParams.delete("chapterTitle");
    }

    if (formData.reward) {
      url.searchParams.set("chapterReward", formData.reward);
    } else {
      url.searchParams.delete("chapterReward");
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
    const chapterTitleParam = searchParams.get("chapterTitle");
    const chapterRewardParam = searchParams.get("chapterReward");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const selectedAreasParam = searchParams.get("selectedAreas");
    const selectedExistingProjectsParam = searchParams.get(
      "selectedExistingProjects"
    );
    const newProjectId = searchParams.get("newProjectId");

    // 챕터 기본 정보 복원
    if (chapterTitleParam) {
      form.setValue("title", chapterTitleParam);
    }
    if (chapterRewardParam) {
      form.setValue("reward", chapterRewardParam);
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
        title: translate("chapterNew.success.projectCreated"),
        description: translate("chapterNew.success.projectCreatedDescription"),
      });
    }
  }, [searchParams, form, toast]);

  // 로딩 상태 확인
  if (projectsLoading || areasLoading) {
    return <Loading />;
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

  const onSubmit = async (data: ChapterFormData) => {
    // 차단된 월인지 최종 확인
    if (blockedMonth === data.selectedMonth) {
      setShowFinalConfirmDialog(true);
      return;
    }

    // 중복 챕터 최종 확인
    if (user?.uid && data.selectedMonth) {
      const [year, month] = data.selectedMonth.split("-").map(Number);
      try {
        const existing = await findChapterByMonth(user.uid, year, month);
        if (existing) {
          setShowFinalConfirmDialog(true);
          return;
        }
      } catch (error) {
        console.error("최종 중복 확인 중 오류:", error);
      }
    }

    // 실제 챕터 생성
    createChapter(data);
  };

  const createChapter = async (data: ChapterFormData) => {
    if (!user?.uid) return;

    try {
      // 기존 챕터가 있다면 먼저 삭제
      if (chapterToDelete) {
        await deleteChapterById(chapterToDelete.id);
        toast({
          title: translate(
            "chapterNew.success.existingChapterDeletedDescription"
          ),
          description: `${chapterToDelete.title}가 삭제되었습니다.`,
        });
      }

      // 챕터 생성
      const chapterData = {
        userId: user.uid,
        title: data.title,
        reward: data.reward,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        // projectIds는 더 이상 사용하지 않음 (connectedChapters로 대체)
        retrospective: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firebase에 챕터 추가
      const newChapterId = await addDoc(
        collection(db, "chapters"),
        chapterData
      );

      // 선택된 기존 프로젝트들을 새 챕터에 연결
      if (data.selectedExistingProjects.length > 0) {
        const batch = writeBatch(db);

        for (const projectId of data.selectedExistingProjects) {
          const projectRef = doc(db, "projects", projectId);
          const projectDoc = await getDoc(projectRef);

          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const connectedChapters = projectData.connectedChapters || [];

            if (!connectedChapters.includes(newChapterId.id)) {
              batch.update(projectRef, {
                connectedChapters: [...connectedChapters, newChapterId.id],
                updatedAt: Timestamp.now(),
              });
            }
          }
        }

        await batch.commit();
      }

      // 대기 중인 프로젝트들을 새 챕터에 자동 연결
      await connectPendingProjectsToNewChapter(user.uid, newChapterId.id);

      toast({
        title: translate("chapterNew.success.title"),
        description: `${data.title} ${translate(
          "chapterNew.success.description"
        )}`,
      });

      // 챕터 상세 페이지로 이동 (replace로 히스토리 대체)
      router.replace(`/chapter/${newChapterId.id}`);
    } catch (error) {
      console.error("챕터 생성 중 오류:", error);
      toast({
        title: translate("chapterNew.error.title"),
        description: translate("chapterNew.error.description"),
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
            <Link href="/chapter">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {monthName} {translate("chapterNew.title")}
          </h1>
        </div>

        <div className="text-center py-12">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted/50 p-8">
              <Compass className="h-16 w-16 text-muted-foreground/50" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-4">
            {translate("chapterNew.noAreas.title")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            {translate("chapterNew.noAreas.description")}
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full max-w-xs">
              <Link
                href={`/para/areas/new?returnUrl=${encodeURIComponent(
                  `/chapter/new${
                    searchParams.get("startDate")
                      ? `?startDate=${searchParams.get("startDate")}`
                      : ""
                  }`
                )}`}
              >
                <Plus className="mr-2 h-4 w-4" />
                {translate("chapterNew.noAreas.createArea")}
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full max-w-xs bg-transparent"
            >
              <Link href="/para">
                {translate("chapterNew.noAreas.viewPara")}
              </Link>
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
          <Link href="/chapter">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{translate("chapterNew.title")}</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">
            {translate("chapterNew.basicInfo.title")}
          </h2>
          <div className="space-y-4">
            {/* 월 선택 */}
            <div>
              <Label htmlFor="selectedMonth">
                {translate("chapterNew.basicInfo.monthSelection")}
              </Label>
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
                  <SelectValue
                    placeholder={translate(
                      "chapterNew.basicInfo.monthPlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      <div className="flex items-center gap-2">
                        <span>{month.label}</span>
                        {month.isThisMonth && (
                          <Badge variant="secondary" className="text-xs">
                            {translate("chapterNew.monthSelection.current")}
                          </Badge>
                        )}
                        {month.isNextMonth && (
                          <Badge variant="outline" className="text-xs">
                            {translate("chapterNew.monthSelection.next")}
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
              <p className="text-xs text-muted-foreground mt-1">
                {translate("chapterNew.monthSelection.hint")}
              </p>
            </div>

            <div>
              <Label htmlFor="title">
                {translate("chapterNew.basicInfo.chapterTitle")}
              </Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder={translate(
                  "chapterNew.basicInfo.chapterTitlePlaceholder"
                )}
                className="mt-1"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="reward">
                {translate("chapterNew.basicInfo.reward")}
              </Label>
              <Input
                id="reward"
                {...form.register("reward")}
                placeholder={translate(
                  "chapterNew.basicInfo.rewardPlaceholder"
                )}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {translate("chapterNew.basicInfo.rewardHint")}
              </p>
              {form.formState.errors.reward && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.reward.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">
                  {translate("chapterNew.basicInfo.startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                  className="mt-1"
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("chapterNew.basicInfo.dateHint")}
                </p>
              </div>

              <div>
                <Label htmlFor="endDate">
                  {translate("chapterNew.basicInfo.endDate")}
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register("endDate")}
                  className="mt-1"
                  readOnly
                  disabled
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {translate("chapterNew.basicInfo.endDateHint")}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Focus Areas */}
        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">
            {translate("chapterNew.focusAreas.title")}
          </h2>

          <div className="mb-4 space-y-2">
            <RecommendationBadge
              type="info"
              message={translate("chapterNew.focusAreas.recommendation")}
            />
            {form.watch("selectedAreas").length > 2 && (
              <RecommendationBadge
                type="warning"
                message={translate("chapterNew.focusAreas.warning")}
              />
            )}
          </div>
          {areas.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {areas
                  .filter((area) => area.name !== "미분류")
                  .map((area) => {
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
            </>
          ) : (
            <div className="text-center py-6">
              <div className="mb-3 flex justify-center">
                <div className="rounded-full bg-muted/50 p-3">
                  <Compass className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {translate("chapterNew.focusAreas.noAreas")}
              </p>
              <Button asChild size="sm" variant="outline">
                <Link href="/para/areas/new?returnUrl=/chapter/new">
                  {translate("chapterNew.focusAreas.createArea")}
                </Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Project Connection */}
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">
              {translate("chapterNew.projects.title")}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {translate("chapterNew.projects.description")}
            </p>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowProjectModal(true)}
                className="flex-1"
              >
                {translate("chapterNew.projects.selectExisting")}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewProjectDialog(true)}
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                {translate("chapterNew.projects.createNew")}
              </Button>
            </div>
          </div>

          {/* 선택된 프로젝트 표시 */}
          {form.watch("selectedExistingProjects").length > 0 && (
            <div className="space-y-3 mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  {translate("chapterNew.projects.connectedProjects")}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {form.watch("selectedExistingProjects").length}개
                </Badge>
              </div>
              <div className="space-y-2">
                {form.watch("selectedExistingProjects").map((projectId) => {
                  const project = unconnectedProjects.find(
                    (p) => p.id === projectId
                  );
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
                {translate("chapterNew.projects.noConnectedProjects")}
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            <RecommendationBadge
              type="info"
              message={translate("chapterNew.projects.recommendation")}
            />

            {form.watch("selectedExistingProjects").length > 3 && (
              <RecommendationBadge
                type="warning"
                message={translate("chapterNew.projects.warning")}
              />
            )}
          </div>
        </Card>

        {/* 프로젝트 선택 바텀시트 */}
        <ProjectSelectionSheet
          open={showProjectModal}
          onOpenChange={(open) => {
            setShowProjectModal(open);
            if (!open) {
              // 바텀시트가 닫힐 때 새로 생성된 프로젝트 ID 초기화
              setNewlyCreatedProjectId(undefined);
            }
          }}
          selectedProjects={form.watch("selectedExistingProjects")}
          onProjectToggle={toggleExistingProject}
          onConfirm={() => setShowProjectModal(false)}
          newlyCreatedProjectId={newlyCreatedProjectId}
          projects={unconnectedProjects}
          areas={allAreas}
          projectsLoading={projectsLoading}
          areasLoading={areasLoading}
          key={projectModalRefreshKey} // 리프레시를 위한 키
        />

        {/* 제출 버튼 */}
        <Button type="submit" className="w-full" size="lg">
          {translate("chapterNew.createChapter")}
        </Button>
      </form>

      {/* 새 프로젝트 만들기 안내 다이얼로그 - 폼 밖으로 이동 */}
      <Dialog
        open={showNewProjectDialog}
        onOpenChange={setShowNewProjectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("chapterNew.projects.newProjectDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {translate("chapterNew.projects.newProjectDialog.description")}
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
                    {translate(
                      "chapterNew.projects.newProjectDialog.createNew"
                    )}
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {translate(
                      "chapterNew.projects.newProjectDialog.createDescription"
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-700">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-1 mt-0.5">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                    {translate("chapterNew.projects.newProjectDialog.note")}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {translate(
                      "chapterNew.projects.newProjectDialog.noteDescription"
                    )}
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
                  <Plus className="mr-2 h-4 w-4" />
                  {translate("chapterNew.projects.createNew")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/para?tab=projects">
                  {translate(
                    "chapterNew.projects.newProjectDialog.viewProjects"
                  )}
                </Link>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowNewProjectDialog(false)}
            >
              {translate("chapterNew.projects.newProjectDialog.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 중복 챕터 대체 확인 대화상자 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("chapterNew.duplicateChapter.title")}
            </DialogTitle>
            <DialogDescription>
              {translate("chapterNew.duplicateChapter.description")}
            </DialogDescription>
          </DialogHeader>

          {existingChapter && (
            <div className="my-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">
                {translate("chapterNew.duplicateChapter.existingChapterInfo")}
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div>
                  {translate("chapterNew.duplicateChapter.titleLabel")}:{" "}
                  {existingChapter.title}
                </div>
                <div>
                  {translate("chapterNew.duplicateChapter.periodLabel")}:{" "}
                  {formatDate(existingChapter.startDate)} ~{" "}
                  {formatDate(existingChapter.endDate)}
                </div>
                <div>
                  {translate(
                    "chapterNew.duplicateChapter.connectedProjectsLabel"
                  )}
                  : {translate("chapterNew.duplicateChapter.projectsCount")}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="text-primary">💡</span>
              <span>{translate("chapterNew.duplicateChapter.tip")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              <span>{translate("chapterNew.duplicateChapter.warning")}</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDuplicateConfirm(false)}
            >
              {translate("chapterNew.duplicateChapter.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDuplicateConfirm(true)}
            >
              {translate("chapterNew.duplicateChapter.replace")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 최종 챕터 생성 확인 대화상자 */}
      <Dialog
        open={showFinalConfirmDialog}
        onOpenChange={setShowFinalConfirmDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {translate("chapterNew.finalConfirm.title")}
            </DialogTitle>
            <DialogDescription>
              {translate("chapterNew.finalConfirm.description")}
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm text-muted-foreground">
            <p>{translate("chapterNew.finalConfirm.warning")}</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFinalConfirmDialog(false)}
            >
              {translate("chapterNew.finalConfirm.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const formData = form.getValues();
                setShowFinalConfirmDialog(false);
                createChapter(formData);
              }}
            >
              {translate("chapterNew.finalConfirm.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewChapterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewChapterPageContent />
    </Suspense>
  );
}
