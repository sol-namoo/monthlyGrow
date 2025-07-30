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
import { useRouter } from "next/navigation";
import { useState, use, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery } from "@tanstack/react-query";
import { fetchResourceById } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 로딩 스켈레톤 컴포넌트
function ResourceDetailSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Firestore에서 실제 데이터 가져오기
  const {
    data: resource,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResourceById(id as string),
    enabled: !!id,
  });

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>

        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />

        <Skeleton className="h-32 w-full mb-4" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            자료를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!resource) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Alert>
          <AlertDescription>해당 자료를 찾을 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getResourceIcon = () => {
    if (resource.link) {
      return <LinkIcon className="h-5 w-5" />;
    } else if (resource.text) {
      return <FileText className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  const getResourceLabel = () => {
    if (resource.link) {
      return "링크";
    } else if (resource.text) {
      return "노트";
    } else {
      return "자료";
    }
  };

  return (
    <Suspense fallback={<ResourceDetailSkeleton />}>
      <div className="container max-w-md px-4 py-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
          >
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

        {/* 자료 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted">{getResourceIcon()}</div>
            <div>
              <h1 className="text-xl font-semibold">{resource.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {getResourceLabel()}
                </Badge>
                {resource.area && (
                  <Badge variant="secondary" className="text-xs">
                    {resource.area}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {resource.description}
          </p>
        </div>

        {/* 자료 내용 */}
        <Card className="mb-4">
          <div className="p-4">
            {resource.link ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">링크:</p>
                <a
                  href={resource.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {resource.link}
                </a>
              </div>
            ) : resource.text ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">내용:</p>
                <div className="whitespace-pre-wrap text-sm">
                  {resource.text}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">내용이 없습니다.</p>
            )}
          </div>
        </Card>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="자료 삭제"
          description="이 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={() => {
            // TODO: 삭제 로직 구현
            setShowDeleteDialog(false);
          }}
        />
      </div>
    </Suspense>
  );
}
