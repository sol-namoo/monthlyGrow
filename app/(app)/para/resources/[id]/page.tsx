"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Tag, LinkIcon, FileText, File } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function ResourceDetailPage() {
  const params = useParams();
  const { id } = params;
  const [resource, setResource] = useState<any>(null); // 실제 데이터 타입으로 교체 필요

  // 샘플 데이터 (실제로는 ID에 따라 DB에서 데이터를 불러와야 함)
  const sampleResources = [
    {
      id: "1",
      title: "운동 루틴 아이디어",
      type: "note",
      content:
        "월: 전신 운동, 화: 유산소, 수: 휴식, 목: 상체, 금: 하체, 주말: 가벼운 활동",
      area: { id: "1", name: "건강" },
      tags: ["운동", "루틴", "건강"],
      createdAt: "2025.05.10",
    },
    {
      id: "2",
      title: "개발 참고 자료",
      type: "link",
      content: "https://react.dev/learn",
      area: { id: "2", name: "개발" },
      tags: ["React", "프론트엔드", "문서"],
      createdAt: "2025.05.08",
    },
    {
      id: "3",
      title: "명상 가이드",
      type: "file",
      content: "/files/meditation_guide.pdf",
      area: { id: "3", name: "마음" },
      tags: ["명상", "마음챙김", "PDF"],
      createdAt: "2025.05.05",
    },
  ];

  useEffect(() => {
    // 실제 앱에서는 여기서 ID를 사용하여 DB에서 Resource 데이터를 불러옵니다.
    const foundResource = sampleResources.find((r) => r.id === id);
    setResource(foundResource || null);
  }, [id]);

  if (!resource) {
    return (
      <div className="container max-w-md px-4 py-6 text-center">
        <p className="text-muted-foreground">
          자료를 불러오는 중이거나, 자료를 찾을 수 없습니다.
        </p>
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "note":
        return <FileText className="h-5 w-5" />;
      case "link":
        return <LinkIcon className="h-5 w-5" />;
      case "file":
        return <File className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/para?tab=resources">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{resource.title}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/para/resources/edit/${resource.id}`}>자료 수정</Link>
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-muted rounded-full">
            {getTypeIcon(resource.type)}
          </div>
          <div>
            <h2 className="text-xl font-bold mb-1">
              유형:{" "}
              {resource.type === "note"
                ? "노트"
                : resource.type === "link"
                ? "링크"
                : "파일"}
            </h2>
            <p className="text-sm text-muted-foreground">
              생성일: {resource.createdAt}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">내용</h3>
          {resource.type === "link" ? (
            <a
              href={resource.content}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {resource.content}
            </a>
          ) : resource.type === "file" ? (
            <p className="text-muted-foreground break-all">
              파일 경로: {resource.content}
            </p>
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {resource.content}
            </p>
          )}
        </div>

        {resource.area && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">연결된 Area</h3>
            <Badge
              variant="secondary"
              className="flex items-center gap-1 w-fit"
            >
              <Tag className="h-3 w-3" />
              {resource.area.name}
            </Badge>
          </div>
        )}

        <div>
          <h3 className="font-semibold text-lg mb-2">태그</h3>
          <div className="flex flex-wrap gap-2">
            {resource.tags.map((tag: string, index: number) => (
              <Badge
                key={index}
                variant="outline"
                className="flex items-center gap-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
