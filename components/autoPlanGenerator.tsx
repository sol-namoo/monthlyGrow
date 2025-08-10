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
import {
  fetchActiveAreasByUserId,
  fetchAllAreasByUserId,
} from "../lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
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

// 제약사항에 최대값 설정하는 함수
function processConstraints(constraints: PlanConstraints): PlanConstraints {
  const processed = { ...constraints };

  // 프로젝트 기간이 설정되지 않았으면 최대값 설정
  if (!processed.projectWeeks) {
    processed.maxProjectWeeks = 24; // 최대 6개월
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
  const [userGoal, setUserGoal] = useState("");
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
      console.error("기존 Areas 조회 실패:", error);
    } finally {
      setAreasLoading(false);
    }
  };

  // 컴포넌트 마운트 시 기존 Areas 조회
  React.useEffect(() => {
    loadExistingAreas();
  }, [user]);

  const handleGenerate = async () => {
    if (!userGoal.trim()) {
      setError("목표를 입력해주세요.");
      return;
    }

    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // 제약사항에 최대값 설정
      const processedConstraints = processConstraints(constraints);

      // 제약사항 가이드 생성
      const constraintsGuide = generateConstraintsGuide(processedConstraints);

      // AI 계획 생성 요청
      const generatePlan = httpsCallable(functions, "generatePlan");
      const requestData = {
        userInput: userGoal.trim(),
        constraints: processedConstraints,
        existingAreas: existingAreas,
      };

      const result = await generatePlan(requestData);

      // 타입 가드를 사용하여 응답 데이터 검증
      if (isGeneratePlanResponse(result.data)) {
        if (result.data.success && result.data.plan) {
          setGeneratedPlan(result.data.plan);

          // 영역 매칭 자동 설정 (완료 버튼 없이 바로 저장 가능하도록)
          if (result.data.plan.areas && result.data.plan.areas.length > 0) {
            const matchingChoices: Record<
              string,
              { useExisting: boolean; existingId?: string; newName?: string }
            > = {};

            // 기존 영역 이름 목록
            const existingAreaNames = existingAreas.map((area) => area.name);

            result.data.plan.areas.forEach((area) => {
              if (area.existingId) {
                // AI가 기존 영역과 매칭한 경우
                matchingChoices[area.name] = {
                  useExisting: true,
                  existingId: area.existingId,
                  newName: area.name,
                };
              } else {
                // 새로운 영역인 경우 - 기존 영역과 이름이 중복되지 않는 경우만
                if (!existingAreaNames.includes(area.name)) {
                  matchingChoices[area.name] = {
                    useExisting: false,
                    newName: area.name,
                  };
                } else {
                  // 기존 영역과 이름이 중복되는 경우, 해당 기존 영역을 사용
                  const existingArea = existingAreas.find(
                    (existing) => existing.name === area.name
                  );
                  if (existingArea) {
                    matchingChoices[area.name] = {
                      useExisting: true,
                      existingId: existingArea.id,
                      newName: area.name,
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
              result.data.plan.projects = result.data.plan.projects.map(
                (project) => ({
                  ...project,
                  areaName: firstExistingArea.name,
                })
              );

              // 영역도 첫 번째 기존 영역으로 설정
              result.data.plan.areas = [
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
              result.data.plan.projects = result.data.plan.projects.map(
                (project) => ({
                  ...project,
                  areaName: "미분류",
                })
              );

              // 영역도 미분류 영역으로 설정
              result.data.plan.areas = [
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
          setError(result.data.error || "계획 생성에 실패했습니다.");
        }
      } else {
        setError("서버에서 예상치 못한 응답을 받았습니다.");
      }
    } catch (error) {
      console.error("계획 생성 오류:", error);
      setError("서비스 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI 계획 생성기</h1>

      {/* 기존 Areas 정보 */}
      {existingAreas.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">
            📋 기존 영역 정보 ({existingAreas.length}개)
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            AI가 기존 영역과 유사한 영역을 발견하면 재사용하고, 새로운 영역만
            생성합니다.
          </p>
          <div className="grid grid-cols-4 md:grid-cols-6 gap-1">
            {existingAreas.map((area) => {
              const IconComponent = getIconComponent(area.icon || "compass");

              return (
                <div
                  key={area.id}
                  className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2 text-center"
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
                  {area.status === "archived" && (
                    <span className="text-xs text-gray-400">(보관됨)</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 목표 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          달성하고 싶은 목표를 자세히 설명해주세요
        </label>
        <textarea
          value={userGoal}
          onChange={(e) => setUserGoal(e.target.value)}
          placeholder="예: 지금 6.0인 IELTS 점수를 7.0으로 올리고 싶습니다. 특히 스피킹이 약해서 집중적으로 연습하고 싶어요."
          className="w-full p-3 border rounded-lg h-24 resize-none"
          maxLength={200}
        />
        <div className="text-sm text-gray-500 mt-1">
          {userGoal.length}/200자
        </div>
      </div>

      {/* 제약 조건 설정 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* 시간 제약 */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-3">시간 설정</h3>

          <div className="mb-3">
            <label className="block text-sm mb-1">목표 달성 기간</label>
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
              className="w-full p-2 border rounded"
            >
              <option value="">AI가 자동 설정</option>
              <option value="2">2주</option>
              <option value="4">1개월</option>
              <option value="8">2개월</option>
              <option value="12">3개월</option>
              <option value="16">4개월</option>
              <option value="20">5개월</option>
              <option value="24">6개월</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">주당 가능한 일수</label>
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
              className="w-full p-2 border rounded"
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
            <label className="block text-sm mb-1">일일 가용 시간</label>
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
              className="w-full p-2 border rounded"
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
          <h3 className="font-medium mb-3">선호도 설정</h3>

          <div className="mb-3">
            <label className="block text-sm mb-1">현재 수준</label>
            <select
              value={constraints.difficulty || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  difficulty: e.target.value as any,
                })
              }
              className="w-full p-2 border rounded"
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
            <label className="block text-sm mb-1">진행 강도</label>
            <select
              value={constraints.focusIntensity || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  focusIntensity: e.target.value as any,
                })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">AI가 자동 설정</option>
              <option value="light">가볍게 (여유롭게)</option>
              <option value="moderate">적당히 (균형있게)</option>
              <option value="intensive">집중적으로 (빠른 성과)</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm mb-1">활동 스타일</label>
            <select
              value={constraints.preferredActivityStyle || ""}
              onChange={(e) =>
                setConstraints({
                  ...constraints,
                  preferredActivityStyle: e.target.value as any,
                })
              }
              className="w-full p-2 border rounded"
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
          disabled={isGenerating || !userGoal.trim()}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          {isGenerating ? "계획 생성 중..." : "맞춤 계획 생성하기"}
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
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
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<GeneratedPlan>(plan);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(
    new Set()
  );

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

      const result = await savePlanToFirestore({ plan: updatedPlan });

      if (result.success) {
        // 성공 시 10초 후 대시보드로 이동
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 10000);
      } else {
        setSaveError("계획 저장에 실패했습니다.");
      }
    } catch (error) {
      setSaveError("계획 저장에 실패했습니다. 다시 시도해주세요.");
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
    <div className="border rounded-lg p-6 bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">생성된 계획</h2>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button size="sm" variant="outline" onClick={handleEdit}>
              수정하기
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={handleSaveEdit}>
                수정 완료
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                취소
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 계획 요약 및 영역 선택 */}
      <div className="mb-6 p-4 bg-white rounded-lg border">
        <h3 className="font-medium text-lg mb-2">생성된 계획 요약</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
            📁 {editedPlan.areas.length}개 영역
          </span>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
            📋 {editedPlan.projects.length}개 프로젝트
          </span>
        </div>

        {/* 영역 선택 UI */}
        {showAreaMatching && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🔄 영역 선택</h4>
            <p className="text-sm text-blue-700 mb-3">
              AI가 제안한 영역들을 기존 영역과 매칭하거나 새로 생성할지
              선택해주세요.
            </p>

            <div className="space-y-3">
              {/* 기존 영역 카드들 */}
              {existingAreas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    기존 영역 중 선택:
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
                                ✓ 선택됨
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
                <p className="text-sm font-medium text-gray-700 mb-2">
                  새 영역으로 생성:
                </p>
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
                                  newName: key === areaName ? key : undefined,
                                },
                              }),
                              {}
                            );
                            onAreaMatchingUpdate(updatedChoices);

                            // 모든 프로젝트를 새 영역에 연결
                            const updatedPlan = {
                              ...editedPlan,
                              projects: editedPlan.projects.map((project) => ({
                                ...project,
                                areaName: areaName,
                              })),
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
                                ✓ 선택됨
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          AI가 생성한 영역, 프로젝트, 작업들을 확인하고 저장하세요.
        </p>
      </div>

      {/* 프로젝트 목록 */}
      <div className="space-y-4">
        {editedPlan.projects.map((project, index) => (
          <div key={index} className="bg-white p-4 rounded-lg border">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    프로젝트 제목
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
                    프로젝트 설명
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
                      목표
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
                      일일 시간 (분)
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
                    {project.category === "repetitive" ? "반복형" : "작업형"}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    📊 목표:{" "}
                    {project.category === "repetitive" && project.targetCount
                      ? `${project.target} ${project.targetCount}회`
                      : project.target}
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded">
                    ⏰ 일일{" "}
                    {project.estimatedDailyTime
                      ? Math.round(project.estimatedDailyTime / 60)
                      : 0}
                    시간
                  </span>
                </div>

                {/* 주요 작업들 미리보기 */}
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">주요 작업:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {project.tasks
                      .slice(
                        0,
                        expandedProjects.has(index) ? project.tasks.length : 3
                      )
                      .map((task, taskIndex) => (
                        <li key={taskIndex}>• {task.title}</li>
                      ))}
                    {project.tasks.length > 3 &&
                      !expandedProjects.has(index) && (
                        <li className="text-gray-400">
                          ... 외 {project.tasks.length - 3}개 작업
                        </li>
                      )}
                  </ul>
                  {project.tasks.length > 3 && (
                    <button
                      onClick={() => toggleProjectExpansion(index)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      {expandedProjects.has(index) ? "접기" : "더보기"}
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">
            {saveError}
          </div>
        )}

        <Button
          onClick={handleSavePlan}
          disabled={isSaving || isEditing}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "저장 중..." : "이 계획으로 시작하기"}
        </Button>
      </div>
    </div>
  );
}
