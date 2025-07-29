"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Plus,
  Trash2,
  BookOpen,
  Target,
  AlertCircle,
  Calendar,
  Compass,
  Heart,
  Briefcase,
  Users,
  DollarSign,
  Brain,
  Gamepad2,
  Palette,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loading from "@/components/feedback/Loading";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

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
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // URL에서 시작 날짜 파라미터 가져오기
  const startDateParam = searchParams.get("startDate");

  const [newProjects, setNewProjects] = useState<
    { title: string; goal: string }[]
  >([{ title: "", goal: "" }]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedExistingProjects, setSelectedExistingProjects] = useState<
    number[]
  >([]);
  const [activeTab, setActiveTab] = useState<"new" | "existing">("existing");
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(false);
  const [showNoAreasDialog, setShowNoAreasDialog] = useState(false);

  // 루프 제목과 날짜 상태
  const [loopTitle, setLoopTitle] = useState("");
  const [loopReward, setLoopReward] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 샘플 데이터 - 테스트를 위해 변경 가능
  const hasAreas = true; // false로 변경하여 Area 없는 상태 테스트
  const hasProjects = false; // false로 변경하여 프로젝트 없는 상태 테스트

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "new" || tab === "existing") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // URL 파라미터로 상태 복원
  useEffect(() => {
    const loopTitle = searchParams.get("loopTitle");
    const loopReward = searchParams.get("loopReward");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const selectedAreasParam = searchParams.get("selectedAreas");
    const activeTabParam = searchParams.get("activeTab");
    const showOnlyUnconnectedParam = searchParams.get("showOnlyUnconnected");

    // 루프 기본 정보 복원
    if (loopTitle) {
      setLoopTitle(loopTitle);
    }
    if (loopReward) {
      setLoopReward(loopReward);
    }
    if (startDate) {
      setStartDate(startDate);
    }
    if (endDate) {
      setEndDate(endDate);
    }

    // 선택된 Areas 복원
    if (selectedAreasParam) {
      setSelectedAreas(selectedAreasParam.split(","));
    }

    // 새 프로젝트 데이터 복원
    const restoredNewProjects: { title: string; goal: string }[] = [];
    for (let i = 0; i < 10; i++) {
      // 최대 10개까지 확인
      const title = searchParams.get(`newProject_${i}_title`);
      const goal = searchParams.get(`newProject_${i}_goal`);
      if (title && goal) {
        restoredNewProjects.push({ title, goal });
      }
    }
    if (restoredNewProjects.length > 0) {
      setNewProjects(restoredNewProjects);
    }

    // 선택된 기존 프로젝트 복원
    const selectedExistingProjectsParam = searchParams.get(
      "selectedExistingProjects"
    );
    if (selectedExistingProjectsParam) {
      setSelectedExistingProjects(
        selectedExistingProjectsParam.split(",").map(Number)
      );
    }

    // 탭 정보 복원
    if (
      activeTabParam &&
      (activeTabParam === "new" || activeTabParam === "existing")
    ) {
      setActiveTab(activeTabParam as "new" | "existing");
    }

    // 필터 설정 복원
    if (showOnlyUnconnectedParam) {
      setShowOnlyUnconnected(showOnlyUnconnectedParam === "true");
    }

    // 프로젝트 생성 완료 표시
    const projectCreated = searchParams.get("projectCreated");
    if (projectCreated === "true") {
      toast({
        title: "프로젝트 생성 완료",
        description: "새 프로젝트가 루프에 연결되었습니다.",
      });
    }
  }, [searchParams, toast]);

  // 시작 날짜에 따라 루프 제목 자동 생성
  useEffect(() => {
    if (startDateParam) {
      setStartDate(startDateParam);

      // 시작 날짜로부터 월 정보 추출
      try {
        const date = new Date(startDateParam);
        const monthName = date.toLocaleString("ko-KR", { month: "long" });
        setLoopTitle(`${monthName} 루프: `);

        // 종료일 계산 (해당 월의 마지막 날)
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        setEndDate(lastDay.toISOString().split("T")[0]);
      } catch (e) {
        console.error("날짜 파싱 오류:", e);
      }
    } else {
      // 기본값: 현재 월의 1일부터 말일까지
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      setStartDate(firstDay.toISOString().split("T")[0]);
      setEndDate(lastDay.toISOString().split("T")[0]);

      const monthName = today.toLocaleString("ko-KR", { month: "long" });
      setLoopTitle(`${monthName} 루프: `);
    }
  }, [startDateParam]);

  // Area 없음 체크를 페이지 로드 시점에 즉시 실행하도록 변경
  useEffect(() => {
    if (!hasAreas) {
      setShowNoAreasDialog(true);
    }
  }, [hasAreas]);

  // 프로젝트 없음 체크 (기존 프로젝트 탭 선택 시)
  useEffect(() => {
    if (activeTab === "existing" && !hasProjects) {
      // setShowNoProjectsDialog(true); // 이 변수는 제거되었으므로 이 부분도 제거
    }
  }, [activeTab, hasProjects]);

  // 프로젝트 목록 최신화 보장 (임시로 샘플 데이터 사용)
  const projects = [
    {
      id: 1,
      title: "아침 운동 습관화",
      description:
        "매일 아침 30분씩 운동하는 습관을 만들어 건강한 라이프스타일을 구축하기",
      area: "건강",
      status: "in_progress",
      progress: 15,
      total: 30,
      startDate: "2025.05.01",
      endDate: "2025.05.31",
      loopConnection: null,
    },
    {
      id: 2,
      title: "식단 관리 앱 개발",
      description: "개인 맞춤형 식단 추천 및 기록 앱 개발",
      area: "개발",
      status: "in_progress",
      progress: 7,
      total: 12,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: null,
    },
  ];

  // 프로젝트 생성 완료 시 목록 새로고침 (실제 구현에서는 refetch 사용)
  useEffect(() => {
    const projectCreated = searchParams.get("projectCreated");
    if (projectCreated === "true") {
      // 실제 구현에서는 refetchProjects() 호출
      console.log("프로젝트 목록 새로고침 필요");
    }
  }, [searchParams]);

  // 임시 저장된 프로젝트 목록
  const [tempProjects, setTempProjects] = useState<
    Array<{
      id: string;
      title: string;
      description: string;
      area: string;
      startDate: string;
      dueDate: string;
      targetCount: string;
      status: string;
    }>
  >([]);

  // 프로젝트 생성 완료 시 임시 목록에 추가
  useEffect(() => {
    const projectCreated = searchParams.get("projectCreated");
    const projectId = searchParams.get("projectId");

    if (projectCreated === "true" && projectId) {
      // 실제 구현에서는 생성된 프로젝트 정보를 가져와야 함
      const newTempProject = {
        id: projectId,
        title: "새로 생성된 프로젝트", // 실제로는 생성된 프로젝트 정보
        description: "프로젝트 설명",
        area: "건강",
        startDate: "2025.05.01",
        dueDate: "2025.05.31",
        targetCount: "30",
        status: "planned",
      };

      setTempProjects((prev) => [...prev, newTempProject]);

      toast({
        title: "프로젝트 생성 완료",
        description: "루프 생성 완료 시 자동으로 연결됩니다.",
      });
    }
  }, [searchParams, toast]);

  // 사용자 등록 Areas 데이터 - 실제 구현 시 Firestore에서 불러옴
  // TODO: 실제 구현 시에는 다음과 같이 변경
  // const [areas, setAreas] = useState<Area[]>([]);
  // const [areasLoading, setAreasLoading] = useState(true);
  //
  // useEffect(() => {
  //   const fetchAreas = async () => {
  //     try {
  //       const areasData = await getAreas(); // Firestore에서 Areas 불러오기
  //       setAreas(areasData);
  //     } catch (error) {
  //       console.error('Areas 불러오기 실패:', error);
  //     } finally {
  //       setAreasLoading(false);
  //     }
  //   };
  //
  //   fetchAreas();
  // }, []);

  // 샘플 데이터 - 영역(Areas) - 실제 구현 시 위의 주석 처리된 코드로 대체
  const areas = hasAreas
    ? [
        { id: "health", name: "건강", color: "#10b981", icon: "heart" },
        { id: "career", name: "커리어", color: "#3b82f6", icon: "briefcase" },
        {
          id: "relationships",
          name: "인간관계",
          color: "#f59e0b",
          icon: "users",
        },
        { id: "finance", name: "재정", color: "#059669", icon: "dollarSign" },
        { id: "personal", name: "자기계발", color: "#8b5cf6", icon: "brain" },
        { id: "fun", name: "취미/여가", color: "#ec4899", icon: "gamepad2" },
        { id: "knowledge", name: "지식", color: "#06b6d4", icon: "bookOpen" },
        { id: "creativity", name: "창의성", color: "#ef4444", icon: "palette" },
      ]
    : [];

  // 샘플 데이터 - 기존 프로젝트
  const existingProjects = hasProjects
    ? [
        {
          id: 1,
          title: "유튜브 채널 기획",
          description: "개인 브랜딩을 위한 유튜브 채널 운영",
          area: "커리어",
          progress: 30,
          total: 100,
          connectedLoop: null,
          recentlyUsed: true,
        },
        {
          id: 2,
          title: "주 3회 헬스장 가기",
          description: "규칙적인 운동 습관 형성",
          area: "건강",
          progress: 50,
          total: 100,
          connectedLoop: "4월 루프: 생활 습관 개선",
          recentlyUsed: true,
        },
        {
          id: 3,
          title: "독서 습관 만들기",
          description: "매일 30분 독서하기",
          area: "자기계발",
          progress: 20,
          total: 100,
          connectedLoop: null,
          recentlyUsed: false,
        },
        {
          id: 4,
          title: "재테크 공부",
          description: "투자 관련 지식 습득",
          area: "재정",
          progress: 10,
          total: 100,
          connectedLoop: null,
          recentlyUsed: false,
        },
      ]
    : [];

  // 필터링된 프로젝트 계산 로직 추가
  const filteredExistingProjects = showOnlyUnconnected
    ? existingProjects.filter((project) => !project.connectedLoop)
    : existingProjects;

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter((id) => id !== areaId));
    } else {
      if (selectedAreas.length < 3) {
        setSelectedAreas([...selectedAreas, areaId]);
      }
    }
  };

  const toggleExistingProject = (projectId: number) => {
    if (selectedExistingProjects.includes(projectId)) {
      setSelectedExistingProjects(
        selectedExistingProjects.filter((id) => id !== projectId)
      );
    } else {
      // 프로젝트 개수 제한 (최대 5개)
      if (totalProjectCount < 5) {
        setSelectedExistingProjects([...selectedExistingProjects, projectId]);
      }
    }
  };

  const addNewProject = () => {
    // 프로젝트 개수 제한 (최대 5개)
    if (totalProjectCount < 5) {
      setNewProjects([...newProjects, { title: "", goal: "" }]);
    }
  };

  const removeNewProject = (index: number) => {
    if (newProjects.length > 1) {
      setNewProjects(newProjects.filter((_, i) => i !== index));
    }
  };

  const updateNewProject = (
    index: number,
    field: "title" | "goal",
    value: string
  ) => {
    const updatedProjects = [...newProjects];
    updatedProjects[index][field] = value;
    setNewProjects(updatedProjects);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isProjectLimitExceeded) {
      toast({
        title: "프로젝트 수 초과",
        description: "최대 5개의 프로젝트만 연결할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    if (totalProjectCount === 0) {
      // 프로젝트 없이도 루프 생성 가능하도록 제한 제거
      // setShowNoProjectsDialog(true);
      // return;
    }

    // 루프 생성 로직
    const loopData = {
      title: loopTitle,
      reward: loopReward,
      startDate,
      endDate,
      selectedAreas,
      createdAt: new Date(),
    };

    console.log("루프 생성:", loopData);

    // 선택된 프로젝트들을 루프에 연결
    const projectsToConnect = [
      ...selectedExistingProjects.map((id) => ({ id, type: "existing" })),
      ...newProjects
        .filter((p) => p.title.trim())
        .map((_, index) => ({
          id: `new_${index}`,
          type: "new",
          data: newProjects[index],
        })),
    ];

    console.log("연결할 프로젝트들:", projectsToConnect);

    // 실제 구현에서는:
    // 1. 루프 생성 API 호출 → loopId 획득
    // 2. 기존 프로젝트들 업데이트:
    //    - 각 프로젝트의 loopId 필드 업데이트
    // 3. 새 프로젝트들 생성:
    //    - 새 프로젝트 생성 시 loopId 설정
    // 4. 루프 업데이트:
    //    - 루프의 projectIds 배열에 모든 프로젝트 ID 추가

    // 루프 생성 완료 후 홈으로 이동
    router.push("/home");
  };

  // 상태 관리 부분에 totalProjectCount 계산 로직 추가
  const totalProjectCount =
    activeTab === "new" ? newProjects.length : selectedExistingProjects.length;

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

  const monthName = getMonthFromDate(startDate);

  const handleCreateCurrentLoop = () => {
    if (!hasAreas) {
      // Area가 없으면 Area 생성 페이지로 이동하면서 돌아올 URL 전달
      const currentUrl = `/loop/new${
        startDateParam ? `?startDate=${startDateParam}` : ""
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
    window.location.href = `/loop/new?startDate=${startDate}`;
  };

  const handleCreateProject = () => {
    const params = new URLSearchParams();

    // 루프 기본 정보
    params.set("loopTitle", loopTitle);
    params.set("loopReward", loopReward);
    params.set("startDate", startDate);
    params.set("endDate", endDate);

    // 선택된 Areas
    if (selectedAreas.length > 0) {
      params.set("selectedAreas", selectedAreas.join(","));
    }

    // 새 프로젝트 데이터
    newProjects.forEach((project, index) => {
      if (project.title.trim()) {
        params.set(`newProject_${index}_title`, project.title);
        params.set(`newProject_${index}_goal`, project.goal);
      }
    });

    // 선택된 기존 프로젝트
    if (selectedExistingProjects.length > 0) {
      params.set(
        "selectedExistingProjects",
        selectedExistingProjects.join(",")
      );
    }

    // 현재 탭 정보
    params.set("activeTab", activeTab);

    // 필터 설정
    params.set("showOnlyUnconnected", showOnlyUnconnected.toString());

    // returnUrl 설정
    params.set(
      "returnUrl",
      `/loop/new${startDateParam ? `?startDate=${startDateParam}` : ""}`
    );
    params.set("addedMidway", "true");

    router.push(`/para/projects/new?${params.toString()}`);
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
                    startDateParam ? `?startDate=${startDateParam}` : ""
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

        {/* Area 없음 다이얼로그 */}
        <Dialog open={showNoAreasDialog} onOpenChange={setShowNoAreasDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>활동 영역이 없어요</DialogTitle>
              <DialogDescription>
                루프를 만들기 위해 먼저 활동 영역을 등록해 주세요. 건강, 커리어,
                자기계발 등 관심 있는 분야를 설정할 수 있습니다.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNoAreasDialog(false)}
                className="sm:order-2"
              >
                닫기
              </Button>
              <Button asChild className="sm:order-1">
                <Link
                  href={`/para/areas/new?returnUrl=${encodeURIComponent(
                    `/loop/new${
                      startDateParam ? `?startDate=${startDateParam}` : ""
                    }`
                  )}`}
                >
                  Area 만들기
                </Link>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

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

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">새로운 루프를 만들어보세요</h2>
        <p className="text-sm text-muted-foreground">
          루프는 한 달 동안 집중적으로 달성하고 싶은 목표들을 설정하는
          기간입니다. 중점 Areas를 선택하고 프로젝트를 계획해보세요.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="title">루프 제목</Label>
            <Input
              id="title"
              value={loopTitle}
              onChange={(e) => setLoopTitle(e.target.value)}
              placeholder={`${monthName} 루프: 건강 관리`}
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="reward">달성 보상</Label>
            <Input
              id="reward"
              value={loopReward}
              onChange={(e) => setLoopReward(e.target.value)}
              placeholder="예: 새 운동화 구매"
              className="mt-1"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              루프를 완료했을 때 자신에게 줄 보상을 설정하세요.
            </p>
          </div>

          <div className="mb-4">
            <Label>루프 기간</Label>
            <div className="mt-1 flex items-center gap-2 rounded-md border p-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {new Date(startDate).toLocaleDateString("ko-KR")} ~{" "}
                {new Date(endDate).toLocaleDateString("ko-KR")}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              루프는 월 단위로 진행되며, {monthName} 한 달 동안 진행됩니다.
            </p>
          </div>
        </Card>

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">중점 Areas (최대 4개)</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            권장 2개 영역에 집중하면 루프의 효과를 높일 수 있어요.
            {selectedAreas.length > 2 && (
              <span className="block text-amber-600 font-medium mt-1">
                💡 많은 영역을 선택하면 집중도가 떨어질 수 있습니다.
              </span>
            )}
          </p>
          {areas.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {areas.map((area) => {
                  const IconComponent = getIconComponent(area.icon);

                  return (
                    <div
                      key={area.id}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center transition-colors ${
                        selectedAreas.includes(area.id)
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
                {selectedAreas.map((areaId) => {
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

        <Card className="mb-6 p-4">
          <h2 className="mb-4 text-lg font-semibold">프로젝트 목표 설정</h2>

          {showProjectCountWarning && (
            <Alert
              className={`mb-4 ${
                isProjectLimitExceeded ? "bg-red-50" : "bg-amber-50"
              }`}
            >
              <AlertCircle
                className={
                  isProjectLimitExceeded
                    ? "h-4 w-4 text-red-600"
                    : "h-4 w-4 text-amber-600"
                }
              />
              <AlertTitle
                className={
                  isProjectLimitExceeded ? "text-red-600" : "text-amber-600"
                }
              >
                {isProjectLimitExceeded
                  ? "프로젝트 개수 초과"
                  : "프로젝트 개수 주의"}
              </AlertTitle>
              <AlertDescription
                className={
                  isProjectLimitExceeded ? "text-red-600" : "text-amber-600"
                }
              >
                {isProjectLimitExceeded
                  ? "한 루프에는 최대 5개의 프로젝트만 등록할 수 있습니다."
                  : "루프에는 2-3개의 프로젝트를 권장합니다. 현재 " +
                    totalProjectCount +
                    "개가 선택되었습니다."}
              </AlertDescription>
            </Alert>
          )}

          <Tabs
            defaultValue="existing"
            className="mb-4"
            onValueChange={(value) => setActiveTab(value as "new" | "existing")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">기존 프로젝트 불러오기</TabsTrigger>
              <TabsTrigger value="new">새 프로젝트 생성</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4 space-y-4">
              {/* 새 프로젝트 생성 안내 */}
              <div className="text-center py-8">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-muted/50 p-6">
                    <Plus className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  새 프로젝트를 만들어보세요
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  루프에 연결할 새로운 프로젝트를 만들어보세요. 프로젝트 생성 후
                  자동으로 이 루프에 연결됩니다.
                </p>
                <Button onClick={handleCreateProject}>
                  <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                </Button>
              </div>

              {/* 기존 새 프로젝트 입력 폼 (선택적) */}
              {newProjects.length > 0 && newProjects[0].title && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">
                      또는 직접 입력하기
                    </h4>
                    {newProjects.map((project, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">프로젝트 {index + 1}</h3>
                          {newProjects.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeNewProject(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>

                        <div className="mb-3 mt-2">
                          <Label htmlFor={`project-title-${index}`}>
                            프로젝트 제목
                          </Label>
                          <Input
                            id={`project-title-${index}`}
                            value={project.title}
                            onChange={(e) =>
                              updateNewProject(index, "title", e.target.value)
                            }
                            placeholder="예: 아침 운동 습관화"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`project-goal-${index}`}>
                            목표 설정
                          </Label>
                          <Textarea
                            id={`project-goal-${index}`}
                            value={project.goal}
                            onChange={(e) =>
                              updateNewProject(index, "goal", e.target.value)
                            }
                            placeholder="예: 매일 아침 30분 운동하기"
                            className="mt-1"
                          />
                        </div>
                      </Card>
                    ))}

                    {totalProjectCount < 5 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full border-dashed bg-transparent"
                        onClick={addNewProject}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        프로젝트 추가
                      </Button>
                    )}

                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        새 프로젝트:{" "}
                        <span
                          className={
                            newProjects.length > 3
                              ? "text-amber-600 font-medium"
                              : ""
                          }
                        >
                          {newProjects.length}/5
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        권장: 2~3개 (많은 프로젝트를 동시에 진행하면 루프
                        집중도가 떨어질 수 있어요)
                      </span>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="existing" className="space-y-4">
              {/* 연결된 프로젝트 섹션 */}
              {projects.filter((p) => p.loopConnection).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">연결된 프로젝트</h3>
                    <Badge variant="secondary" className="text-xs">
                      {projects.filter((p) => p.loopConnection).length}개
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {projects
                      .filter((project) => project.loopConnection)
                      .map((project) => (
                        <Card key={project.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>Area: {project.area}</span>
                                <span>•</span>
                                <span>
                                  {project.startDate} ~ {project.endDate}
                                </span>
                              </div>
                            </div>
                            <Badge variant="default" className="text-xs">
                              연결됨
                            </Badge>
                          </div>
                        </Card>
                      ))}
                  </div>
                  <Separator />
                </div>
              )}

              {/* 기존 프로젝트 섹션 */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">기존 프로젝트</h3>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showOnlyUnconnected"
                    checked={showOnlyUnconnected}
                    onCheckedChange={(checked) =>
                      setShowOnlyUnconnected(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="showOnlyUnconnected"
                    className="text-sm text-muted-foreground"
                  >
                    루프에 연결되지 않은 프로젝트만
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                {filteredExistingProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`cursor-pointer rounded-lg border p-3 transition-all ${
                      selectedExistingProjects.includes(project.id)
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50"
                    } ${
                      totalProjectCount >= 5 &&
                      !selectedExistingProjects.includes(project.id)
                        ? "opacity-50 pointer-events-none"
                        : ""
                    }`}
                    onClick={() => toggleExistingProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedExistingProjects.includes(
                            project.id
                          )}
                          onCheckedChange={() =>
                            toggleExistingProject(project.id)
                          }
                          disabled={
                            totalProjectCount >= 5 &&
                            !selectedExistingProjects.includes(project.id)
                          }
                        />
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-xs text-muted-foreground">
                            {project.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{project.area}</Badge>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs">
                        <span>진행률: {project.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-value"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {project.connectedLoop ? (
                        <Badge className="bg-primary/20 text-xs">
                          {project.connectedLoop}에 연결됨
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-dashed text-xs"
                        >
                          루프 미연결
                        </Badge>
                      )}

                      {project.recentlyUsed && (
                        <Badge variant="secondary" className="text-xs">
                          최근 사용됨
                        </Badge>
                      )}

                      {/* 장기 프로젝트 경고 */}
                      {project.connectedLoop &&
                        project.connectedLoop.includes("루프") && (
                          <Badge
                            variant="outline"
                            className="bg-amber-100 text-amber-800 text-xs"
                          >
                            ⚠️ 장기 프로젝트
                          </Badge>
                        )}
                    </div>
                  </div>
                ))}

                {filteredExistingProjects.length === 0 && (
                  <div className="text-center py-8">
                    <div className="mb-4 flex justify-center">
                      <div className="rounded-full bg-muted/50 p-6">
                        <BookOpen className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2">
                      연결할 프로젝트가 없어요
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      프로젝트는 루프 생성 후 언제든 연결할 수 있어요. 지금
                      루프를 시작하고 나중에 프로젝트를 추가해보세요.
                    </p>
                    <div className="space-y-3">
                      <Button
                        onClick={handleCreateProject}
                        className="w-full max-w-xs"
                      >
                        <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                      </Button>
                      <Button variant="outline" className="w-full max-w-xs">
                        루프만 시작하기
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  선택된 프로젝트:{" "}
                  <span
                    className={
                      selectedExistingProjects.length > 3
                        ? "text-amber-600 font-medium"
                        : ""
                    }
                  >
                    {selectedExistingProjects.length}/5
                  </span>
                </span>
                <span className="text-muted-foreground">
                  권장: 2~3개 (많은 프로젝트를 동시에 진행하면 루프 집중도가
                  떨어질 수 있어요)
                </span>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <Button
          type="submit"
          className="w-full"
          disabled={isProjectLimitExceeded}
        >
          {monthName} 루프 시작하기
        </Button>
      </form>
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
