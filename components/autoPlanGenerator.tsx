"use client";

// components/PlanGenerator.tsx
import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { savePlanToFirestore } from "../lib/saveAutoPlanToFirestore";
import { useRouter } from "next/router";
import {
  GeneratedPlan,
  PlanConstraints,
  GeneratePlanResponse,
  GeneratePlanRequest,
} from "../lib/types";
import { fetchAllAreasByUserId } from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useLanguage } from "../hooks/useLanguage";
import { fetchAllMonthliesByUserId } from "../lib/firebase/index";
import { useQuery } from "@tanstack/react-query";
import { calculateMonthlyWeeks, formatDate } from "../lib/utils";
import { Button } from "./ui/button";
import { generateConstraintsGuide } from "../functions/src/constraints-guide";
import {
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
  Clock,
  Calendar,
} from "lucide-react";

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

// 타입 가드 함수
function isGeneratePlanResponse(data: unknown): data is GeneratePlanResponse {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    typeof (data as any).success === "boolean"
  );
}

function normalizeGeneratedPlan(plan: any): GeneratedPlan {
  const areas = Array.isArray(plan?.areas) ? plan.areas : [];
  const projects = Array.isArray(plan?.projects)
    ? plan.projects.map((project: any) => ({
        title: project?.title || "",
        description: project?.description || "",
        category:
          project?.category === "repetitive" ? "repetitive" : "task_based",
        areaName: project?.areaName || "",
        durationWeeks:
          typeof project?.durationWeeks === "number" ? project.durationWeeks : 1,
        difficulty: project?.difficulty || "intermediate",
        target: project?.target,
        targetCount:
          typeof project?.targetCount === "number" ? project.targetCount : 0,
        estimatedDailyTime:
          typeof project?.estimatedDailyTime === "number"
            ? project.estimatedDailyTime
            : 0,
        tasks: Array.isArray(project?.tasks)
          ? project.tasks.map((task: any) => ({
              title: task?.title || "",
              description: task?.description || "",
              duration: typeof task?.duration === "number" ? task.duration : 1,
              requirements: Array.isArray(task?.requirements)
                ? task.requirements
                : [],
              resources: Array.isArray(task?.resources) ? task.resources : [],
              prerequisites: Array.isArray(task?.prerequisites)
                ? task.prerequisites
                : [],
            }))
          : [],
        milestones: Array.isArray(project?.milestones) ? project.milestones : [],
        resources: Array.isArray(project?.resources) ? project.resources : [],
      }))
    : [];

  return {
    areas,
    projects,
    timeline:
      plan?.timeline && typeof plan.timeline === "object"
        ? {
            totalWeeks:
              typeof plan.timeline.totalWeeks === "number"
                ? plan.timeline.totalWeeks
                : 0,
            weeklySchedule: Array.isArray(plan.timeline.weeklySchedule)
              ? plan.timeline.weeklySchedule
              : [],
          }
        : { totalWeeks: 0, weeklySchedule: [] },
    successMetrics: Array.isArray(plan?.successMetrics)
      ? plan.successMetrics
      : [],
  };
}

// 제약사항에 최대값 설정하는 함수
function processConstraints(
  constraints: PlanConstraints,
  monthlyWeeks?: number
): PlanConstraints {
  const processed = { ...constraints };

  // 프로젝트 기간이 설정되지 않았으면 기본 최대값 설정
  if (!processed.projectWeeks) {
    // Monthly 기간을 고려한 최대값 설정
    processed.maxProjectWeeks = Math.min(monthlyWeeks || 24, 24); // Monthly 기간과 6개월 중 작은 값
  }

  if (processed.dailyTimeSlots) {
    // 주당 일수가 설정되지 않았으면 최대값 설정
    if (!processed.dailyTimeSlots.daysPerWeek) {
      processed.dailyTimeSlots.maxDaysPerWeek = 7; // 최대 매일
    }

    // 일일 시간이 설정되지 않았으면 최대값 설정
    if (!processed.dailyTimeSlots.minutesPerDay) {
      processed.dailyTimeSlots.maxMinutesPerDay = 240; // 최대 4시간
    }
  }

  return processed;
}

