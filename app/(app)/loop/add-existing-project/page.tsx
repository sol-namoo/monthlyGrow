"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/feedback/Loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

function AddExistingProjectPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const loopId = searchParams.get("loopId");

  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [showOnlyUnconnected, setShowOnlyUnconnected] = useState(true);

  // 샘플 데이터 - 현재 루프 정보
  const currentLoop = {
    id: loopId || "1",
    title: "5월 루프: 건강 관리",
    projectCount: 4, // 현재 루프에 연결된 프로젝트 수
  };

  // 샘플 데이터 - 기존 프로젝트
  const existingProjects = [
    {
      id: 5,
      title: "블로그 글 작성",
      description: "개인 블로그에 주 1회 글 작성",
      area: "커리어",
      progress: 30,
      total: 100,
      connectedLoop: null,
    },
    {
      id: 6,
      title: "재테크 공부",
      description: "투자 관련 지식 습득",
      area: "재정",
      progress: 10,
      total: 100,
      connectedLoop: null,
    },
    {
      id: 7,
      title: "외국어 학습",
      description: "매일 30분 영어 공부",
      area: "자기계발",
      progress: 20,
      total: 100,
      connectedLoop: "4월 루프: 생활 습관 개선",
    },
  ];

  // 필터링된 프로젝트 계산 로직
  const filteredProjects = showOnlyUnconnected
    ? existingProjects.filter((project) => !project.connectedLoop)
    : existingProjects;

  // 프로젝트 선택 토글 함수
  const toggleProject = (projectId: number) => {
    if (selectedProjects.includes(projectId)) {
      setSelectedProjects(selectedProjects.filter((id) => id !== projectId));
    } else {
      // 프로젝트 개수 제한 확인 (현재 루프 프로젝트 + 선택된 프로젝트 <= 5)
      if (currentLoop.projectCount + selectedProjects.length < 5) {
        setSelectedProjects([...selectedProjects, projectId]);
      }
    }
  };

  // 프로젝트 추가 가능 여부 확인
  const canAddMoreProjects =
    currentLoop.projectCount + selectedProjects.length < 5;

  // 프로젝트 추가 처리 함수
  const handleAddProjects = () => {
    // 여기서 선택된 프로젝트를 루프에 추가하는 로직 구현
    // 추가 후 루프 상세 페이지로 이동
    router.push(`/loop/${loopId}`);
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/loop/${loopId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">기존 프로젝트 추가</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-lg font-bold">{currentLoop.title}</h2>
        <p className="text-sm text-muted-foreground">
          현재 루프에 연결된 프로젝트: {currentLoop.projectCount}/5
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          추가 가능한 프로젝트: {Math.max(0, 5 - currentLoop.projectCount)}개
        </p>
      </Card>

      {!canAddMoreProjects && (
        <Alert className="mb-6 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-600">프로젝트 추가 불가</AlertTitle>
          <AlertDescription className="text-red-600">
            한 루프에는 최대 5개의 프로젝트만 등록할 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">프로젝트 선택</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOnlyUnconnected(!showOnlyUnconnected)}
        >
          {showOnlyUnconnected ? "모든 프로젝트 보기" : "루프 미연결만 보기"}
        </Button>
      </div>

      <div className="space-y-3 mb-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`cursor-pointer rounded-lg border p-3 transition-all ${
                selectedProjects.includes(project.id)
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              } ${
                !canAddMoreProjects && !selectedProjects.includes(project.id)
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedProjects.includes(project.id)}
                    onCheckedChange={() => toggleProject(project.id)}
                    disabled={
                      !canAddMoreProjects &&
                      !selectedProjects.includes(project.id)
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

              {project.connectedLoop && (
                <div className="mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {project.connectedLoop}에 연결됨
                  </Badge>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              {showOnlyUnconnected
                ? "루프에 연결되지 않은 프로젝트가 없습니다"
                : "추가할 수 있는 프로젝트가 없습니다"}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={handleAddProjects}
          disabled={selectedProjects.length === 0}
        >
          {selectedProjects.length}개 프로젝트 추가
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/loop/${loopId}`}>취소</Link>
        </Button>
      </div>
    </div>
  );
}

export default function AddExistingProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AddExistingProjectPageContent />
    </Suspense>
  );
}
