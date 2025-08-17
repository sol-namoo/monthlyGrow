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
import {
  fetchResourceWithAreaById,
  deleteResourceById,
} from "@/lib/firebase/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { translate } = useLanguage();

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
      alert(translate("para.resources.detail.error.deleteError"));
    },
  });

  // Firestore에서 실제 데이터 가져오기
  const {
    data: resource,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResourceWithAreaById(id as string),
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
            {translate("para.resources.detail.error.loadError")}
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
          <AlertDescription>
            {translate("para.resources.detail.error.notFound")}
          </AlertDescription>
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
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-bold">{resource.name}</h1>
            {resource.area && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  resource.area === "미분류"
                    ? "border-red-300 text-red-700"
                    : ""
                }`}
              >
                {resource.area}
              </Badge>
            )}
          </div>
          {resource.description && (
            <p className="text-sm text-muted-foreground mb-4">
              {resource.description}
            </p>
          )}
        </div>

        {/* 자료 내용 */}
        <Card className="mb-4">
          <div className="p-4 space-y-4">
            {resource.link ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {translate("para.resources.detail.link")}
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
            ) : resource.text ? (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  {translate("para.resources.detail.content")}
                </p>
                <div className="whitespace-pre-wrap text-sm">
                  {resource.text}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground">
                  {translate("para.resources.detail.noContent")}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={translate("para.resources.detail.delete.title")}
          description={translate("para.resources.detail.delete.description")}
          onConfirm={() => {
            deleteResourceMutation.mutate();
            setShowDeleteDialog(false);
          }}
        />
      </div>
    </Suspense>
  );
}
