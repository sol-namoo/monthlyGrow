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
            console.log("온보딩 페이지에서 사용자 문서를 생성합니다.");
            await createUser({
              uid: user.uid,
              email: user.email || "",
              displayName: user.displayName || "",
              photoURL: user.photoURL || "",
              emailVerified: user.emailVerified || false,
            });
            console.log("✅ 사용자 문서 생성 완료");
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
          <div className="text-center space-y-6">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {texts.welcome}
              </h1>
              <p className="text-lg text-muted-foreground">{texts.subtitle}</p>
            </div>

            <div className="space-y-4">
              <Card className="p-6 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-3">
                  <Calendar className="h-6 w-6 text-blue-500 mr-3" />
                  <h3 className="text-lg font-bold text-foreground">
                    {texts.monthly}
                  </h3>
                </div>
                <p className="text-muted-foreground">{texts.monthlyDesc}</p>
              </Card>

              <Card className="p-6 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-3">
                  <FolderOpen className="h-6 w-6 text-green-500 mr-3" />
                  <h3 className="text-lg font-bold text-foreground">
                    {texts.para}
                  </h3>
                </div>
                <p className="text-muted-foreground">{texts.paraDesc}</p>
              </Card>

              <Card className="p-6 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-3">
                  <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
                  <h3 className="text-lg font-bold text-foreground">
                    {texts.game}
                  </h3>
                </div>
                <p className="text-muted-foreground">{texts.gameDesc}</p>
              </Card>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {texts.createMonthly}
              </h2>
              <p className="text-muted-foreground">{texts.createMonthlyDesc}</p>
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {texts.laterCreate}
                </p>
                {!user && (
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    로그인 후에 먼슬리를 생성할 수 있습니다.
                  </p>
                )}
              </div>
            </div>

            <Card className="p-6 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
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

            <Card className="p-6 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {texts.reward}
              </h3>
              <Input value={texts.sampleReward} disabled={true} />
              <p className="text-xs text-muted-foreground mt-2">
                {texts.rewardDesc}
              </p>
            </Card>

            <Card className="p-6 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {texts.keyResults}
              </h3>
              <div className="space-y-4">
                {onboardingData.keyResults.map((kr, index) => (
                  <div
                    key={kr.id}
                    className="p-4 border border-border dark:border-slate-700/50 rounded-lg bg-background dark:bg-slate-800/20"
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
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {texts.paraOverview}
              </h2>
              <p className="text-muted-foreground">{texts.paraOverviewDesc}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-sm mb-2 text-foreground">
                  {texts.projects}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.projectsDesc}
                </p>
              </Card>

              <Card className="p-4 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <RotateCcw className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-sm mb-2 text-foreground">
                  {texts.areas}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.areasDesc}
                </p>
              </Card>

              <Card className="p-4 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-sm mb-2 text-foreground">
                  {texts.resources}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.resourcesDesc}
                </p>
              </Card>

              <Card className="p-4 text-center border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Archive className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="font-bold text-sm mb-2 text-foreground">
                  {texts.archives}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {texts.archivesDesc}
                </p>
              </Card>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-3">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {texts.aiGenerator}
                </h3>
                <Badge className="ml-2 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                  {texts.optional}
                </Badge>
              </div>
              <p className="text-purple-800 dark:text-purple-200 mb-4">
                {texts.aiGeneratorDesc}
              </p>
              <div className="flex items-center text-sm text-purple-700 dark:text-purple-300">
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
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {texts.aiExperience}
              </h2>
              <p className="text-muted-foreground">
                {onboardingData.skippedMonthlyCreation
                  ? "샘플 목표를 바탕으로 AI가 계획을 생성하는 과정을 보여드립니다"
                  : texts.aiExperienceDesc}
              </p>
            </div>

            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
              <div className="flex items-center mb-4">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-3" />
                <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {texts.analyzing}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>
                    "{texts.sampleObjective}" {texts.analysisComplete}
                  </span>
                </div>
                <div className="flex items-center text-sm text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.areasGenerated}</span>
                </div>
                <div className="flex items-center text-sm text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.projectsGenerated}</span>
                </div>
                <div className="flex items-center text-sm text-purple-800 dark:text-purple-200">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
                  <span>{texts.resourcesGenerated}</span>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <Card className="p-4 border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <h4 className="font-bold text-foreground">
                    {texts.generatedAreas}
                  </h4>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• {texts.healthManagement}</div>
                  <div>• {texts.exerciseRoutine}</div>
                  <div>• {texts.nutritionManagement}</div>
                </div>
              </Card>

              <Card className="p-4 border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <h4 className="font-bold text-foreground">
                    {texts.generatedProjects}
                  </h4>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>• {texts.homeTraining}</div>
                  <div>• {texts.healthyDiet}</div>
                  <div>• {texts.sleepPattern}</div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center text-sm text-yellow-800 dark:text-yellow-200">
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

            <Card className="p-6 border-border bg-card dark:bg-slate-800/30 dark:border-slate-700/50">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {texts.homeFeatures}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800/50">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mr-4">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {texts.currentProgress}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.currentProgressDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/50">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-4">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {texts.todayTasks}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.todayTasksDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800/50">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mr-4">
                    <Trophy className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">
                      {texts.achievement}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {texts.achievementDesc}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
              <div className="flex items-center mb-3">
                <Play className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                  {texts.executionTips}
                </h3>
              </div>
              <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
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
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {texts.ready}
              </h2>
              <p className="text-lg text-muted-foreground">{texts.readyDesc}</p>
            </div>

            <Card className="p-6 text-left border-border bg-card dark:bg-slate-800/50 dark:border-slate-700">
              <h3 className="text-lg font-bold mb-4 text-foreground">
                {onboardingData.skippedMonthlyCreation
                  ? texts.experiencedFeatures
                  : texts.createdSampleData}
              </h3>
              <div className="space-y-3 text-sm">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-muted-foreground">
                        {texts.monthlyLater}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-muted-foreground">
                        {texts.paraLearned}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-muted-foreground">
                        {texts.aiExperienced}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-muted-foreground">
                        먼슬리: "{texts.sampleObjective}"
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-blue-500 mr-2" />
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
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-muted-foreground">
                        PARA 구조: 자동 생성됨
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-muted-foreground">
                        보상: "{texts.sampleReward}"
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
              <div className="flex items-center mb-3">
                <Home className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h4 className="font-bold text-blue-900 dark:text-blue-100">
                  {texts.nextSteps}
                </h4>
              </div>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                {onboardingData.skippedMonthlyCreation ? (
                  <>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-blue-700 dark:text-blue-300">
                        {texts.step1}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FolderOpen className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-700 dark:text-green-300">
                        {texts.step2}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-purple-700 dark:text-purple-300">
                        {texts.step3}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-blue-700 dark:text-blue-300">
                        {texts.step4}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-700 dark:text-green-300">
                        {texts.step5}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-2" />
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
      className="container max-w-md mx-auto px-4 py-8 min-h-screen"
      role="main"
      aria-label={translate("onboarding.ariaLabel")}
    >
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {currentStep} / {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
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
