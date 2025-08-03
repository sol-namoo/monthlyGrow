"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, use, Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchResourceById, deleteResourceById } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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

  const queryClient = useQueryClient();

  // 자료 삭제 mutation
  const deleteResourceMutation = useMutation({
    mutationFn: () => deleteResourceById(id),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      router.push("/para?tab=resources");
    },
    onError: (error: Error) => {
      console.error("자료 삭제 실패:", error);
      alert("자료 삭제에 실패했습니다.");
    },
  });

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
          <h1 className="text-2xl font-bold mb-2">{resource.name}</h1>
          {resource.area && (
            <Badge variant="secondary" className="mb-3">
              {resource.area}
            </Badge>
          )}
          {resource.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {resource.description}
            </p>
          )}
        </div>

        {/* 자료 내용 */}
        {(resource.link || resource.text) && (
          <Card className="mb-4">
            <div className="p-4 space-y-4">
              {resource.link && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    링크
                  </p>
                  <a
                    href={resource.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {resource.link}
                  </a>
                </div>
              )}

              {resource.text && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    내용
                  </p>
                  <div className="whitespace-pre-wrap text-sm">
                    {resource.text}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="자료 삭제"
          description="이 자료를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          onConfirm={() => {
            deleteResourceMutation.mutate();
            setShowDeleteDialog(false);
          }}
        />
      </div>
    </Suspense>
  );
}
