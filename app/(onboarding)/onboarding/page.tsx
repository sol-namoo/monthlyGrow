"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  Calendar,
  Target,
  FolderOpen,
  Sparkles,
  CheckCircle,
  Play,
  RotateCcw,
  BookOpen,
  Archive,
  Zap,
  Trophy,
  Home,
  Clock,
  X,
  AlertCircle,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/components/ui/use-toast";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";

interface OnboardingData {
  objective: string;
  keyResults: Array<{ id: number; title: string; description: string }>;
  reward: string;
  startDate: string;
  endDate: string;
  skippedMonthlyCreation: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { translate, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    objective: "",
    keyResults: [
      {
        id: 1,
        title: "",
        description: "",
      },
      {
        id: 2,
        title: "",
        description: "",
      },
    ],
    reward: "",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    skippedMonthlyCreation: false,
  });

  const totalSteps = 6;

  // 다국어 텍스트 메모이제이션
  const texts = useMemo(
    () => ({
      welcome: "환영합니다! 🎉",
      subtitle: "체계적인 목표 달성을 위한 앱 사용법을 안내해드립니다",
      monthly: "먼슬리 (Monthly)",
      monthlyDesc: "매달 달성하고 싶은 목표와 핵심 결과를 설정합니다",
      para: "PARA 시스템",
      paraDesc:
        "목표를 실행하기 위한 프로젝트, 영역, 자원을 체계적으로 관리합니다",
      game: "게임형 자기관리",
      gameDesc: "월간 먼슬리와 보상 시스템으로 동기를 유지합니다",
      createMonthly: "첫 번째 먼슬리 만들기",
      createMonthlyDesc: "이번 달의 목표를 설정해보세요",
      laterCreate: "지금 만들지 않고 나중에 만들 수도 있어요",
      objective: "이번 달의 목표 (Objective)",
      objectivePlaceholder: "예: 건강한 라이프스타일 만들기",
      startDate: "시작일",
      endDate: "종료일",
      keyResults: "핵심 결과 (Key Results)",
      keyResultPlaceholder: "예: 주 3회 이상 운동하기",
      keyResultDescPlaceholder: "구체적인 실행 방법을 적어보세요",
      reward: "목표 달성 보상 🎁",
      rewardPlaceholder: "예: 좋아하는 레스토랑에서 식사하기",
      rewardDesc: "목표를 달성했을 때 자신에게 줄 보상을 설정하세요",
      paraOverview: "PARA 시스템 둘러보기",
      paraOverviewDesc: "목표를 실행하기 위한 체계적인 구조입니다",
      projects: "Projects",
      projectsDesc: "구체적인 결과물이 있는 작업",
      areas: "Areas",
      areasDesc: "지속적으로 관리할 영역",
      resources: "Resources",
      resourcesDesc: "참고할 자료와 정보",
      archives: "Archives",
      archivesDesc: "완료된 프로젝트 보관",
      aiGenerator: "AI 계획 생성기",
      aiGeneratorDesc:
        "설정한 목표를 AI가 분석하여 PARA 구조를 자동으로 생성해드립니다",
      optional: "선택사항",
      manualOption: "수동으로 직접 관리하거나 AI의 도움을 받을 수 있습니다",
      aiExperience: "AI 계획 생성기 체험",
      aiExperienceDesc: "설정한 목표를 바탕으로 AI가 계획을 생성합니다",
      analyzing: "목표 분석 중...",
      analysisComplete: "목표 분석 완료",
      areasGenerated: "관련 영역(Areas) 3개 생성",
      projectsGenerated: "실행 프로젝트(Projects) 5개 생성",
      resourcesGenerated: "참고 자료(Resources) 8개 추천",
      generatedAreas: "생성된 영역 (Areas)",
      generatedProjects: "생성된 프로젝트 (Projects)",
      healthManagement: "건강 관리",
      exerciseRoutine: "운동 루틴",
      nutritionManagement: "영양 관리",
      homeTraining: "주 3회 홈트레이닝 루틴 만들기",
      healthyDiet: "건강한 식단 계획 수립",
      sleepPattern: "수면 패턴 개선하기",
      manualEdit: "언제든지 수동으로 수정하거나 새로 추가할 수 있습니다",
      connection: "연결과 실행",
      connectionDesc: "먼슬리와 PARA를 연결하여 목표를 실행해보세요",
      homeFeatures: "홈 화면 주요 기능",
      currentProgress: "현재 먼슬리 진행률",
      currentProgressDesc: "Key Results 달성 현황을 한눈에 확인",
      todayTasks: "오늘의 할 일",
      todayTasksDesc: "연결된 프로젝트의 오늘 할 일 표시",
      achievement: "성취 현황",
      achievementDesc: "완료한 작업과 보상 진행 상황",
      executionTips: "실행 팁",
      tip1: "매일 홈 화면에서 오늘의 할 일을 확인하세요",
      tip2: "주간 회고를 통해 진행 상황을 점검하세요",
      tip3: "목표 달성 시 설정한 보상을 꼭 실행하세요",
      ready: "준비 완료! 🚀",
      readyDesc: "이제 체계적인 목표 달성을 시작해보세요",
      experiencedFeatures: "체험한 기능들",
      createdSampleData: "생성된 샘플 데이터",
      monthlyLater: "먼슬리: 나중에 직접 만들어보세요",
      paraLearned: "PARA 시스템: 체계적인 관리 방법을 학습했습니다",
      aiExperienced: "AI 계획 생성기: 자동 계획 생성 과정을 체험했습니다",
      nextSteps: "다음 단계",
      step1: "먼슬리 페이지에서 첫 번째 목표를 만들어보세요",
      step2: "PARA 시스템에서 프로젝트와 영역을 관리하세요",
      step3: "AI 계획 생성기로 자동 계획을 만들어보세요",
      step4: "홈 화면에서 오늘의 할 일을 확인하세요",
      step5: "PARA 시스템에서 프로젝트를 세부 조정하세요",
      step6: "설정에서 언제든지 앱 사용법을 다시 볼 수 있습니다",
      previous: "이전",
      next: "다음",
      createLater: "다음에 만들기",
      start: "시작하기",
      skipEntire: "앱 사용법 전체 건너뛰기",
      monthlyLaterNote: "먼슬리는 나중에 언제든지 만들 수 있어요",
      // 예시 데이터
      sampleObjective: "건강한 라이프스타일 만들기",
      sampleKeyResult1: "주 3회 이상 운동하기",
      sampleKeyResult1Desc:
        "홈트레이닝, 조깅, 수영 등 다양한 운동을 통해 체력을 향상시킵니다.",
      sampleKeyResult2: "건강한 식단 유지하기",
      sampleKeyResult2Desc:
        "하루 3끼 규칙적으로 먹고, 채소와 단백질을 충분히 섭취합니다.",
      sampleReward: "좋아하는 레스토랑에서 특별한 식사하기",
    }),
    [translate]
  );

  // 다음 단계로 이동
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skipMonthlyCreation = useCallback(() => {
    setOnboardingData((prev) => ({ ...prev, skippedMonthlyCreation: true }));
    nextStep();
  }, [nextStep]);

  const completeOnboarding = useCallback(async () => {
    try {
      // 로그인 여부에 따라 리다이렉션
      if (user) {
        router.push("/home");
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("앱 사용법 완료 처리 중 오류:", error);
      toast({
        title: "오류 발생",
        description: "앱 사용법 완료 처리 중 문제가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [router, toast, user]);

  const skipEntireOnboarding = useCallback(() => {
    // 로그인 여부에 따라 리다이렉션
    if (user) {
      router.push("/home");
    } else {
      router.push("/login");
    }
  }, [router, user]);

  const updateKeyResult = useCallback(
    (id: number, field: string, value: string) => {
      setOnboardingData((prev) => ({
        ...prev,
        keyResults: prev.keyResults.map((kr) =>
          kr.id === id ? { ...kr, [field]: value } : kr
        ),
      }));
    },
    []
  );

  // 단계별 컴포넌트 렌더링 (메모이제이션)
  const renderStep = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {texts.welcome}
              </h1>
              <p className="text-lg text-gray-600">{texts.subtitle}</p>
            </div>

            <div className="space-y-4">
              <Card className="p-6 text-left">
                <div className="flex items-center mb-3">
                  <Calendar className="h-6 w-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-bold">{texts.monthly}</h3>
                </div>
                <p className="text-gray-600">{texts.monthlyDesc}</p>
              </Card>

              <Card className="p-6 text-left">
                <div className="flex items-center mb-3">
                  <FolderOpen className="h-6 w-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-bold">{texts.para}</h3>
                </div>
                <p className="text-gray-600">{texts.paraDesc}</p>
              </Card>

              <Card className="p-6 text-left">
                <div className="flex items-center mb-3">
                  <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
                  <h3 className="text-lg font-bold">{texts.game}</h3>
                </div>
                <p className="text-gray-600">{texts.gameDesc}</p>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {texts.createMonthly}
              </h2>
              <p className="text-gray-600">{texts.createMonthlyDesc}</p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {texts.laterCreate}
                </p>
                {!user && (
                  <p className="text-sm text-blue-700 mt-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    로그인 후에 먼슬리를 생성할 수 있습니다.
                  </p>
                )}
              </div>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="objective">{texts.objective}</Label>
                  <Input
                    id="objective"
                    value={texts.sampleObjective}
                    className="mt-1"
                    disabled={true}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">{texts.startDate}</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={onboardingData.startDate}
                      className="mt-1"
                      disabled={true}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">{texts.endDate}</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={onboardingData.endDate}
                      className="mt-1"
                      disabled={true}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">{texts.reward}</h3>
              <Input value={texts.sampleReward} disabled={true} />
              <p className="text-xs text-gray-500 mt-2">{texts.rewardDesc}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">{texts.keyResults}</h3>
              <div className="space-y-4">
                {onboardingData.keyResults.map((kr, index) => (
                  <div
                    key={kr.id}
                    className="p-4 border border-border rounded-lg"
                  >
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Key Result {index + 1}
                    </Label>
                    <Input
                      value={
                        index === 0
                          ? texts.sampleKeyResult1
                          : texts.sampleKeyResult2
                      }
                      className="mb-2"
                      disabled={true}
                    />
                    <Textarea
                      value={
                        index === 0
                          ? texts.sampleKeyResult1Desc
                          : texts.sampleKeyResult2Desc
                      }
                      rows={2}
                      disabled={true}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {texts.paraOverview}
              </h2>
              <p className="text-gray-600">{texts.paraOverviewDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-sm mb-2">{texts.projects}</h3>
                <p className="text-xs text-gray-600">{texts.projectsDesc}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-bold text-sm mb-2">{texts.areas}</h3>
                <p className="text-xs text-gray-600">{texts.areasDesc}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-sm mb-2">{texts.resources}</h3>
                <p className="text-xs text-gray-600">{texts.resourcesDesc}</p>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Archive className="h-6 w-6 text-gray-600" />
                </div>
                <h3 className="font-bold text-sm mb-2">{texts.archives}</h3>
                <p className="text-xs text-gray-600">{texts.archivesDesc}</p>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center mb-3">
                <Sparkles className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-bold text-purple-900">
                  {texts.aiGenerator}
                </h3>
                <Badge className="ml-2 bg-purple-100 text-purple-800">
                  {texts.optional}
                </Badge>
              </div>
              <p className="text-purple-800 mb-4">{texts.aiGeneratorDesc}</p>
              <div className="flex items-center text-sm text-purple-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{texts.manualOption}</span>
              </div>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {texts.aiExperience}
              </h2>
              <p className="text-gray-600">
                {onboardingData.skippedMonthlyCreation
                  ? "샘플 목표를 바탕으로 AI가 계획을 생성하는 과정을 보여드립니다"
                  : texts.aiExperienceDesc}
              </p>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center mb-4">
                <Zap className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-lg font-bold text-purple-900">
                  {texts.analyzing}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-purple-800">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>
                    "{texts.sampleObjective}" {texts.analysisComplete}
                  </span>
                </div>
                <div className="flex items-center text-sm text-purple-800">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.areasGenerated}</span>
                </div>
                <div className="flex items-center text-sm text-purple-800">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.projectsGenerated}</span>
                </div>
                <div className="flex items-center text-sm text-purple-800">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.resourcesGenerated}</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <h4 className="font-bold">{texts.generatedAreas}</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• {texts.healthManagement}</div>
                  <div>• {texts.exerciseRoutine}</div>
                  <div>• {texts.nutritionManagement}</div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <h4 className="font-bold">{texts.generatedProjects}</h4>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>• {texts.homeTraining}</div>
                  <div>• {texts.healthyDiet}</div>
                  <div>• {texts.sleepPattern}</div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center text-sm text-yellow-800">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span>{texts.manualEdit}</span>
              </div>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {texts.connection}
              </h2>
              <p className="text-muted-foreground">{texts.connectionDesc}</p>
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">{texts.homeFeatures}</h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {texts.currentProgress}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {texts.currentProgressDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{texts.todayTasks}</h4>
                    <p className="text-xs text-gray-600">
                      {texts.todayTasksDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{texts.achievement}</h4>
                    <p className="text-xs text-gray-600">
                      {texts.achievementDesc}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <div className="flex items-center mb-3">
                <Play className="h-6 w-6 text-green-600 mr-3" />
                <h3 className="text-lg font-bold text-green-900">
                  {texts.executionTips}
                </h3>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{texts.tip1}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{texts.tip2}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span>{texts.tip3}</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-6">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {texts.ready}
              </h2>
              <p className="text-lg text-gray-600">{texts.readyDesc}</p>
            </div>

            <Card className="p-6 text-left">
              <h3 className="text-lg font-bold mb-4">
                {onboardingData.skippedMonthlyCreation
                  ? texts.experiencedFeatures
                  : texts.createdSampleData}
              </h3>
              <div className="space-y-3 text-sm">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-600">
                        {texts.monthlyLater}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-gray-600">{texts.paraLearned}</span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-gray-600">
                        {texts.aiExperienced}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-600">
                        먼슬리: "{texts.sampleObjective}"
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-gray-600">
                        Key Results:{" "}
                        {
                          onboardingData.keyResults.filter((kr) => kr.title)
                            .length
                        }
                        개
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-gray-600">
                        PARA 구조: 자동 생성됨
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-gray-600">
                        보상: "{texts.sampleReward}"
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center mb-3">
                <Home className="h-5 w-5 text-blue-600 mr-2" />
                <h4 className="font-bold text-blue-900">{texts.nextSteps}</h4>
              </div>
              <div className="text-sm text-blue-800 space-y-2">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-blue-700">{texts.step1}</span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-700">{texts.step2}</span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-purple-700">{texts.step3}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-blue-700">{texts.step4}</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-700">{texts.step5}</span>
                    </div>
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-700">{texts.step6}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  }, [currentStep, onboardingData, texts, updateKeyResult]);

  // 로딩 중일 때 처리
  if (userLoading) {
    return (
      <div className="container max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container max-w-md mx-auto px-4 py-8 min-h-screen"
      role="main"
      aria-label="온보딩 가이드"
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            {currentStep} / {totalSteps}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mb-8">{renderStep}</div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {texts.previous}
        </Button>

        {currentStep === totalSteps ? (
          <Button
            onClick={completeOnboarding}
            className="flex items-center bg-green-600 hover:bg-green-700"
          >
            {texts.start}
            <Home className="h-4 w-4 ml-2" />
          </Button>
        ) : currentStep === 2 ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={skipMonthlyCreation}
              className="flex items-center"
            >
              <Clock className="h-4 w-4 mr-1" />
              {texts.createLater}
            </Button>
            <Button
              onClick={nextStep}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              {texts.next}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={nextStep}
            className="flex items-center bg-blue-600 hover:bg-blue-700"
          >
            {texts.next}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Skip Options */}
      <div className="text-center mt-4 space-y-2">
        {currentStep === 2 && (
          <p className="text-xs text-gray-500">{texts.monthlyLaterNote}</p>
        )}
        {currentStep < totalSteps && (
          <Button
            variant="ghost"
            onClick={skipEntireOnboarding}
            className="text-gray-500 text-sm flex items-center mx-auto"
          >
            <X className="h-3 w-3 mr-1" />
            {texts.skipEntire}
          </Button>
        )}
      </div>
    </div>
  );
}
