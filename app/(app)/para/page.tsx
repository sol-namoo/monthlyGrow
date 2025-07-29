"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Plus,
  Star,
  Bookmark,
  Clock,
  Briefcase,
  Compass,
  Folder,
  Archive,
  Filter,
  SortAsc,
  CalendarDays,
  Heart,
  Brain,
  DollarSign,
  Users,
  Gamepad2,
  Dumbbell,
  BookOpen as BookOpenIcon,
  Home,
  Car,
  Plane,
  Camera,
  Music,
  Palette,
  Utensils,
  FileText,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/components/feedback/Loading";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function ParaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const handleTabChange = (value: string) => {
    router.push(`/para?tab=${value}`, { scroll: false });
  };

  // 필터링 상태
  const [projectFilter, setProjectFilter] = useState("all");

  // 무한 스크롤 관련 상태
  const [displayedProjects, setDisplayedProjects] = useState<any[]>([]);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);
  const [isLoadingMoreProjects, setIsLoadingMoreProjects] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 샘플 데이터
  const projects = [
    {
      id: "1",
      title: "아침 운동 습관화",
      description:
        "매일 아침 30분씩 운동하는 습관을 만들어 건강한 라이프스타일을 구축하기",
      area: "건강",
      status: "completed",
      progress: 30,
      total: 30,
      startDate: "2025.05.01",
      endDate: "2025.05.31",
      loopConnection: "5월 루프: 건강 관리",
      connectedLoops: ["loop-1", "loop-2"],
    },
    {
      id: "2",
      title: "식단 관리 앱 개발",
      description: "개인 맞춤형 식단 추천 및 기록 앱 개발",
      area: "개발",
      status: "in_progress",
      progress: 7,
      total: 12,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: "6월 루프: 건강한 개발자 되기",
      connectedLoops: ["loop-1", "loop-2", "loop-3"],
    },
    {
      id: "3",
      title: "주간 회고 자동화 스크립트",
      description: "매주 회고 내용을 자동으로 정리하고 분석하는 스크립트 개발",
      area: "생산성",
      status: "in_progress",
      progress: 5,
      total: 10,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: ["loop-1", "loop-2", "loop-3", "loop-4"],
    },
    {
      id: "4",
      title: "새로운 기술 스택 학습",
      description: "Next.js 15 및 React Server Components 심화 학습",
      area: "개발",
      status: "in_progress",
      progress: 1,
      total: 5,
      startDate: "2025.07.05",
      endDate: "2025.07.25",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: ["loop-1", "loop-2", "loop-3", "loop-4", "loop-5"],
    },
    {
      id: "5",
      title: "블로그 글 작성",
      description: "개인 블로그에 주 1회 글 작성",
      area: "커리어",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.08.01",
      endDate: "2025.08.31",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
      ],
    },
    {
      id: "6",
      title: "재테크 공부",
      description: "투자 관련 지식 습득",
      area: "재정",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.08.01",
      endDate: "2025.08.31",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
      ],
    },
    {
      id: "7",
      title: "외국어 학습",
      description: "매일 30분 영어 공부",
      area: "자기계발",
      status: "in_progress",
      progress: 20,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
      ],
    },
    {
      id: "8",
      title: "명상 습관 만들기",
      description: "매일 아침 10분 명상하기",
      area: "건강",
      status: "completed",
      progress: 100,
      total: 100,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: "6월 루프: 건강한 개발자 되기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
      ],
    },
    {
      id: "9",
      title: "독서 습관 만들기",
      description: "매일 30분 독서하기",
      area: "자기계발",
      status: "in_progress",
      progress: 15,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
      ],
    },
    {
      id: "10",
      title: "가족 여행 계획",
      description: "가족과 함께하는 여행 준비",
      area: "가족",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.09.01",
      endDate: "2025.09.30",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
      ],
    },
    {
      id: "11",
      title: "집 정리 정리",
      description: "미니멀 라이프를 위한 집 정리",
      area: "생활",
      status: "in_progress",
      progress: 30,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
      ],
    },
    {
      id: "12",
      title: "취미 개발",
      description: "새로운 취미 찾기",
      area: "여가",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.08.01",
      endDate: "2025.08.31",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
      ],
    },
    {
      id: "13",
      title: "네트워킹 활동",
      description: "업계 사람들과 네트워킹",
      area: "커리어",
      status: "in_progress",
      progress: 25,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
      ],
    },
    {
      id: "14",
      title: "재정 계획 수립",
      description: "개인 재정 계획 및 예산 관리",
      area: "재정",
      status: "completed",
      progress: 100,
      total: 100,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: "6월 루프: 건강한 개발자 되기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
      ],
    },
    {
      id: "15",
      title: "건강 검진",
      description: "정기 건강 검진 받기",
      area: "건강",
      status: "in_progress",
      progress: 50,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
      ],
    },
    {
      id: "16",
      title: "언어 학습 앱 개발",
      description: "개인용 언어 학습 앱 개발",
      area: "개발",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.08.01",
      endDate: "2025.08.31",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
        "loop-17",
      ],
    },
    {
      id: "17",
      title: "요리 실력 향상",
      description: "새로운 요리법 배우기",
      area: "생활",
      status: "in_progress",
      progress: 40,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
        "loop-17",
        "loop-18",
      ],
    },
    {
      id: "18",
      title: "운동 루틴 개선",
      description: "더 효과적인 운동 루틴 만들기",
      area: "건강",
      status: "planned",
      progress: 0,
      total: 100,
      startDate: "2025.08.01",
      endDate: "2025.08.31",
      loopConnection: null,
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
        "loop-17",
        "loop-18",
        "loop-19",
      ],
    },
    {
      id: "19",
      title: "독서 목록 정리",
      description: "읽고 싶은 책 목록 정리",
      area: "자기계발",
      status: "completed",
      progress: 100,
      total: 100,
      startDate: "2025.06.01",
      endDate: "2025.06.30",
      loopConnection: "6월 루프: 건강한 개발자 되기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
        "loop-17",
        "loop-18",
        "loop-19",
        "loop-20",
      ],
    },
    {
      id: "20",
      title: "투자 포트폴리오 분석",
      description: "현재 투자 포트폴리오 분석 및 개선",
      area: "재정",
      status: "in_progress",
      progress: 35,
      total: 100,
      startDate: "2025.07.01",
      endDate: "2025.07.31",
      loopConnection: "7월 루프: 독서 습관 만들기",
      connectedLoops: [
        "loop-1",
        "loop-2",
        "loop-3",
        "loop-4",
        "loop-5",
        "loop-6",
        "loop-7",
        "loop-8",
        "loop-9",
        "loop-10",
        "loop-11",
        "loop-12",
        "loop-13",
        "loop-14",
        "loop-15",
        "loop-16",
        "loop-17",
        "loop-18",
        "loop-19",
        "loop-20",
        "loop-21",
      ],
    },
  ];

  const areas = [
    {
      id: "1",
      name: "건강",
      description: "신체적, 정신적 건강을 관리하고 증진하는 활동",
      projectsCount: 1,
      resourcesCount: 2,
      icon: "heart",
      color: "#10b981",
    },
    {
      id: "2",
      name: "개발",
      description: "프로그래밍 스킬 향상 및 프로젝트 개발",
      projectsCount: 3,
      resourcesCount: 5,
      icon: "briefcase",
      color: "#3b82f6",
    },
    {
      id: "3",
      name: "생산성",
      description: "업무 효율성 증대 및 시간 관리",
      projectsCount: 1,
      resourcesCount: 3,
      icon: "compass",
      color: "#8b5cf6",
    },
    {
      id: "4",
      name: "자기계발",
      description: "개인의 성장과 역량 강화를 위한 학습 및 경험",
      projectsCount: 0,
      resourcesCount: 4,
      icon: "brain",
      color: "#8b5cf6",
    },
    {
      id: "5",
      name: "재정",
      description: "개인 재정 관리 및 투자 학습",
      projectsCount: 0,
      resourcesCount: 1,
      icon: "dollarSign",
      color: "#059669",
    },
  ];

  const resources = [
    {
      id: "1",
      title: "운동 루틴 아이디어",
      content:
        "월: 전신 운동, 화: 유산소, 수: 휴식, 목: 상체, 금: 하체, 주말: 가벼운 활동",
      areaId: "1",
      createdAt: "2025.05.10",
    },
    {
      id: "2",
      title: "개발 참고 자료",
      content: "React 공식 문서와 학습 자료 모음",
      areaId: "2",
      createdAt: "2025.05.08",
    },
    {
      id: "3",
      title: "명상 가이드",
      content: "일상에서 실천할 수 있는 명상 기법과 호흡법",
      areaId: "3",
      createdAt: "2025.05.05",
    },
  ];

  const archives = [
    {
      id: "loop-retro-current",
      loopId: "1",
      userId: "user-123",
      createdAt: "2025-07-01T09:00:00Z",
      type: "loop",
      title: "6월 루프: 건강한 개발자 되기 회고",
      summary: "매일 아침 운동 습관 성공, 클린 코드 작성 연습 시작",
      userRating: 4,
      bookmarked: true,
      status: "ended", // 종료된 루프
    },
    {
      id: "project-retro-1",
      projectId: "1",
      userId: "user-123",
      createdAt: "2025-05-31T09:00:00Z",
      type: "project",
      title: "아침 운동 습관화 프로젝트 회고",
      summary: "운동 습관 성공, 꾸준함의 중요성 깨달음",
      userRating: 4,
      bookmarked: true,
      status: "completed", // 완료된 프로젝트
    },
    {
      id: "loop-retro-101",
      loopId: "101",
      userId: "user-123",
      createdAt: "2025-05-31T00:00:00Z",
      type: "loop",
      title: "5월 루프: 독서 습관 만들기 회고",
      summary: "매일 30분 독서 목표 달성, 지식 확장 및 스트레스 해소에 도움",
      userRating: 5,
      bookmarked: true,
      status: "ended", // 종료된 루프
    },
    {
      id: "project-retro-102",
      projectId: "102",
      userId: "user-123",
      createdAt: "2025-04-20T00:00:00Z",
      type: "project",
      title: "블로그 리뉴얼 프로젝트 회고",
      summary: "새로운 디자인 적용 성공, 사용자 피드백 긍정적",
      userRating: 5,
      bookmarked: false,
      status: "completed", // 완료된 프로젝트
    },
    {
      id: "loop-retro-103",
      loopId: "103",
      userId: "user-123",
      createdAt: "2025-03-31T00:00:00Z",
      type: "loop",
      title: "3월 루프: 코딩 스킬 향상 회고",
      summary: "목표 미달성, 시간 관리 부족",
      userRating: 2,
      bookmarked: false,
      status: "ended", // 종료된 루프
    },
  ];

  // 불필요한 코드 제거 - TanStack Query가 처리함
  const [filterType, setFilterType] = useState("all"); // 'all', 'loop', 'project'
  const [sortBy, setSortBy] = useState("latest"); // 'latest', 'rating'

  const renderStars = (rating: number | undefined) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isOverdue = (endDate: string) => {
    const today = new Date();
    const dueDate = new Date(endDate);
    return dueDate < today;
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      <h1 className="text-2xl font-bold mb-6">PARA</h1>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="areas">Areas</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="archives">Archives</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>실제 행동 단위인 프로젝트</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/projects/new">
                <Plus className="mr-2 h-4 w-4" />새 프로젝트
              </Link>
            </Button>
          </div>

          {/* 프로젝트 필터링 */}
          <div className="flex items-center gap-2 mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {projectFilter === "all" ? (
                    <Filter className="mr-2 h-4 w-4" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {projectFilter === "all"
                    ? `전체 (${projects.length}개)`
                    : projectFilter === "planned"
                    ? `예정 (${
                        projects.filter((p) => p.status === "planned").length
                      }개)`
                    : projectFilter === "in_progress"
                    ? `진행 중 (${
                        projects.filter((p) => p.status === "in_progress")
                          .length
                      }개)`
                    : `완료됨 (${
                        projects.filter((p) => p.status === "completed").length
                      }개)`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setProjectFilter("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectFilter("planned")}>
                  예정
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setProjectFilter("in_progress")}
                >
                  진행 중
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setProjectFilter("completed")}>
                  완료됨
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-4">
            {projects.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-full bg-muted/50 p-4">
                    <Briefcase className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">프로젝트가 없어요</h3>
                <p className="text-muted-foreground mb-4">
                  목표를 달성하기 위한 프로젝트를 만들어보세요.
                </p>
                <Button asChild className="w-full max-w-xs">
                  <Link href="/para/projects/new">
                    <Plus className="mr-2 h-4 w-4" />새 프로젝트 만들기
                  </Link>
                </Button>
              </Card>
            ) : (
              <>
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => router.push(`/para/projects/${project.id}`)}
                  >
                    <div className="p-4">
                      {/* 제목과 뱃지들 */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-medium text-base flex-1 pr-2">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {project.area}
                          </Badge>
                          <Badge
                            variant={
                              project.status === "completed"
                                ? "secondary"
                                : "default"
                            }
                            className="text-xs"
                          >
                            {project.status === "completed"
                              ? "완료됨"
                              : "진행 중"}
                          </Badge>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>

                      {/* 하단 정보: 기간과 상태 아이콘 */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>
                            {formatDate(project.startDate)} ~{" "}
                            {formatDate(project.endDate)}
                          </span>
                          {/* 상태 이상 아이콘들 */}
                          <div className="flex items-center gap-1">
                            {/* 기한 초과 아이콘 */}
                            {isOverdue(project.endDate) && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}

                            {/* 장기 프로젝트 아이콘 (진행 중일 때만) */}
                            {project.status === "in_progress" &&
                              project.connectedLoops &&
                              project.connectedLoops.length >= 3 && (
                                <Clock className="h-3 w-3 text-amber-500" />
                              )}
                          </div>
                        </div>

                        {/* 진행률 */}
                        <span className="text-xs">
                          {project.progress}/{project.total}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="h-4 w-4" />
              <span>장기적 관심 영역</span>
              <span className="text-xs text-muted-foreground">
                ({areas.length}개)
              </span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/areas/new">
                <Plus className="mr-2 h-4 w-4" />새 영역
              </Link>
            </Button>
          </div>
          {areas.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Compass className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">활동 영역이 없어요</h3>
              <p className="text-muted-foreground mb-4">
                건강, 커리어, 자기계발 등 관심 있는 영역을 만들어보세요.
              </p>
              <Button asChild className="w-full max-w-xs">
                <Link href="/para/areas/new">
                  <Plus className="mr-2 h-4 w-4" />새 영역 만들기
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {areas.map((area) => {
                const getIconComponent = (iconId: string) => {
                  const iconMap: { [key: string]: any } = {
                    compass: Compass,
                    heart: Heart,
                    brain: Brain,
                    briefcase: Briefcase,
                    dollarSign: DollarSign,
                    users: Users,
                    gamepad2: Gamepad2,
                    dumbbell: Dumbbell,
                    bookOpen: BookOpenIcon,
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

                const AreaIcon = getIconComponent(area.icon);

                return (
                  <Card key={area.id} className="p-4">
                    <Link href={`/para/areas/${area.id}`} className="block">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="rounded-full p-1.5"
                            style={{ backgroundColor: `${area.color}20` }}
                          >
                            <AreaIcon
                              className="h-4 w-4"
                              style={{ color: area.color }}
                            />
                          </div>
                          <h3 className="text-lg font-bold">{area.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            프로젝트 {area.projectsCount}개
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            자료 {area.resourcesCount}개
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {area.description}
                      </p>
                      <div className="flex justify-end">
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Folder className="h-4 w-4" />
            <span>아이디어와 참고 자료</span>
            <span className="text-xs text-muted-foreground">
              ({resources.length}개)
            </span>
          </div>

          {resources.length === 0 ? (
            <Card className="p-6 text-center border-dashed mt-4">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-muted/50 p-4">
                  <Folder className="h-8 w-8 text-muted-foreground/50" />
                </div>
              </div>
              <h3 className="text-lg font-bold mb-2">참고 자료가 없어요</h3>
              <p className="text-muted-foreground mb-4">
                유용한 링크, 아이디어, 참고 자료를 저장해보세요.
              </p>
              <Button asChild className="w-full max-w-xs">
                <Link href="/para/resources/new">
                  <Plus className="mr-2 h-4 w-4" />새 자료 추가하기
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4 mt-4">
              {resources.map((resource) => (
                <Card key={resource.id} className="p-4">
                  <Link
                    href={`/para/resources/${resource.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{resource.title}</h3>
                      <Badge variant="outline" className="text-xs">
                        {areas.find((area) => area.id === resource.areaId)
                          ?.name || "기타"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {resource.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(resource.createdAt)}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
              <Archive className="h-4 w-4" />
              <span>완료된 항목에 대한 회고</span>
              <span className="text-xs text-muted-foreground">
                ({archives.length}개)
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {filterType === "all" ? (
                    <Filter className="mr-2 h-4 w-4" />
                  ) : (
                    <Filter className="mr-2 h-4 w-4 text-primary" />
                  )}
                  {filterType === "all"
                    ? "전체"
                    : filterType === "loop"
                    ? "루프 회고"
                    : "프로젝트 회고"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  전체
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("loop")}>
                  루프 회고
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("project")}>
                  프로젝트 회고
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortBy === "latest" ? (
                    <CalendarDays className="mr-2 h-4 w-4" />
                  ) : (
                    <Star className="mr-2 h-4 w-4" />
                  )}
                  {sortBy === "latest" ? "최신순" : "회고 별점순"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("latest")}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("rating")}>
                  <Star className="mr-2 h-4 w-4" />
                  회고 별점순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {archives.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-muted-foreground">
                아직 보관된 회고가 없어요.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {archives.map((archive) => (
                <Card key={archive.id} className="p-4">
                  <Link href={`/para/archives/${archive.id}`} className="block">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold">{archive.title}</h3>
                      <Badge
                        className={`text-xs ${
                          archive.type === "loop"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {archive.type === "loop"
                          ? "루프 회고"
                          : "프로젝트 회고"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {archive.summary}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(archive.createdAt)}</span>
                        {archive.bookmarked && (
                          <Bookmark className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                        {renderStars(archive.userRating)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ParaPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ParaPageContent />
    </Suspense>
  );
}
