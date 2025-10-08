"use client";

import type React from "react";
import { useState, use, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Info,
  X,
  Plus,
  Target,
  Clock,
  Trophy,
  FolderOpen,
  ExternalLink,
  Edit,
  Compass,
  Heart,
  Brain,
  Briefcase,
  DollarSign,
  Users,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import { Progress } from "@/components/ui/progress";
import {
  formatDate,
  getMonthlyStatus,
  getMonthStartDate,
  getMonthEndDate,
} from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { useLanguage } from "@/hooks/useLanguage";
import {
  fetchMonthlyById,
  updateMonthly,
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  createUnifiedArchive,
  updateUnifiedArchive,
  fetchSingleArchive,
} from "@/lib/firebase/index";
import { useToast } from "@/hooks/use-toast";
import { KeyResult } from "@/lib/types";

import { RetrospectiveForm } from "@/components/RetrospectiveForm";
import { NoteForm } from "@/components/NoteForm";

// 아이콘 컴포넌트 가져오기 함수
const getIconComponent = (iconId: string) => {
  const iconMap: Record<string, any> = {
    compass: Compass,
    heart: Heart,
    brain: Brain,
    briefcase: Briefcase,
    dollarSign: DollarSign,
    users: Users,
    gamepad2: Gamepad2,
    dumbbell: Dumbbell,
    bookOpen: BookOpen,
    home: Home,
    car: Car,
    plane: Plane,
    camera: Camera,
    music: Music,
    palette: Palette,
    utensils: Utensils,
  };
  return iconMap[iconId] || Compass;
};

// 로딩 스켈레톤 컴포넌트
function EditMonthlySkeleton() {
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

export default function EditMonthlyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();

  const { id } = use(params);

  // 폼 상태
  const [objective, setObjective] = useState("");
  const [objectiveDescription, setObjectiveDescription] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [reward, setReward] = useState("");
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<
    Array<{
      projectId: string;
      monthlyTargetCount?: number;
    }>
  >([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);

  const [showProjectConnectionDialog, setShowProjectConnectionDialog] =
    useState(false);

  // 선택 가능한 월 옵션 생성 (현재 월부터 6개월)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const targetMonth = currentMonth + i;
    const targetYear = currentYear + Math.floor((targetMonth - 1) / 12);
    const normalizedMonth = ((targetMonth - 1) % 12) + 1;
    return {
      year: targetYear,
      month: normalizedMonth,
      label: `${targetYear}년 ${normalizedMonth}월`,
    };
  });
  const [activeTab, setActiveTab] = useState("key-results");
  const [openProjects, setOpenProjects] = useState<string[]>([]);
  const [showRetrospectiveModal, setShowRetrospectiveModal] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);

  // 연결된 프로젝트들의 상세 정보 가져오기 (선택된 프로젝트 정보 표시용)
  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // Area 정보 가져오기
  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 먼슬리 데이터 조회
  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly", id],
    queryFn: () => fetchMonthlyById(id),
    enabled: !!id,
  });

  // 폼 데이터 초기화
  useEffect(() => {
    if (monthly) {
      setObjective(monthly.objective || "");
      setObjectiveDescription(monthly.objectiveDescription || "");
      setReward(monthly.reward || "");
      // 기존 먼슬리의 년/월 추출
      const startDateObj =
        monthly.startDate instanceof Date
          ? monthly.startDate
          : (monthly.startDate as any).toDate();
      setSelectedYear(startDateObj.getFullYear());
      setSelectedMonth(startDateObj.getMonth() + 1);
      setKeyResults(monthly.keyResults || []);
      setSelectedProjects(
        (monthly.quickAccessProjects || []).map((projectId) => ({
          projectId,
          monthlyTargetCount: 1,
        }))
      );
      setSelectedFocusAreas(monthly.focusAreas || []);
    }
  }, [monthly]);

  // 헬퍼 함수들
  const completedKeyResults = keyResults.filter((kr) => kr.isCompleted).length;
  const totalKeyResults = keyResults.length;
  const keyResultsProgress =
    totalKeyResults > 0
      ? Math.round((completedKeyResults / totalKeyResults) * 100)
      : 0;

  const toggleKeyResultCompletion = (keyResultId: string) => {
    setKeyResults((prev) =>
      prev.map((kr) =>
        kr.id === keyResultId ? { ...kr, isCompleted: !kr.isCompleted } : kr
      )
    );
  };

  const toggleProject = (projectName: string) => {
    setOpenProjects((prev) =>
      prev.includes(projectName)
        ? prev.filter((p) => p !== projectName)
        : [...prev, projectName]
    );
  };

  // 먼슬리 업데이트 뮤테이션
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!monthly) throw new Error("먼슬리를 찾을 수 없습니다.");

      const updatedMonthly = {
        objective,
        objectiveDescription,
        reward,
        keyResults,
        startDate: getMonthStartDate(selectedYear, selectedMonth),
        endDate: getMonthEndDate(selectedYear, selectedMonth),
        quickAccessProjects: selectedProjects.map((p) => p.projectId),
        focusAreas: selectedFocusAreas,
      };

      await updateMonthly(monthly.id, updatedMonthly);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthly", id] });
      queryClient.invalidateQueries({ queryKey: ["monthlies"] });
      toast({
        title: translate("monthlyEdit.success.title"),
        description: translate("monthlyEdit.success.description"),
      });
      router.push(`/monthly/${id}`);
    },
    onError: (error) => {
      console.error("먼슬리 업데이트 실패:", error);
      toast({
        title: translate("monthlyEdit.error.title"),
        description: translate("monthlyEdit.error.description"),
        variant: "destructive",
      });
    },
  });

  // Key Result 추가
  const addKeyResult = () => {
    setKeyResults([
      ...keyResults,
      {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        isCompleted: false,
      },
    ]);
  };

  // Key Result 제거
  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  // Key Result 업데이트
  const updateKeyResult = (
    index: number,
    field: keyof KeyResult,
    value: string | boolean
  ) => {
    const updatedKeyResults = [...keyResults];
    updatedKeyResults[index] = {
      ...updatedKeyResults[index],
      [field]: value,
    };
    setKeyResults(updatedKeyResults);
  };

  // 폼 제출
  const handleSubmit = () => {
    if (!objective.trim()) {
      toast({
        title: translate("monthlyEdit.validation.title"),
        description: translate("monthlyEdit.validation.objectiveRequired"),
        variant: "destructive",
      });
      return;
    }

    if (keyResults.length === 0) {
      toast({
        title: translate("monthlyEdit.validation.title"),
        description: translate("monthlyEdit.validation.minKeyResults"),
        variant: "destructive",
      });
      return;
    }

    if (keyResults.some((kr) => !kr.title.trim())) {
      toast({
        title: translate("monthlyEdit.validation.title"),
        description: translate("monthlyEdit.validation.keyResultRequired"),
        variant: "destructive",
      });
      return;
    }

    updateMutation.mutate();
  };

  // 로딩 상태
  if (userLoading || monthlyLoading) {
    return <EditMonthlySkeleton />;
  }

  if (!monthly) {
    return (
      <div className="container max-w-md px-4 py-6 pb-20">
        <div className="text-center py-12">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {translate("monthlyEdit.error.notFound")}
          </h2>
          <p className="text-muted-foreground mb-4">
            {translate("monthlyEdit.error.notFoundDescription")}
          </p>
          <Button asChild>
            <Link href="/monthly">
              {translate("monthlyEdit.error.backToList")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const status = getMonthlyStatus(monthly);

  return (
    <div className="container max-w-md px-3 py-4 pb-20">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{translate("monthlyEdit.title")}</h1>
        <div className="w-10"></div>
      </div>

      {/* 상태 경고 */}
      {status === "planned" && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            아직 시작하지 않은 먼슬리입니다. 회고와 노트는 먼슬리가 시작된 후에
            작성할 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Monthly Info Card */}
      <Card className="p-4 mb-4 border border-border">
        <div className="space-y-4">
          <div>
            <div className="mb-4">
              <Label className="text-sm font-medium text-muted-foreground">
                {translate("monthlyEdit.basicInfo.monthSelection")}
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Select
                  value={`${selectedYear}-${selectedMonth}`}
                  onValueChange={(value) => {
                    const [year, month] = value.split("-").map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                  disabled={status !== "planned"}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={translate(
                        "monthlyEdit.basicInfo.monthPlaceholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem
                        key={`${option.year}-${option.month}`}
                        value={`${option.year}-${option.month}`}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge
                  variant="outline"
                  className="text-sm font-medium w-12 flex-shrink-0"
                >
                  {selectedMonth}월
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <Clock className="h-4 w-4" />
                <span>
                  {formatDate(
                    getMonthStartDate(selectedYear, selectedMonth),
                    "ko"
                  )}
                </span>
                <span>-</span>
                <span>
                  {formatDate(
                    getMonthEndDate(selectedYear, selectedMonth),
                    "ko"
                  )}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="objective"
                className="text-sm font-medium text-muted-foreground"
              >
                {translate("monthlyEdit.form.objective")}
              </Label>
              <Input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder={translate("monthlyEdit.form.objectivePlaceholder")}
                className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0"
                disabled={status === "ended"}
              />
              <Textarea
                value={objectiveDescription}
                onChange={(e) => setObjectiveDescription(e.target.value)}
                placeholder={translate(
                  "monthlyEdit.form.keyResultDescriptionPlaceholder"
                )}
                className="text-sm text-muted-foreground border-none bg-transparent p-0 resize-none focus-visible:ring-0"
                rows={2}
                disabled={status === "ended"}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge
              className={
                status === "planned"
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                  : status === "ended"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-primary hover:bg-primary/90 text-white"
              }
            >
              {status === "planned"
                ? translate("monthly.status.planned")
                : status === "ended"
                ? translate("monthly.status.ended")
                : translate("monthly.status.inProgress")}
            </Badge>
          </div>

          {/* Key Results 진행률 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {translate("monthly.currentMonthly.keyResultsTitle")} 진행률
              </span>
              <span className="text-sm font-bold">{keyResultsProgress}%</span>
            </div>
            <Progress value={keyResultsProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {completedKeyResults}/{totalKeyResults} 완료
            </p>
          </div>

          {/* 보상 */}
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                목표 달성 보상
              </span>
            </div>
            <Input
              value={reward}
              onChange={(e) => setReward(e.target.value)}
              placeholder="목표 달성 시 받을 보상"
              className="text-sm text-yellow-700 border-none bg-transparent p-0 focus-visible:ring-0"
              disabled={status === "ended"}
            />
            <p className="text-xs text-yellow-600 mt-1">
              예: 🎮 새로운 게임 구매하기, 🍕 맛있는 음식 먹기
            </p>
          </div>
        </div>
      </Card>

      {/* 중점 영역 선택 (선택사항) */}
      <Card className="p-4 mb-4">
        <div className="mb-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            중점 영역 선택
            <Badge variant="secondary" className="text-xs">
              선택사항
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            이번 달에 집중할 영역을 선택하세요
          </p>
        </div>

        {/* Area 선택 그리드 */}
        <div className="grid grid-cols-4 gap-1.5">
          {allAreas.map((area) => {
            const IconComponent = getIconComponent(area.icon || "compass");
            const isSelected = selectedFocusAreas.includes(area.id);

            return (
              <div
                key={area.id}
                className={`flex flex-col items-center justify-center rounded-lg border p-2 cursor-pointer transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
                onClick={() => {
                  if (isSelected) {
                    setSelectedFocusAreas((prev) =>
                      prev.filter((id) => id !== area.id)
                    );
                  } else {
                    setSelectedFocusAreas((prev) => [...prev, area.id]);
                  }
                }}
              >
                <div
                  className="mb-1.5 rounded-full p-1.5"
                  style={{
                    backgroundColor: `${area.color}20`,
                  }}
                >
                  <IconComponent
                    className="h-3 w-3"
                    style={{ color: area.color }}
                  />
                </div>
                <span className="text-xs text-center font-medium leading-tight">
                  {area.name}
                </span>
              </div>
            );
          })}
        </div>

        {selectedFocusAreas.length > 0 && (
          <div className="mt-3 p-2 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              선택된 영역:{" "}
              {selectedFocusAreas
                .map((id) => allAreas.find((a) => a.id === id)?.name)
                .join(", ")}
            </p>
          </div>
        )}
      </Card>

      {/* 프로젝트 연결 (선택사항) */}
      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              프로젝트 연결
              <Badge variant="secondary" className="text-xs">
                선택사항
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              이 먼슬리와 연결된 프로젝트들
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setShowProjectConnectionDialog(true)}
          >
            <Edit className="mr-1 h-3 w-3" />
            프로젝트 선택
          </Button>
        </div>

        {selectedProjects.length > 0 ? (
          <div className="space-y-2">
            {selectedProjects.map((selectedProject) => {
              const projectInfo = allProjects.find(
                (p: any) => p.id === selectedProject.projectId
              );
              return (
                <Link
                  key={selectedProject.projectId}
                  href={`/para/projects/${selectedProject.projectId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {projectInfo?.title ||
                          `프로젝트 ID: ${selectedProject.projectId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {projectInfo?.area ||
                          translate("monthlyDetail.uncategorized")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-muted/20 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              연결된 프로젝트가 없습니다
            </p>
          </div>
        )}
      </Card>

      {/* Key Results */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {translate("monthlyDetail.tabs.keyResults")}
        </h2>

        <div className="space-y-4">
          <div className="p-3 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {translate("monthlyEdit.form.keyResultsGuide")}
            </p>
          </div>

          {keyResults.map((keyResult, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {translate("monthlyDetail.keyResult")} {index + 1}
                </span>
                {keyResults.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKeyResult(index)}
                    disabled={status === "ended"}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  value={keyResult.title}
                  onChange={(e) =>
                    updateKeyResult(index, "title", e.target.value)
                  }
                  placeholder={translate(
                    "monthlyEdit.form.keyResultTitlePlaceholder"
                  )}
                  disabled={status === "ended"}
                />
                <Textarea
                  value={keyResult.description}
                  onChange={(e) =>
                    updateKeyResult(index, "description", e.target.value)
                  }
                  placeholder={translate(
                    "monthlyEdit.form.keyResultDescriptionPlaceholder"
                  )}
                  rows={2}
                  disabled={status === "ended"}
                />
              </div>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full bg-transparent"
            onClick={addKeyResult}
            disabled={status === "ended"}
          >
            <Plus className="mr-2 h-4 w-4" />
            Key Result 추가
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            className="w-full"
            disabled={status === "ended"}
          >
            완료
          </Button>
        </div>
      </div>

      {/* 프로젝트 바로가기 다이얼로그 */}

      {/* 회고 작성 모달 */}
      {showRetrospectiveModal && (
        <RetrospectiveForm
          type="monthly"
          title={monthly?.objective || ""}
          keyResults={monthly?.keyResults || []}
          onClose={() => setShowRetrospectiveModal(false)}
          onSave={async (data) => {
            try {
              // 먼슬리 회고 저장 로직
              const retrospectiveData = {
                userId: user?.uid || "",
                monthlyId: monthly?.id || "",
                ...data,
              };

              // 기존 회고가 있는지 확인
              const existingArchive = await fetchSingleArchive(
                user?.uid || "",
                monthly?.id || "",
                "monthly_retrospective"
              );

              if (existingArchive) {
                // 기존 아카이브 업데이트
                await updateUnifiedArchive(existingArchive.id, {
                  title: data.title || monthly?.objective || "",
                  content: data.content || "",
                  userRating: data.userRating,
                  bookmarked: data.bookmarked,
                  bestMoment: data.bestMoment,
                  routineAdherence: data.routineAdherence,
                  unexpectedObstacles: data.unexpectedObstacles,
                  nextMonthlyApplication: data.nextMonthlyApplication,
                });
              } else {
                // 새 아카이브 생성
                await createUnifiedArchive({
                  userId: user?.uid || "",
                  type: "monthly_retrospective",
                  parentId: monthly?.id || "",
                  title: data.title || monthly?.objective || "",
                  content: data.content || "",
                  userRating: data.userRating,
                  bookmarked: data.bookmarked,
                  bestMoment: data.bestMoment,
                  routineAdherence: data.routineAdherence,
                  unexpectedObstacles: data.unexpectedObstacles,
                  nextMonthlyApplication: data.nextMonthlyApplication,
                });
              }

              toast({
                title: "회고 저장 완료",
                description: "회고가 성공적으로 저장되었습니다.",
              });
              setShowRetrospectiveModal(false);
            } catch (error) {
              console.error("회고 저장 실패:", error);
              toast({
                title: "회고 저장 실패",
                description: "회고 저장 중 오류가 발생했습니다.",
                variant: "destructive",
              });
            }
          }}
        />
      )}

      {/* 노트 편집 모달 */}
      {showNoteForm && monthly && (
        <NoteForm
          type="monthly"
          parent={monthly}
          onClose={() => setShowNoteForm(false)}
          onSave={() => {
            // 노트 저장 후 데이터 새로고침
            queryClient.invalidateQueries({
              queryKey: ["monthly", monthly.id],
            });
          }}
        />
      )}
    </div>
  );
}
