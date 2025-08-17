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
  Plus,
  Target,
  X,
  AlertCircle,
  FolderOpen,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { useQuery } from "@tanstack/react-query";
import {
  auth,
  findMonthlyByMonth,
  createMonthly,
  deleteMonthlyById,
  fetchAllProjectsByUserId,
} from "@/lib/firebase/index";
import { Monthly, KeyResult } from "@/lib/types";
import Loading from "@/components/feedback/Loading";
import { useLanguage } from "@/hooks/useLanguage";
// import { QuickAccessProjectsDialog } from "@/components/monthly/QuickAccessProjectsDialog";
import { getMonthStartDate, getMonthEndDate } from "@/lib/utils";

type MonthlyFormData = {
  objective: string;
  objectiveDescription?: string;
  reward?: string;
  keyResults: Array<{
    title: string;
    description?: string;
  }>;
};

function NewMonthlyPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();

  // 프로젝트 바로가기 상태
  const [showQuickAccessDialog, setShowQuickAccessDialog] = useState(false);
  const [quickAccessProjects, setQuickAccessProjects] = useState<string[]>([]);

  // 연결된 프로젝트들의 상세 정보 가져오기
  const { data: allProjects = [] } = useQuery({
    queryKey: ["all-projects", user?.uid],
    queryFn: () => fetchAllProjectsByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 다국어화된 스키마 생성
  const keyResultSchema = z.object({
    title: z
      .string()
      .min(1, translate("monthly.new.validation.keyResultRequired")),
    description: z.string().optional(),
  });

  const monthlyFormSchema = z.object({
    objective: z
      .string()
      .min(1, translate("monthly.new.validation.objectiveRequired")),
    objectiveDescription: z.string().optional(),
    reward: z.string().optional(),
    keyResults: z
      .array(keyResultSchema)
      .min(1, translate("monthly.new.validation.minKeyResults")),
  });

  // 현재 날짜 기준으로 년/월 설정
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  // 선택 가능한 월 옵션 생성 (현재 월부터 6개월)
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

  // URL 파라미터에서 년/월 가져오기 (기본값은 현재 월)
  const [selectedYear, setSelectedYear] = useState(
    parseInt(searchParams.get("year") || currentYear.toString())
  );
  const [selectedMonth, setSelectedMonth] = useState(
    parseInt(searchParams.get("month") || currentMonth.toString())
  );

  // 폼 초기값 설정 (타임존 안전한 날짜 계산)
  const defaultStartDate = getMonthStartDate(selectedYear, selectedMonth);
  const defaultEndDate = getMonthEndDate(selectedYear, selectedMonth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<MonthlyFormData>({
    resolver: zodResolver(monthlyFormSchema),
    defaultValues: {
      objective: `${selectedYear}년 ${selectedMonth}월`,
      objectiveDescription: "",
      reward: "",
      keyResults: [{ title: "", description: "" }],
    },
  });

  const watchedKeyResults = watch("keyResults");

  // 기존 먼슬리 확인 (개선된 중복 검증)
  const { data: existingMonthly } = useQuery({
    queryKey: ["existingMonthly", user?.uid, selectedYear, selectedMonth],
    queryFn: () =>
      findMonthlyByMonth(user?.uid || "", selectedYear, selectedMonth),
    enabled: !!user?.uid,
  });

  // Key Result 추가
  const addKeyResult = () => {
    const currentKeyResults = watch("keyResults");
    setValue("keyResults", [
      ...currentKeyResults,
      { title: "", description: "" },
    ]);
  };

  // Key Result 제거
  const removeKeyResult = (index: number) => {
    const currentKeyResults = watch("keyResults");
    if (currentKeyResults.length > 1) {
      setValue(
        "keyResults",
        currentKeyResults.filter((_: any, i: number) => i !== index)
      );
    }
  };

  // 폼 제출
  const onSubmit = async (data: MonthlyFormData) => {
    if (!user?.uid) {
      toast({
        title: "오류",
        description: "로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    // 중복 검증 개선
    const existingMonthly = await findMonthlyByMonth(
      user.uid,
      selectedYear,
      selectedMonth
    );
    if (existingMonthly) {
      toast({
        title: "중복 먼슬리",
        description:
          "해당 월에 이미 먼슬리가 존재합니다. 다른 월을 선택하거나 기존 먼슬리를 수정해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const keyResults: KeyResult[] = data.keyResults.map((kr: any) => ({
        id: crypto.randomUUID(),
        title: kr.title,
        description: kr.description || "",
        isCompleted: false,
      }));

      const monthlyData: Omit<Monthly, "id" | "createdAt" | "updatedAt"> = {
        userId: user.uid,
        objective: data.objective,
        objectiveDescription: data.objectiveDescription || "",
        startDate: getMonthStartDate(selectedYear, selectedMonth),
        endDate: getMonthEndDate(selectedYear, selectedMonth),
        focusAreas: [], // 새로운 구조에서는 focusAreas가 필요 없지만 타입 호환성을 위해 빈 배열
        reward: data.reward || "",
        keyResults,
        quickAccessProjects:
          quickAccessProjects.length > 0 ? quickAccessProjects : undefined,
      };

      await createMonthly(monthlyData);

      toast({
        title: translate("monthly.new.success.title"),
        description: translate("monthly.new.success.description"),
      });

      router.push("/monthly");
    } catch (error) {
      console.error("먼슬리 생성 실패:", error);
      toast({
        title: translate("monthly.new.error.title"),
        description: translate("monthly.new.error.description"),
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return <Loading />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      {/* 헤더 */}
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/monthly">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{translate("monthly.new.title")}</h1>
      </div>

      {/* 기존 먼슬리 경고 */}
      {existingMonthly && (
        <Card className="p-4 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 mb-1">
                {translate("monthly.new.existingMonthly.title")}
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                {translate("monthly.new.existingMonthly.description")}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/monthly/${existingMonthly.id}`)}
                >
                  {translate("monthly.detail.actions.edit")}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (confirm("기존 먼슬리를 삭제하시겠습니까?")) {
                      try {
                        await deleteMonthlyById(existingMonthly.id);
                        toast({
                          title: "삭제 완료",
                          description: "기존 먼슬리가 삭제되었습니다.",
                        });
                        router.refresh();
                      } catch (error) {
                        toast({
                          title: "삭제 실패",
                          description: "먼슬리 삭제에 실패했습니다.",
                          variant: "destructive",
                        });
                      }
                    }
                  }}
                >
                  {translate("monthly.detail.delete.confirm")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 기본 정보 */}
        <Card className="p-6 border border-border">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {translate("monthly.new.basicInfo.title")}
          </h2>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">
                {translate("monthly.new.basicInfo.monthSelection")}
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Select
                  value={`${selectedYear}-${selectedMonth}`}
                  onValueChange={(value) => {
                    const [year, month] = value.split("-").map(Number);
                    setSelectedYear(year);
                    setSelectedMonth(month);
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue
                      placeholder={translate(
                        "monthly.new.basicInfo.monthPlaceholder"
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
                <span>{defaultStartDate.toLocaleDateString("ko-KR")}</span>
                <span>-</span>
                <span>{defaultEndDate.toLocaleDateString("ko-KR")}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="objective" className="text-sm font-medium">
                {translate("monthly.new.form.objective")}
              </Label>
              <Input
                id="objective"
                {...register("objective")}
                placeholder={translate("monthly.new.form.objectivePlaceholder")}
                className="w-full mt-2"
              />
              {errors.objective && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.objective.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="objectiveDescription"
                className="text-sm font-medium"
              >
                {translate("monthly.new.form.keyResultDescription")}
              </Label>
              <Textarea
                id="objectiveDescription"
                {...register("objectiveDescription")}
                placeholder={translate(
                  "monthly.new.form.keyResultDescriptionPlaceholder"
                )}
                rows={3}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="reward" className="text-sm font-medium">
                {translate("monthly.new.form.reward")}
              </Label>
              <Input
                id="reward"
                {...register("reward")}
                placeholder={translate("monthly.new.form.rewardPlaceholder")}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                예: 🎮 새로운 게임 구매하기, 🍕 맛있는 음식 먹기
              </p>
            </div>
          </div>
        </Card>

        {/* 프로젝트 바로가기 (선택사항) */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                프로젝트 바로가기
                <Badge variant="secondary" className="text-xs">
                  선택사항
                </Badge>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                이번 달에 집중할 프로젝트들을 선택해보세요
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowQuickAccessDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              프로젝트 추가
            </Button>
          </div>

          {quickAccessProjects.length > 0 ? (
            <div className="space-y-2">
              {quickAccessProjects.map((projectId) => {
                const projectInfo = allProjects.find((p) => p.id === projectId);
                return (
                  <div
                    key={projectId}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {projectInfo?.title || `프로젝트 ID: ${projectId}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {projectInfo?.area || "미분류"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setQuickAccessProjects((prev) =>
                          prev.filter((id) => id !== projectId)
                        );
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 bg-muted/20 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-3">
                추가된 프로젝트가 없습니다
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAccessDialog(true)}
              >
                <Plus className="mr-2 h-3 w-3" />
                프로젝트 추가하기
              </Button>
            </div>
          )}
        </Card>

        {/* Key Results */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="h-5 w-5" />
                {translate("monthly.new.form.keyResults")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {translate("monthly.new.form.keyResultsDescription")}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {translate("monthly.new.form.keyResultsGuide")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addKeyResult}
            >
              <Plus className="h-4 w-4 mr-1" />
              {translate("monthly.new.form.addKeyResult")}
            </Button>
          </div>

          <div className="space-y-4">
            {watchedKeyResults.map((_: any, index: number) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Key Result {index + 1}
                  </span>
                  {watchedKeyResults.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeKeyResult(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Input
                    {...register(`keyResults.${index}.title`)}
                    placeholder={translate(
                      "monthly.new.form.keyResultTitlePlaceholder"
                    )}
                  />
                  <Textarea
                    {...register(`keyResults.${index}.description`)}
                    placeholder={translate(
                      "monthly.new.form.keyResultDescriptionPlaceholder"
                    )}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>

          {errors.keyResults && (
            <p className="text-sm text-red-500 mt-2">
              {errors.keyResults.message}
            </p>
          )}
        </Card>

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/monthly")}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !!existingMonthly}
          >
            {isSubmitting ? "생성 중..." : "먼슬리 생성"}
          </Button>
        </div>
      </form>

      {/* 프로젝트 바로가기 다이얼로그 */}
      {/* <QuickAccessProjectsDialog
        monthly={{
          id: "",
          userId: user?.uid || "",
          objective: "",
          objectiveDescription: "",
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          focusAreas: [],
          keyResults: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          quickAccessProjects,
        }}
        open={showQuickAccessDialog}
        onOpenChange={setShowQuickAccessDialog}
      /> */}
    </div>
  );
}

export default function NewMonthlyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewMonthlyPageContent />
    </Suspense>
  );
}
