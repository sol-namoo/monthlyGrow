"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter } from "next/navigation";

export default function ParaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "projects";

  const handleTabChange = (value: string) => {
    router.push(`/para?tab=${value}`, { scroll: false });
  };

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
    },
  ];

  const areas = [
    {
      id: "1",
      name: "건강",
      description: "신체적, 정신적 건강을 관리하고 증진하는 활동",
      projectsCount: 1,
      resourcesCount: 2,
    },
    {
      id: "2",
      name: "개발",
      description: "프로그래밍 스킬 향상 및 프로젝트 개발",
      projectsCount: 3,
      resourcesCount: 5,
    },
    {
      id: "3",
      name: "생산성",
      description: "업무 효율성 증대 및 시간 관리",
      projectsCount: 1,
      resourcesCount: 3,
    },
    {
      id: "4",
      name: "자기계발",
      description: "개인의 성장과 역량 강화를 위한 학습 및 경험",
      projectsCount: 0,
      resourcesCount: 4,
    },
    {
      id: "5",
      name: "재정",
      description: "개인 재정 관리 및 투자 학습",
      projectsCount: 0,
      resourcesCount: 1,
    },
  ];

  const resources = [
    {
      id: "1",
      title: "운동 루틴 아이디어",
      type: "note",
      content:
        "월: 전신 운동, 화: 유산소, 수: 휴식, 목: 상체, 금: 하체, 주말: 가벼운 활동",
      area: { id: "1", name: "건강" },

      createdAt: "2025.05.10",
    },
    {
      id: "2",
      title: "개발 참고 자료",
      type: "link",
      content: "https://react.dev/learn",
      area: { id: "2", name: "개발" },

      createdAt: "2025.05.08",
    },
    {
      id: "3",
      title: "명상 가이드",
      type: "file",
      content: "/files/meditation_guide.pdf",
      area: { id: "3", name: "마음" },

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
    },
  ];

  const [filterType, setFilterType] = useState("all"); // 'all', 'loop', 'project'
  const [sortBy, setSortBy] = useState("latest"); // 'latest', 'rating'

  const filteredArchives = archives
    .filter((archive) => {
      if (filterType === "all") return true;
      return archive.type === filterType;
    })
    .sort((a, b) => {
      if (sortBy === "latest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "rating") {
        return (b.userRating || 0) - (a.userRating || 0);
      }
      return 0;
    });

  const renderStars = (rating: number | undefined) => {
    if (rating === undefined) return null;
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
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
              <span>현재 진행 중인 프로젝트</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/projects/new">
                <Plus className="mr-2 h-4 w-4" />새 프로젝트
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="p-4">
                <Link href={`/para/projects/${project.id}`} className="block">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{project.title}</h3>
                    <Badge
                      className={`${
                        project.status === "in_progress"
                          ? "bg-primary"
                          : "bg-primary/30"
                      }`}
                    >
                      {project.status === "in_progress" ? "진행 중" : "완료됨"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="h-4 w-4" />
                    <span>
                      {project.startDate} ~ {project.endDate}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      달성률:{" "}
                      {Math.round((project.progress / project.total) * 100)}%
                    </span>
                    <span>
                      {project.progress}/{project.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-value"
                      style={{
                        width: `${Math.round(
                          (project.progress / project.total) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm">
                      자세히 보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="areas" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Compass className="h-4 w-4" />
              <span>장기적 관심 영역</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/areas/new">
                <Plus className="mr-2 h-4 w-4" />새 영역
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {areas.map((area) => (
              <Card key={area.id} className="p-4">
                <Link href={`/para/areas/${area.id}`} className="block">
                  <h3 className="text-lg font-bold mb-2">{area.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                    {area.description}
                  </p>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>프로젝트: {area.projectsCount}개</span>
                    <span>|</span>
                    <span>자료: {area.resourcesCount}개</span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm">
                      자세히 보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Folder className="h-4 w-4" />
              <span>아이디어와 참고 자료</span>
            </div>
            <Button size="sm" asChild>
              <Link href="/para/resources/new">
                <Plus className="mr-2 h-4 w-4" />새 자료
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {resources.map((resource) => (
              <Card key={resource.id} className="p-4">
                <Link href={`/para/resources/${resource.id}`} className="block">
                  <h3 className="text-lg font-bold mb-2">{resource.title}</h3>
                  <div>
                    {resource.area ? (
                      <Badge variant="secondary" className="mb-2">
                        {resource.area.name}
                      </Badge>
                    ) : (
                      <></>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                    {resource.content}
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button variant="ghost" size="sm">
                      자세히 보기
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="archives" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground h-9">
              <Archive className="h-4 w-4" />
              <span>완료된 항목에 대한 회고</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
              >
                전체
              </Button>
              <Button
                variant={filterType === "loop" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("loop")}
              >
                루프 회고
              </Button>
              <Button
                variant={filterType === "project" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("project")}
              >
                프로젝트 회고
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={sortBy === "latest" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("latest")}
              >
                최신순
              </Button>
              <Button
                variant={sortBy === "rating" ? "default" : "outline"}
                size="sm"
                onClick={() => setSortBy("rating")}
              >
                별점순
              </Button>
            </div>
          </div>
          {filteredArchives.length === 0 ? (
            <Card className="p-6 text-center border-dashed">
              <p className="text-muted-foreground">
                아직 보관된 회고가 없어요.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredArchives.map((archive) => (
                <Card key={archive.id} className="p-4">
                  <Link href={`/para/archives/${archive.id}`} className="block">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">{archive.title}</h3>
                      <div className="flex items-center gap-2">
                        {archive.bookmarked && (
                          <Bookmark className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {renderStars(archive.userRating)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(archive.createdAt)}</span>
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
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {archive.summary}
                    </p>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm">
                        자세히 보기
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
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
