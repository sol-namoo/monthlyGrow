"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  MapPin,
  Folder,
  BookOpen,
  Edit,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  // 샘플 데이터 로드 (실제 앱에서는 params.id를 사용하여 데이터베이스에서 가져옴)
  const areaData = {
    id: params.id,
    name: "개인 성장",
    description:
      "자기 계발 및 학습 관련 활동을 관리하는 영역입니다. 독서, 온라인 강의 수강, 새로운 기술 습득 등 다양한 프로젝트와 자료가 이 영역에 포함됩니다.",
    tags: ["자기계발", "학습", "성장"],
    associatedProjects: [
      {
        id: "p1",
        name: "Next.js 학습 프로젝트",
        status: "진행 중",
        link: "/para/projects/p1",
      },
      {
        id: "p2",
        name: "TypeScript 마스터하기",
        status: "완료",
        link: "/para/projects/p2",
      },
      {
        id: "p3",
        name: "포트폴리오 웹사이트 구축",
        status: "계획 중",
        link: "/para/projects/p3",
      },
    ],
    associatedResources: [
      { id: "r1", name: "클린 코드", type: "책", link: "/para/resources/r1" },
      {
        id: "r2",
        name: "React 공식 문서",
        type: "웹사이트",
        link: "/para/resources/r2",
      },
      {
        id: "r3",
        name: "실용주의 프로그래머",
        type: "책",
        link: "/para/resources/r3",
      },
    ],
  };

  // 실제 앱에서는 useEffect를 사용하여 데이터 로딩
  useEffect(() => {
    // fetchArea(params.id).then(data => setAreaData(data));
  }, [params.id]);

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/para/areas">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex-grow">영역 상세</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/para/areas/edit/${areaData.id}`}>
            <Edit className="mr-2 h-4 w-4" />
            영역 수정
          </Link>
        </Button>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">{areaData.name}</h2>
        <p className="text-sm text-muted-foreground">{areaData.description}</p>
        {areaData.tags && areaData.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {areaData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 연결된 프로젝트 목록 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            연결된 프로젝트 ({areaData.associatedProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areaData.associatedProjects.length > 0 ? (
            areaData.associatedProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{project.name}</span>
                  <Badge variant="outline" className="mt-1 w-fit">
                    {project.status}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={project.link} aria-label={`View ${project.name}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 연결된 프로젝트가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 연결된 자료 목록 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            연결된 자료 ({areaData.associatedResources.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {areaData.associatedResources.length > 0 ? (
            areaData.associatedResources.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{resource.name}</span>
                  <Badge variant="outline" className="mt-1 w-fit">
                    {resource.type}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    href={resource.link}
                    aria-label={`View ${resource.name}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              아직 연결된 자료가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
