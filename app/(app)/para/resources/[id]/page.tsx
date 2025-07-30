"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  LinkIcon,
  FileText,
  File,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ResourceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const [resource, setResource] = useState<any>(null); // 실제 데이터 타입으로 교체 필요
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 샘플 데이터 (실제로는 ID에 따라 DB에서 데이터를 불러와야 함)
  const sampleResources = [
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
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/para/resources/edit/${resource.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Resource 기본 정보 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-3">{resource.title}</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <span>생성일: {resource.createdAt}</span>
        </div>
      </div>

      <Card className="mb-6 p-4">
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
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {resource.content}
            </p>
          )}
        </div>

        {resource.area && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-2">연결된 Area</h3>
            <Badge variant="secondary" className="w-fit">
              {resource.area.name}
            </Badge>
          </div>
        )}
      </Card>
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Resource 삭제"
        type="delete"
        description="이 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        onConfirm={() => {
          alert("Resource가 삭제되었습니다.");
          router.push("/para?tab=resources");
        }}
      />
    </div>
  );
}
