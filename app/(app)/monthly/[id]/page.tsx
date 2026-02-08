"use client";

import { useState, Suspense, use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronLeft,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchMonthlyById,
  fetchProjectsByMonthlyId,
  deleteMonthlyById,
  fetchAllAreasByUserId,
} from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { MonthlyDetailContent } from "@/components/monthly/MonthlyDetailContent";

// 로딩 스켈레톤 컴포넌트
function MonthlyDetailSkeleton() {
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
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

function MonthlyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [user, userLoading] = useAuthState(auth);
  const { translate } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 먼슬리 데이터 조회
  const { data: monthly, isLoading: monthlyLoading } = useQuery({
    queryKey: ["monthly", id],
    queryFn: () => fetchMonthlyById(id),
    enabled: !!id,
  });

  // 연결된 프로젝트 조회
  const { data: connectedProjects, isLoading: projectsLoading } = useQuery({
    queryKey: ["monthly-projects", id],
    queryFn: () => fetchProjectsByMonthlyId(id),
    enabled: !!id,
  });

  // Area 정보 조회
  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 로딩 상태
  if (userLoading || monthlyLoading || projectsLoading) {
    return <MonthlyDetailSkeleton />;
  }

  // 사용자가 없는 경우 - 화면에 아무것도 표시하지 않음
  if (!user) {
    return null;
  }

  // 먼슬리가 없는 경우
  if (!monthly) {
    return (
      <div className="container max-w-md px-4 py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {translate("monthlyDetail.notFound")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const status = getMonthlyStatus(monthly);
  const isPastMonthly = status === "ended";

  const handleDeleteConfirm = async () => {
    try {
      await deleteMonthlyById(id);
      toast({
        title: translate("monthlyDetail.delete.success"),
        description: translate("monthlyDetail.delete.successDescription"),
      });
      router.push("/monthly");
    } catch {
      toast({
        title: translate("monthlyDetail.delete.error.title"),
        description: translate("monthlyDetail.delete.error.description"),
        variant: "destructive",
      });
    }
    setShowDeleteDialog(false);
  };

  return (
    <div className="container max-w-md px-4 py-6 pb-20">
      {/* 헤더: 뒤로가기 + 수정/삭제 한 row (프로젝트 상세와 동일 패턴) */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          {!isPastMonthly && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/monthly/edit/${id}`}>
                  <Edit className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title={translate("monthlyDetail.delete.title")}
        description={translate("monthlyDetail.delete.description")}
        onConfirm={handleDeleteConfirm}
        destructive
      />

      {/* MonthlyDetailContent: 상세 페이지에서는 상단 액션 비노출(헤더에서 처리) */}
      <MonthlyDetailContent
        monthly={{
          ...monthly,
          connectedProjects: connectedProjects || [],
        }}
        allAreas={allAreas}
        showHeader={false}
        showActions={false}
        onDelete={() => {}}
      />
    </div>
  );
}

export default function MonthlyDetailPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<MonthlyDetailSkeleton />}>
      <MonthlyDetailPage params={params} />
    </Suspense>
  );
}
