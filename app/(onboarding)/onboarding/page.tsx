"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/index";
import { createUser } from "@/lib/firebase/users";
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

  // 사용자 문서 생성 확인 및 생성
  useEffect(() => {
    const checkAndCreateUserDoc = async () => {
      if (user && !userLoading) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            await createUser({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              emailVerified: user.emailVerified || false,
            });
          }
        } catch (error) {
          console.error("사용자 문서 생성 중 오류:", error);
        }
      }
    };

    checkAndCreateUserDoc();
  }, [user, userLoading]);

  // 다국어 텍스트 메모이제이션
  const texts = useMemo(
    () => ({
      welcome: translate("onboarding.welcome"),
      subtitle: translate("onboarding.subtitle"),
      monthly: translate("onboarding.monthly"),
      monthlyDesc: translate("onboarding.monthlyDesc"),
      para: translate("onboarding.para"),
      paraDesc: translate("onboarding.paraDesc"),
      game: translate("onboarding.game"),
      gameDesc: translate("onboarding.gameDesc"),
      createMonthly: translate("onboarding.createMonthly"),
      createMonthlyDesc: translate("onboarding.createMonthlyDesc"),
      laterCreate: translate("onboarding.laterCreate"),
      objective: translate("onboarding.objective"),
      objectivePlaceholder: translate("onboarding.objectivePlaceholder"),
      startDate: translate("onboarding.startDate"),
      endDate: translate("onboarding.endDate"),
      keyResults: translate("onboarding.keyResults"),
      keyResultPlaceholder: translate("onboarding.keyResultPlaceholder"),
      keyResultDescPlaceholder: translate(
        "onboarding.keyResultDescPlaceholder"
      ),
      reward: translate("onboarding.reward"),
      rewardPlaceholder: translate("onboarding.rewardPlaceholder"),
      rewardDesc: translate("onboarding.rewardDesc"),
      paraOverview: translate("onboarding.paraOverview"),
      paraOverviewDesc: translate("onboarding.paraOverviewDesc"),
      projects: translate("onboarding.projects"),
      projectsDesc: translate("onboarding.projectsDesc"),
      areas: translate("onboarding.areas"),
      areasDesc: translate("onboarding.areasDesc"),
      resources: translate("onboarding.resources"),
      resourcesDesc: translate("onboarding.resourcesDesc"),
      archives: translate("onboarding.archives"),
      archivesDesc: translate("onboarding.archivesDesc"),
      aiGenerator: translate("onboarding.aiGenerator"),
      aiGeneratorDesc: translate("onboarding.aiGeneratorDesc"),
      optional: translate("onboarding.optional"),
      manualOption: translate("onboarding.manualOption"),
      aiExperience: translate("onboarding.aiExperience"),
      aiExperienceDesc: translate("onboarding.aiExperienceDesc"),
      analyzing: translate("onboarding.analyzing"),
      analysisComplete: translate("onboarding.analysisComplete"),
      areasGenerated: translate("onboarding.areasGenerated"),
      projectsGenerated: translate("onboarding.projectsGenerated"),
      resourcesGenerated: translate("onboarding.resourcesGenerated"),
      generatedAreas: translate("onboarding.generatedAreas"),
      generatedProjects: translate("onboarding.generatedProjects"),
      healthManagement: translate("onboarding.healthManagement"),
      exerciseRoutine: translate("onboarding.exerciseRoutine"),
      nutritionManagement: translate("onboarding.nutritionManagement"),
      homeTraining: translate("onboarding.homeTraining"),
      healthyDiet: translate("onboarding.healthyDiet"),
      sleepPattern: translate("onboarding.sleepPattern"),
      manualEdit: translate("onboarding.manualEdit"),
      connection: translate("onboarding.connection"),
      connectionDesc: translate("onboarding.connectionDesc"),
      homeFeatures: translate("onboarding.homeFeatures"),
      currentProgress: translate("onboarding.currentProgress"),
      currentProgressDesc: translate("onboarding.progressDesc"),
      todayTasks: translate("onboarding.todayTasks"),
      todayTasksDesc: translate("onboarding.todayTasksDesc"),
      achievement: translate("onboarding.achievement"),
      achievementDesc: translate("onboarding.achievementDesc"),
      executionTips: translate("onboarding.executionTips"),
      tip1: translate("onboarding.tip1"),
      tip2: translate("onboarding.tip2"),
      tip3: translate("onboarding.tip3"),
      ready: translate("onboarding.ready"),
      readyDesc: translate("onboarding.readyDesc"),
      experiencedFeatures: translate("onboarding.experiencedFeatures"),
      createdSampleData: translate("onboarding.createdSampleData"),
      monthlyLater: translate("onboarding.monthlyLater"),
      paraLearned: translate("onboarding.paraOverview"),
      aiExperienced: translate("onboarding.aiExperience"),
      nextSteps: translate("onboarding.nextSteps"),
      step1: translate("onboarding.step1"),
      step2: translate("onboarding.step2"),
      step3: translate("onboarding.step3"),
      step4: translate("onboarding.step4"),
      step5: translate("onboarding.step5"),
      step6: translate("onboarding.step6"),
      previous: translate("onboarding.previous"),
      next: translate("onboarding.next"),
      createLater: translate("onboarding.createLater"),
      start: translate("onboarding.start"),
      skipEntire: translate("onboarding.skipEntire"),
      // 예시 데이터
      sampleObjective: translate("onboarding.sampleObjective"),
      sampleKeyResult1: translate("onboarding.sampleKeyResult1"),
      sampleKeyResult1Desc: translate("onboarding.sampleKeyResult1Desc"),
      sampleKeyResult2: translate("onboarding.sampleKeyResult2"),
      sampleKeyResult2Desc: translate("onboarding.sampleKeyResult2Desc"),
      sampleReward: translate("onboarding.sampleReward"),
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
        title: translate("onboarding.errorTitle"),
        description: translate("onboarding.errorDescription"),
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
          <div className="text-center space-y-4">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {texts.welcome}
              </h1>
              <p className="text-base text-muted-foreground">
                {texts.subtitle}
              </p>
            </div>

            <div className="space-y-3">
              <Card className="p-4 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-base font-bold text-foreground">
                    {texts.monthly}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {texts.monthlyDesc}
                </p>
              </Card>

              <Card className="p-4 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <FolderOpen className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-base font-bold text-foreground">
                    {texts.para}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {texts.paraDesc}
                </p>
              </Card>

              <Card className="p-4 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-base font-bold text-foreground">
                    {texts.game}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {texts.gameDesc}
                </p>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {texts.createMonthly}
              </h2>
              <p className="text-sm text-muted-foreground">
                {texts.createMonthlyDesc}
              </p>
            </div>

            {/* OKR 시스템 설명 카드 */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-3">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-100">
                  OKR 시스템이란?
                </h3>
              </div>
              <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    <strong>Objective (목표):</strong> 달성하고자 하는 명확한
                    목표
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    <strong>Key Results (핵심 결과):</strong> 목표 달성을 측정할
                    수 있는 구체적인 지표
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                  <span>
                    <strong>성과 측정:</strong> 정기적인 체크인으로 진행 상황을
                    추적
                  </span>
                </div>
              </div>
            </Card>

            {/* 샘플 OKR 예시 */}
            <Card className="p-4 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
              <h3 className="text-base font-bold mb-3 text-foreground">
                샘플 OKR 예시
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Objective (목표)
                  </Label>
                  <Input
                    value={texts.sampleObjective}
                    className="text-sm"
                    disabled={true}
                  />
                </div>

                <div>
                  <Label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Key Results (핵심 결과)
                  </Label>
                  <div className="space-y-2">
                    {onboardingData.keyResults.map((kr, index) => (
                      <div
                        key={kr.id}
                        className="p-2 border border-border dark:border-slate-700/50 rounded-lg bg-background dark:bg-slate-800/20"
                      >
                        <div className="flex items-center mb-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                          <span className="text-xs font-medium text-foreground">
                            KR {index + 1}
                          </span>
                        </div>
                        <Input
                          value={
                            index === 0
                              ? texts.sampleKeyResult1
                              : texts.sampleKeyResult2
                          }
                          className="mb-1 text-xs"
                          disabled={true}
                        />
                        <Textarea
                          value={
                            index === 0
                              ? texts.sampleKeyResult1Desc
                              : texts.sampleKeyResult2Desc
                          }
                          rows={1}
                          disabled={true}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* 보상 시스템 설명 */}
            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/50 dark:to-orange-950/50 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center mb-2">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                <h3 className="text-base font-bold text-yellow-900 dark:text-yellow-100">
                  {texts.reward}
                </h3>
              </div>
              <Input
                value={texts.sampleReward}
                disabled={true}
                className="text-sm mb-2"
              />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                {texts.rewardDesc}
              </p>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {texts.paraOverview}
              </h2>
              <p className="text-sm text-muted-foreground">
                {texts.paraOverviewDesc}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-xs mb-1 text-foreground">
                  {texts.projects}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.projectsDesc}
                </p>
              </Card>

              <Card className="p-3 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RotateCcw className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-xs mb-1 text-foreground">
                  {texts.areas}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.areasDesc}
                </p>
              </Card>

              <Card className="p-3 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-xs mb-1 text-foreground">
                  {texts.resources}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.resourcesDesc}
                </p>
              </Card>

              <Card className="p-3 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="font-bold text-xs mb-1 text-foreground">
                  {texts.archives}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.archivesDesc}
                </p>
              </Card>
            </div>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-base font-bold text-purple-900 dark:text-purple-100">
                  {texts.aiGenerator}
                </h3>
                <Badge className="ml-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-xs">
                  {texts.optional}
                </Badge>
              </div>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                {texts.aiGeneratorDesc}
              </p>
              <div className="flex items-center text-xs text-purple-700 dark:text-purple-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>{texts.manualOption}</span>
              </div>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {texts.aiExperience}
              </h2>
              <p className="text-sm text-muted-foreground">
                {onboardingData.skippedMonthlyCreation
                  ? "샘플 목표를 바탕으로 AI가 계획을 생성하는 과정을 보여드립니다"
                  : texts.aiExperienceDesc}
              </p>
            </div>

            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-3">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-base font-bold text-purple-900 dark:text-purple-100">
                  {texts.analyzing}
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-xs text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                  <span>
                    "{texts.sampleObjective}" {texts.analysisComplete}
                  </span>
                </div>
                <div className="flex items-center text-xs text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                  <span>{texts.areasGenerated}</span>
                </div>
                <div className="flex items-center text-xs text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                  <span>{texts.projectsGenerated}</span>
                </div>
                <div className="flex items-center text-xs text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
                  <span>{texts.resourcesGenerated}</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-3">
              <Card className="p-3 border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <h4 className="font-bold text-sm text-foreground">
                    {texts.generatedAreas}
                  </h4>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• {texts.healthManagement}</div>
                  <div>• {texts.exerciseRoutine}</div>
                  <div>• {texts.nutritionManagement}</div>
                </div>
              </Card>

              <Card className="p-3 border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <h4 className="font-bold text-sm text-foreground">
                    {texts.generatedProjects}
                  </h4>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>• {texts.homeTraining}</div>
                  <div>• {texts.healthyDiet}</div>
                  <div>• {texts.sleepPattern}</div>
                </div>
              </Card>
            </div>

            <Card className="p-3 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center text-xs text-yellow-800 dark:text-yellow-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                <span>{texts.manualEdit}</span>
              </div>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {texts.connection}
              </h2>
              <p className="text-sm text-muted-foreground">
                {texts.connectionDesc}
              </p>
            </div>

            <Card className="p-4 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
              <h3 className="text-base font-bold mb-3 text-foreground">
                {texts.homeFeatures}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      {texts.currentProgress}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.currentProgressDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/50">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-3">
                    <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      {texts.todayTasks}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.todayTasksDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mr-3">
                    <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground">
                      {texts.achievement}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.achievementDesc}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
              <div className="flex items-center mb-2">
                <Play className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                <h3 className="text-base font-bold text-green-900 dark:text-green-100">
                  {texts.executionTips}
                </h3>
              </div>
              <div className="space-y-1 text-xs text-green-800 dark:text-green-200">
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>{texts.tip1}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>{texts.tip2}</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span>{texts.tip3}</span>
                </div>
              </div>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="text-center space-y-4">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {texts.ready}
              </h2>
              <p className="text-base text-muted-foreground">
                {texts.readyDesc}
              </p>
            </div>

            <Card className="p-4 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
              <h3 className="text-base font-bold mb-3 text-foreground">
                {onboardingData.skippedMonthlyCreation
                  ? texts.experiencedFeatures
                  : texts.createdSampleData}
              </h3>
              <div className="space-y-2 text-xs">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-muted-foreground">
                        {texts.monthlyLater}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-muted-foreground">
                        {texts.paraLearned}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-3 w-3 text-purple-500 mr-1" />
                      <span className="text-muted-foreground">
                        {texts.aiExperienced}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-muted-foreground">
                        먼슬리: "{texts.sampleObjective}"
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-muted-foreground">
                        Key Results:{" "}
                        {
                          onboardingData.keyResults.filter((kr) => kr.title)
                            .length
                        }
                        개
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-muted-foreground">
                        PARA 구조: 자동 생성됨
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-muted-foreground">
                        보상: "{texts.sampleReward}"
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-2">
                <Home className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-1" />
                <h4 className="font-bold text-sm text-blue-900 dark:text-blue-100">
                  {texts.nextSteps}
                </h4>
              </div>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-blue-700 dark:text-blue-300">
                        {texts.step1}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-700 dark:text-green-300">
                        {texts.step2}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-3 w-3 text-purple-500 mr-1" />
                      <span className="text-purple-700 dark:text-purple-300">
                        {texts.step3}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Home className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-blue-700 dark:text-blue-300">
                        {texts.step4}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-700 dark:text-green-300">
                        {texts.step5}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Settings className="h-3 w-3 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {texts.step6}
                      </span>
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
          <p className="text-muted-foreground">
            {translate("pageLoading.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container max-w-md mx-auto px-3 py-6 min-h-screen"
      role="main"
      aria-label={translate("onboarding.ariaLabel")}
    >
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {currentStep} / {totalSteps}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <Progress value={(currentStep / totalSteps) * 100} className="h-1.5" />
      </div>

      {/* Step Content */}
      <div className="mb-6">{renderStep}</div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center border-border hover:bg-accent"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {texts.previous}
        </Button>

        {currentStep === totalSteps ? (
          <Button
            onClick={completeOnboarding}
            className="flex items-center bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {texts.start}
            <Home className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            className="flex items-center bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {texts.next}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

      {/* Skip Options */}
      <div className="text-center mt-4 space-y-2">
        {currentStep < totalSteps && (
          <Button
            variant="ghost"
            onClick={skipEntireOnboarding}
            className="text-muted-foreground text-sm flex items-center mx-auto hover:text-foreground hover:bg-accent"
          >
            <X className="h-3 w-3 mr-1" />
            {texts.skipEntire}
          </Button>
        )}
      </div>
    </div>
  );
}