export default function PlanGenerator() {
  const { translate } = useLanguage();
  const [inputType, setInputType] = useState<"manual" | "monthly">("manual");
  const [userGoal, setUserGoal] = useState("");
  const [selectedMonthlyId, setSelectedMonthlyId] = useState<string>("");
  const [constraints, setConstraints] = useState<PlanConstraints>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(
    null
  );
  const [error, setError] = useState("");
  const [user] = useAuthState(auth);
  const [existingAreas, setExistingAreas] = useState<any[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [showAreaMatching, setShowAreaMatching] = useState(false);
  const [areaMatchingChoices, setAreaMatchingChoices] = useState<
    Record<
      string,
      { useExisting: boolean; existingId?: string; newName?: string }
    >
  >({});

  const functions = getFunctions();

  // 기존 Areas 조회
  const loadExistingAreas = async () => {
    if (!user) return;

    setAreasLoading(true);
    try {
      const areas = await fetchAllAreasByUserId(user.uid);
      setExistingAreas(areas);
    } catch (error) {
      // 기존 Areas 조회 실패
    } finally {
      setAreasLoading(false);
    }
  };

  // 컴포넌트 마운트 시 기존 Areas 조회
  React.useEffect(() => {
    loadExistingAreas();
  }, [user]);

  // Monthly 데이터 조회 (최근 3개월부터, 내림차순 정렬)
  const { data: monthlies = [] } = useQuery({
    queryKey: ["recentMonthlies", user?.uid],
    queryFn: async () => {
      const data = await fetchAllMonthliesByUserId(user?.uid || "");

      // 시작일 기준으로 내림차순 정렬 (최신이 위로)
      return data.sort((a: any, b: any) => {
        const aStart =
          a.startDate instanceof Date
            ? a.startDate
            : (a.startDate as any).toDate();
        const bStart =
          b.startDate instanceof Date
            ? b.startDate
            : (b.startDate as any).toDate();
        return bStart.getTime() - aStart.getTime();
      });
    },
    enabled: !!user?.uid,
  });

  // 선택된 Monthly의 기간 계산
  const selectedMonthly = monthlies.find(
    (m: any) => m.id === selectedMonthlyId
  );
  const monthlyWeeks = selectedMonthly
    ? calculateMonthlyWeeks(selectedMonthly)
    : 0;

  // 계획 생성 버튼 disabled 상태 (생성 중일 때만)
  const isGenerateDisabled = isGenerating;

  const handleGenerate = async () => {
    // 입력 타입에 따른 유효성 검사
    if (inputType === "manual" && !userGoal.trim()) {
      setError(translate("aiPlanGenerator.errors.goalRequired"));
      return;
    }

    if (inputType === "monthly" && !selectedMonthlyId) {
      setError(translate("aiPlanGenerator.errors.monthlyRequired"));
      return;
    }

    if (!user) {
      setError(translate("common.errors.loginRequired"));
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // 제약사항에 최대값 설정 (Monthly 기간 고려)
      const processedConstraints = processConstraints(
        constraints,
        monthlyWeeks
      );

      // 제약사항 가이드 생성
      const constraintsGuide = generateConstraintsGuide(processedConstraints);

      // AI 계획 생성 요청
      const generatePlan = httpsCallable(functions, "generatePlan");

      // Monthly 기반 입력일 때 구체적인 Monthly 정보를 포함한 userInput 생성 (영어로)
      let userInputForAI = userGoal.trim();
      if (inputType === "monthly" && selectedMonthly) {
        userInputForAI = `Generate plan based on Monthly: ${selectedMonthly.objective}`;
        if (selectedMonthly.objectiveDescription) {
          userInputForAI += ` - ${selectedMonthly.objectiveDescription}`;
        }
        if (
          selectedMonthly.keyResults &&
          selectedMonthly.keyResults.length > 0
        ) {
          userInputForAI += ` (Key Results: ${selectedMonthly.keyResults
            .map((kr) => kr.title)
            .join(", ")})`;
        }
      }

      const requestData = {
        userInput: userInputForAI,
        constraints: processedConstraints,
        existingAreas: existingAreas,
        inputType: inputType,
        selectedMonthlyId:
          inputType === "monthly" ? selectedMonthlyId : undefined,
      };

      const result = await generatePlan(requestData);

      // 타입 가드를 사용하여 응답 데이터 검증
      if (isGeneratePlanResponse(result.data)) {
        if (result.data.success && result.data.plan) {
          const normalizedPlan = normalizeGeneratedPlan(result.data.plan);
          setGeneratedPlan(normalizedPlan);

          // 영역 매칭 자동 설정 (완료 버튼 없이 바로 저장 가능하도록)
          if (normalizedPlan.areas.length > 0) {
            const matchingChoices: Record<
              string,
              { useExisting: boolean; existingId?: string; newName?: string }
            > = {};

            // 기존 영역 이름 목록
            const existingAreaNames = existingAreas.map((area) => area.name);

            normalizedPlan.areas.forEach((area) => {
              if (area.existingId) {
                // AI가 기존 영역과 매칭한 경우
                matchingChoices[area.name] = {
                  useExisting: true,
                  existingId: area.existingId,
                  newName: area.name,
                };
              } else {
                // 새로운 영역인 경우 - 기존 영역과 이름이 중복되지 않는 경우만
                const isDuplicate = existingAreaNames.some(
                  (existingName) =>
                    existingName.toLowerCase() === area.name.toLowerCase()
                );

                if (!isDuplicate) {
                  matchingChoices[area.name] = {
                    useExisting: false,
                    newName: area.name,
                  };
                } else {
                  // 기존 영역과 이름이 중복되는 경우, 해당 기존 영역을 사용
                  const existingArea = existingAreas.find(
                    (existing) =>
                      existing.name.toLowerCase() === area.name.toLowerCase()
                  );
                  if (existingArea) {
                    matchingChoices[area.name] = {
                      useExisting: true,
                      existingId: existingArea.id,
                      newName: existingArea.name, // 기존 영역 이름 사용
                    };
                  }
                }
              }
            });

            // 영역 매칭 UI에서 사용자가 선택할 때까지 프로젝트의 areaName은 설정하지 않음
            // 사용자가 영역을 선택하고 완료 버튼을 클릭할 때 프로젝트를 생성

            setAreaMatchingChoices(matchingChoices);
            // 영역 매칭 UI를 표시하되 바로 저장 가능하도록 설정
            setShowAreaMatching(true);
          } else {
            // AI가 영역을 생성하지 않은 경우, 영역 매칭 UI를 표시하되 기본 선택 제공

            // 기본 영역 선택을 위한 매칭 선택 생성
            const defaultMatchingChoices: Record<
              string,
              { useExisting: boolean; existingId?: string; newName?: string }
            > = {};

            if (existingAreas.length > 0) {
              // 기존 영역이 있으면 첫 번째 영역을 기본 선택
              const firstExistingArea = existingAreas[0];
              defaultMatchingChoices["기본 영역"] = {
                useExisting: true,
                existingId: firstExistingArea.id,
                newName: firstExistingArea.name,
              };

              // 모든 프로젝트를 첫 번째 기존 영역에 연결
              normalizedPlan.projects = normalizedPlan.projects.map(
                (project) => ({
                  ...project,
                  areaName: firstExistingArea.name,
                })
              );

              // 영역도 첫 번째 기존 영역으로 설정
              normalizedPlan.areas = [
                {
                  name: firstExistingArea.name,
                  description: firstExistingArea.description || "",
                  icon: firstExistingArea.icon || "compass",
                  color: firstExistingArea.color || "#6b7280",
                  existingId: firstExistingArea.id,
                },
              ];
            } else {
              // 기존 영역이 없으면 미분류 영역을 기본 선택
              defaultMatchingChoices["미분류"] = {
                useExisting: false,
                newName: "미분류",
              };

              // 모든 프로젝트를 미분류 영역에 연결
              normalizedPlan.projects = normalizedPlan.projects.map(
                (project) => ({
                  ...project,
                  areaName: "미분류",
                })
              );

              // 영역도 미분류 영역으로 설정
              normalizedPlan.areas = [
                {
                  name: "미분류",
                  description: "분류되지 않은 활동",
                  icon: "folder",
                  color: "#6B7280",
                },
              ];
            }

            setAreaMatchingChoices(defaultMatchingChoices);
            setShowAreaMatching(true);
          }
        } else {
          setError(
            result.data.error ||
              translate("aiPlanGenerator.errors.generationFailed")
          );
        }
      } else {
        setError(translate("common.errors.unexpectedResponse"));
      }
    } catch (error) {
      setError(
        `${translate("aiPlanGenerator.errors.generationFailed")} ${translate(
          "aiPlanGenerator.errors.retryMessage"
        )}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      <h1 className="text-2xl font-bold mb-2">
        {translate("aiPlanGenerator.title")}
      </h1>
      <p className="text-gray-600 mb-6">
        {translate("aiPlanGenerator.subtitle")}
      </p>

      {/* 기존 Areas 정보 */}
      {existingAreas.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 {translate("aiPlanGenerator.existingAreas.title")} (
            {existingAreas.length}개)
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            {translate("aiPlanGenerator.existingAreas.description")}
          </p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1">
            {existingAreas.map((area) => {
              const IconComponent = getIconComponent(area.icon || "compass");

              return (
                <div
                  key={area.id}
                  className="flex flex-col items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2 text-center"
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
        </div>
      )}

      {/* 입력 타입 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          {translate("aiPlanGenerator.form.inputTypeLabel")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="manual"
              checked={inputType === "manual"}
              onChange={(e) =>
                setInputType(e.target.value as "manual" | "monthly")
              }
              disabled={isGenerateDisabled}
              className="mr-2"
            />
            {translate("aiPlanGenerator.form.manualInput")}
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="monthly"
              checked={inputType === "monthly"}
              onChange={(e) =>
                setInputType(e.target.value as "manual" | "monthly")
              }
              disabled={isGenerateDisabled}
              className="mr-2"
            />
            {translate("aiPlanGenerator.form.monthlyBased")}
          </label>
        </div>
      </div>

      {/* 목표 입력 (수동 입력일 때만 표시) */}
      {inputType === "manual" && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            {translate("aiPlanGenerator.form.goalLabel")}
          </label>
          <textarea
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder={translate("aiPlanGenerator.form.goalPlaceholder")}
            disabled={isGenerateDisabled}
            className="w-full p-3 border rounded-lg h-24 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            maxLength={200}
          />
          <div className="text-sm text-gray-500 mt-1">
            {userGoal.length}/200자
          </div>
        </div>
      )}

      {/* Monthly 선택 (Monthly 기반일 때만 표시) */}
      {inputType === "monthly" && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Monthly 선택</label>
          {monthlies.length === 0 ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-200">
                생성된 Monthly가 없습니다. 먼저 Monthly를 생성해주세요.
              </p>
            </div>
          ) : (
            <select
              value={selectedMonthlyId}
              onChange={(e) => setSelectedMonthlyId(e.target.value)}
              disabled={isGenerateDisabled}
              className="w-full p-3 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Monthly를 선택하세요</option>
              {monthlies.map((monthly: any) => (
                <option key={monthly.id} value={monthly.id}>
                  {monthly.objective} ({formatDate(monthly.startDate, "ko")} ~{" "}
                  {formatDate(monthly.endDate, "ko")})
                </option>
              ))}
            </select>
          )}

          {/* 선택된 Monthly 정보 미리보기 */}
          {selectedMonthlyId && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                선택된 Monthly 정보
              </h4>
              {(() => {
                const selectedMonthly = monthlies.find(
                  (m: any) => m.id === selectedMonthlyId
                );
                if (!selectedMonthly) return null;

                return (
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p>
                      <strong>목표:</strong> {selectedMonthly.objective}
                    </p>
                    {selectedMonthly.objectiveDescription && (
                      <p>
                        <strong>설명:</strong>{" "}
                        {selectedMonthly.objectiveDescription}
                      </p>
                    )}
                    {selectedMonthly.keyResults &&
                      selectedMonthly.keyResults.length > 0 && (
                        <div>
                          <strong>Key Results:</strong>
                          <ul className="ml-4 mt-1">
                            {selectedMonthly.keyResults.map(
                              (kr: any, index: any) => (
                                <li key={kr.id || index}>• {kr.title}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    {selectedMonthly.focusAreas &&
                      selectedMonthly.focusAreas.length > 0 && (
                        <p>
                          <strong>중점 영역:</strong>{" "}
                          {selectedMonthly.focusAreas
                            .map((areaId: string) => {
                              const area = existingAreas.find(
                                (a) => a.id === areaId
                              );
                              return area ? area.name : areaId;
                            })
                            .join(", ")}
                        </p>
                      )}
                    {selectedMonthly.reward && (
                      <p>
                        <strong>보상:</strong> {selectedMonthly.reward}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 제약 조건 설정 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 시간 제약 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">
            {translate("aiPlanGenerator.constraints.timeSettings.title")}
          </h3>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate(
                "aiPlanGenerator.constraints.timeSettings.projectDuration"
              )}
            </label>
            <select
              value={constraints.projectWeeks || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  projectWeeks: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 설정</option>
              <option value="1">1주</option>
              <option value="2">2주</option>
              <option value="3">3주</option>
              <option value="4">1개월</option>
              <option value="8">2개월</option>
              <option value="12">3개월</option>
              <option value="16">4개월</option>
              <option value="20">5개월</option>
              <option value="24">6개월</option>
            </select>
            {inputType === "monthly" && monthlyWeeks > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                참고: 선택된 Monthly 기간은 {monthlyWeeks}주입니다
              </p>
            )}
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate(
                "aiPlanGenerator.constraints.timeSettings.daysPerWeek"
              )}
            </label>
            <select
              value={constraints.dailyTimeSlots?.daysPerWeek || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  dailyTimeSlots: {
                    ...constraints.dailyTimeSlots,
                    daysPerWeek: e.target.value ? parseInt(e.target.value) : 7,
                    minutesPerDay:
                      constraints.dailyTimeSlots?.minutesPerDay || 60,
                  },
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 설정</option>
              <option value="1">격주 1일</option>
              <option value="1.5">주 1일</option>
              <option value="2">주 2일</option>
              <option value="3">주 3일</option>
              <option value="4">주 4일</option>
              <option value="5">주 5일</option>
              <option value="6">주 6일</option>
              <option value="7">매일</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate("aiPlanGenerator.constraints.timeSettings.dailyTime")}
            </label>
            <select
              value={constraints.dailyTimeSlots?.minutesPerDay || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  dailyTimeSlots: {
                    ...constraints.dailyTimeSlots,
                    minutesPerDay: e.target.value
                      ? parseInt(e.target.value)
                      : 60,
                    daysPerWeek: constraints.dailyTimeSlots?.daysPerWeek || 5,
                  },
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 설정</option>
              <option value="30">30분</option>
              <option value="60">1시간</option>
              <option value="120">2시간</option>
              <option value="180">3시간</option>
              <option value="240">4시간 이상</option>
            </select>
          </div>
        </div>

        {/* 기타 설정 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">
            {translate("aiPlanGenerator.constraints.preferences.title")}
          </h3>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate(
                "aiPlanGenerator.constraints.preferences.currentLevel"
              )}
            </label>
            <select
              value={constraints.difficulty || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  difficulty: e.target.value as any,
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 판단</option>
              <option value="beginner">초급자 (기초 개념, 단계별 학습)</option>
              <option value="intermediate">
                중급자 (실무 적용, 심화 개념)
              </option>
              <option value="advanced">
                고급자 (고급 기술, 복잡한 프로젝트)
              </option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate("aiPlanGenerator.constraints.preferences.intensity")}
            </label>
            <select
              value={constraints.focusIntensity || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  focusIntensity: e.target.value as any,
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 설정</option>
              <option value="light">가볍게 (여유롭게)</option>
              <option value="moderate">적당히 (균형있게)</option>
              <option value="intensive">집중적으로 (빠른 성과)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">
              {translate(
                "aiPlanGenerator.constraints.preferences.activityStyle"
              )}
            </label>
            <select
              value={constraints.preferredActivityStyle || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  preferredActivityStyle: e.target.value as any,
                })
              }
              disabled={isGenerateDisabled}
              className="w-full p-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">AI가 자동 선택</option>
              <option value="visual">시각적 (이미지, 차트, 영상)</option>
              <option value="auditory">청각적 (오디오, 대화, 설명)</option>
              <option value="kinesthetic">체험적 (실습, 행동, 경험)</option>
              <option value="reading">독서 (텍스트, 문서, 글)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="text-center mb-6">
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating ||
            (inputType === "manual" && !userGoal.trim()) ||
            (inputType === "monthly" && !selectedMonthlyId)
          }
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isGenerating
            ? translate("aiPlanGenerator.mainSection.generating")
            : translate("aiPlanGenerator.mainSection.generateButton")}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* 생성된 계획 표시 */}
      {generatedPlan && (
        <PlanPreview
          plan={generatedPlan}
          showAreaMatching={showAreaMatching}
          areaMatchingChoices={areaMatchingChoices}
          existingAreas={existingAreas}
          onAreaMatchingUpdate={(choices) => setAreaMatchingChoices(choices)}
          onAreaMatchingComplete={() => {
            const updatedPlan = {
              ...generatedPlan,
              areas: generatedPlan.areas.map((area) => {
                const choice = areaMatchingChoices[area.name];
                if (choice && choice.useExisting && choice.existingId) {
                  return { ...area, existingId: choice.existingId };
                } else {
                  return { ...area, existingId: undefined };
                }
              }),
            };
            setGeneratedPlan(updatedPlan);
            setShowAreaMatching(false);
          }}
          inputType={inputType}
          selectedMonthly={selectedMonthly}
        />
      )}
    </div>
  );
}

// 계획 미리보기 컴포넌트
function PlanPreview({
  plan,
  showAreaMatching,
  areaMatchingChoices,
  existingAreas,
  onAreaMatchingUpdate,
  onAreaMatchingComplete,
  inputType,
  selectedMonthly,
}: {
  plan: GeneratedPlan;
  showAreaMatching: boolean;
  areaMatchingChoices: Record<
    string,
    { useExisting: boolean; existingId?: string; newName?: string }
  >;
  existingAreas: any[];
  onAreaMatchingUpdate: (
    choices: Record<
      string,
      { useExisting: boolean; existingId?: string; newName?: string }
    >
  ) => void;
  onAreaMatchingComplete: () => void;
  inputType: "manual" | "monthly";
  selectedMonthly?: any;
}) {
  const { translate } = useLanguage();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<GeneratedPlan>(
    normalizeGeneratedPlan(plan)
  );
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    setEditedPlan(normalizeGeneratedPlan(plan));
  }, [plan]);

  // Router 대신 window.location 사용

  const handleSavePlan = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      // 사용자가 선택한 area 매칭 정보를 사용하여 프로젝트의 areaName 수정
      const updatedPlan = { ...editedPlan };

      if (showAreaMatching && areaMatchingChoices) {
        // 사용자가 선택한 기존 area들을 plan.areas에 추가
        const selectedExistingAreas = Object.values(areaMatchingChoices)
          .filter((choice) => choice.useExisting && choice.existingId)
          .map((choice) => {
            const existingArea = existingAreas.find(
              (area) => area.id === choice.existingId
            );
            if (existingArea) {
              return {
                name: existingArea.name,
                description: existingArea.description || "",
                icon: existingArea.icon || "compass",
                color: existingArea.color || "#6b7280",
                existingId: existingArea.id,
              };
            }
            return null;
          })
          .filter((area): area is NonNullable<typeof area> => area !== null);

        // 기존 area들을 plan.areas에 추가
        updatedPlan.areas = [...updatedPlan.areas, ...selectedExistingAreas];

        updatedPlan.projects = updatedPlan.projects.map((project) => {
          // 프로젝트가 속한 area를 찾기
          const projectArea = updatedPlan.areas.find(
            (area) => project.areaName === area.name
          );

          if (projectArea) {
            const matchingChoice = areaMatchingChoices[projectArea.name];
            if (matchingChoice) {
              if (matchingChoice.useExisting && matchingChoice.existingId) {
                // 기존 area를 사용하는 경우, 기존 area의 이름으로 설정
                const existingArea = existingAreas.find(
                  (area) => area.id === matchingChoice.existingId
                );
                if (existingArea) {
                  return { ...project, areaName: existingArea.name };
                }
              } else if (matchingChoice.newName) {
                // 새 area를 생성하는 경우, 새 이름으로 설정
                return { ...project, areaName: matchingChoice.newName };
              }
            }
          }

          return project;
        });
      }

      // Monthly 기반 입력인 경우 Monthly 정보 전달
      const customizations: any = {};
      if (inputType === "monthly" && selectedMonthly) {
        customizations.selectedMonthlyId = selectedMonthly.id;
        customizations.monthlyStartDate = selectedMonthly.startDate;
      }

      const result = await savePlanToFirestore({
        plan: updatedPlan,
        customizations,
      });

      if (result.success) {
        // 성공 시 즉시 /para로 이동
        window.location.href = "/para";
      } else {
        setSaveError(translate("aiPlanGenerator.errors.saveFailed"));
      }
    } catch (error) {
      setSaveError(translate("aiPlanGenerator.errors.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedPlan(plan);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPlan(plan);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // editedPlan이 이미 상태에 저장되어 있음
  };

  const toggleProjectExpansion = (projectIndex: number) => {
    setExpandedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(projectIndex)) {
        newSet.delete(projectIndex);
      } else {
        newSet.add(projectIndex);
      }
      return newSet;
    });
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          {translate("aiPlanGenerator.result.title")}
        </h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={handleEdit}>
              {translate("aiPlanGenerator.result.editButton")}
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                {translate("common.save")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                {translate("common.cancel")}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 계획 요약 및 영역 선택 */}
      <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="font-medium text-lg mb-2">
          {translate("aiPlanGenerator.result.summary.title")}
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            📁 {editedPlan.areas.length}
            {translate("aiPlanGenerator.result.summary.areas")}
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            📋 {editedPlan.projects.length}
            {translate("aiPlanGenerator.result.summary.projects")}
          </span>
        </div>

        {/* 영역 선택 UI */}
        {showAreaMatching && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              {translate("aiPlanGenerator.areaMatching.title")}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              {translate("aiPlanGenerator.areaMatching.description")}
            </p>

            <div className="space-y-3">
              {/* 기존 영역 카드들 */}
              {existingAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {translate("aiPlanGenerator.areaMatching.selectExisting")}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {existingAreas.map((area) => {
                      const isSelected = Object.values(
                        areaMatchingChoices
                      ).every(
                        (choice) =>
                          choice.useExisting && choice.existingId === area.id
                      );

                      return (
                        <div
                          key={area.id}
                          className={`p-2 rounded border cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50 border-blue-300"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                          onClick={() => {
                            const updatedChoices = Object.keys(
                              areaMatchingChoices
                            ).reduce(
                              (acc, areaName) => ({
                                ...acc,
                                [areaName]: {
                                  useExisting: true,
                                  existingId: area.id,
                                  newName: areaName,
                                },
                              }),
                              {}
                            );
                            onAreaMatchingUpdate(updatedChoices);

                            // 모든 프로젝트를 선택된 영역에 연결
                            const updatedPlan = {
                              ...editedPlan,
                              projects: editedPlan.projects.map((project) => ({
                                ...project,
                                areaName: area.name,
                              })),
                              areas: [
                                {
                                  name: area.name,
                                  description: area.description || "",
                                  icon: area.icon || "compass",
                                  color: area.color || "#6b7280",
                                  existingId: area.id,
                                },
                              ],
                            };
                            setEditedPlan(updatedPlan);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {area.name}
                            </span>
                            {isSelected && (
                              <span className="text-blue-600 text-xs">
                                {translate(
                                  "aiPlanGenerator.areaMatching.selected"
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI 제안 영역들을 새로 생성하는 카드들 */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {translate("aiPlanGenerator.areaMatching.createNew")}
                </p>

                {/* 새로 만들 영역이 있는지 확인 */}
                {(() => {
                  const newAreas = Object.entries(areaMatchingChoices).filter(
                    ([_, choice]) => !choice.useExisting
                  );

                  if (newAreas.length === 0) {
                    return (
                      <div className="text-center py-4 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {translate("aiPlanGenerator.areaMatching.noNewAreas")}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {translate(
                            "aiPlanGenerator.areaMatching.noNewAreasDescription"
                          )}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(areaMatchingChoices).map(
                        ([areaName, choice]) => {
                          const isSelected =
                            !choice.useExisting && choice.newName === areaName;

                          return (
                            <div
                              key={areaName}
                              className={`p-2 rounded border cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-green-50 border-green-300"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }`}
                              onClick={() => {
                                const updatedChoices = Object.keys(
                                  areaMatchingChoices
                                ).reduce(
                                  (acc, key) => ({
                                    ...acc,
                                    [key]: {
                                      useExisting: false,
                                      newName:
                                        key === areaName ? key : undefined,
                                    },
                                  }),
                                  {}
                                );
                                onAreaMatchingUpdate(updatedChoices);

                                // 모든 프로젝트를 새 영역에 연결
                                const updatedPlan = {
                                  ...editedPlan,
                                  projects: editedPlan.projects.map(
                                    (project) => ({
                                      ...project,
                                      areaName: areaName,
                                    })
                                  ),
                                  areas: [
                                    {
                                      name: areaName,
                                      description: "",
                                      icon: "compass",
                                      color: "#6b7280",
                                    },
                                  ],
                                };
                                setEditedPlan(updatedPlan);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-green-800">
                                  🆕 {areaName}
                                </span>
                                {isSelected && (
                                  <span className="text-green-600 text-xs">
                                    {translate(
                                      "aiPlanGenerator.areaMatching.selected"
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 dark:text-gray-400">
          {translate("aiPlanGenerator.result.summary.description")}
        </p>
      </div>

      {/* 프로젝트 목록 */}
      <div className="space-y-4">
        {editedPlan.projects.map((project, index) => (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {translate("aiPlanGenerator.edit.projectTitle")}
                  </label>
                  <input
                    type="text"
                    value={project.title}
                    onChange={(e) => {
                      const updatedProjects = [...editedPlan.projects];
                      updatedProjects[index] = {
                        ...project,
                        title: e.target.value,
                      };
                      setEditedPlan((prev) => ({
                        ...prev,
                        projects: updatedProjects,
                      }));
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {translate("aiPlanGenerator.edit.projectDescription")}
                  </label>
                  <textarea
                    value={project.description}
                    onChange={(e) => {
                      const updatedProjects = [...editedPlan.projects];
                      updatedProjects[index] = {
                        ...project,
                        description: e.target.value,
                      };
                      setEditedPlan((prev) => ({
                        ...prev,
                        projects: updatedProjects,
                      }));
                    }}
                    className="w-full p-2 border rounded h-16"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {translate("aiPlanGenerator.edit.target")}
                    </label>
                    <input
                      type="text"
                      value={project.target}
                      onChange={(e) => {
                        const updatedProjects = [...editedPlan.projects];
                        updatedProjects[index] = {
                          ...project,
                          target: e.target.value,
                        };
                        setEditedPlan((prev) => ({
                          ...prev,
                          projects: updatedProjects,
                        }));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {translate("aiPlanGenerator.edit.dailyTime")}
                    </label>
                    <input
                      type="number"
                      value={project.estimatedDailyTime}
                      onChange={(e) => {
                        const updatedProjects = [...editedPlan.projects];
                        updatedProjects[index] = {
                          ...project,
                          estimatedDailyTime: parseInt(e.target.value) || 0,
                        };
                        setEditedPlan((prev) => ({
                          ...prev,
                          projects: updatedProjects,
                        }));
                      }}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{project.title}</h4>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      project.category === "repetitive"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {project.category === "repetitive"
                      ? translate("aiPlanGenerator.projectTypes.repetitive")
                      : translate("aiPlanGenerator.projectTypes.task")}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    📊 {translate("aiPlanGenerator.projectDetails.target")}:{" "}
                    {project.target}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    📈 {translate("aiPlanGenerator.projectDetails.targetCount")}
                    : {project.targetCount || 0}
                    {project.category === "repetitive"
                      ? translate("aiPlanGenerator.projectDetails.times")
                      : translate("aiPlanGenerator.projectDetails.items")}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    📅 {translate("aiPlanGenerator.projectDetails.duration")}{" "}
                    {project.durationWeeks}주 ({project.durationWeeks * 7}일)
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    🕐 총 작업 시간:{" "}
                    {project.tasks.reduce(
                      (sum, task) => sum + (task.duration || 0),
                      0
                    )}
                    시간
                  </span>
                </div>

                {/* 주요 작업들 미리보기 */}
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">
                    {translate("aiPlanGenerator.projectDetails.mainTasks")}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-2">
                    {project.tasks
                      .slice(
                        0,
                        expandedProjects.has(index) ? project.tasks.length : 3
                      )
                      .map((task, taskIndex) => (
                        <li key={taskIndex} className="flex items-start gap-2">
                          <span className="text-gray-400 mt-1">•</span>
                          <div className="flex-1">
                            <div className="font-medium">{task.title}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {(() => {
                                  // Monthly 기반 입력인 경우 Monthly 시작일 고려
                                  let projectStartDate = new Date();
                                  if (
                                    inputType === "monthly" &&
                                    selectedMonthly
                                  ) {
                                    const monthlyStartDate = new Date(
                                      selectedMonthly.startDate
                                    );
                                    const today = new Date();
                                    projectStartDate = new Date(
                                      Math.max(
                                        monthlyStartDate.getTime(),
                                        today.getTime()
                                      )
                                    );
                                  }

                                  const projectEndDate = new Date(
                                    projectStartDate.getTime() +
                                      project.durationWeeks *
                                        7 *
                                        24 *
                                        60 *
                                        60 *
                                        1000
                                  );

                                  const taskIndex = project.tasks.indexOf(task);
                                  const taskDate = new Date(
                                    projectStartDate.getTime() +
                                      (taskIndex / (project.tasks.length - 1)) *
                                        (projectEndDate.getTime() -
                                          projectStartDate.getTime())
                                  );

                                  // 첫 번째와 마지막 태스크 날짜 조정
                                  if (taskIndex === 0) {
                                    taskDate.setTime(
                                      projectStartDate.getTime()
                                    );
                                  } else if (
                                    taskIndex ===
                                    project.tasks.length - 1
                                  ) {
                                    taskDate.setTime(projectEndDate.getTime());
                                  }

                                  return formatDate(taskDate, "ko");
                                })()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {task.duration}시간
                              </span>
                              {task.description && (
                                <span className="text-gray-400">
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    {project.tasks.length > 3 &&
                      !expandedProjects.has(index) && (
                        <li className="text-gray-400">
                          ...{" "}
                          {translate(
                            "aiPlanGenerator.projectDetails.moreTasks"
                          ).replace(
                            "{count}",
                            String(project.tasks.length - 3)
                          )}
                        </li>
                      )}
                  </ul>
                  {project.tasks.length > 3 && (
                    <button
                      onClick={() => toggleProjectExpansion(index)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {expandedProjects.has(index)
                        ? translate("aiPlanGenerator.projectDetails.showLess")
                        : translate("aiPlanGenerator.projectDetails.showMore")}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* 저장 버튼 */}
      <div className="mt-6 text-center">
        {saveError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300 px-4 py-2 rounded mb-4">
            {saveError}
          </div>
        )}

        <Button
          onClick={handleSavePlan}
          disabled={isSaving || isEditing}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
          {isSaving
            ? translate("aiPlanGenerator.status.saving")
            : translate("aiPlanGenerator.result.saveButton")}
        </Button>
      </div>
    </div>
  );
}
