"use client";
import { useEffect, useState, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ChevronLeft,
  MapPin,
  Folder,
  BookOpen,
  Edit,
  ExternalLink,
  Compass,
  Heart,
  Brain,
  Briefcase,
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
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getProjectStatus } from "@/lib/utils";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import {
  fetchAreaById,
  fetchProjectsByAreaId,
  fetchAllResourcesByUserId,
  deleteAreaById,
} from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

// 로딩 스켈레톤 컴포넌트
function AreaDetailSkeleton() {
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

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [user, userLoading] = useAuthState(auth);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // 연결된 데이터를 함께 삭제할지 사용자가 선택
  const [deleteWithItems, setDeleteWithItems] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 영역 삭제 mutation
  const deleteAreaMutation = useMutation({
    mutationFn: () => deleteAreaById(id, deleteWithItems),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "영역 삭제 완료",
        description: deleteWithItems
          ? "영역과 연결된 모든 항목이 삭제되었습니다."
          : "영역이 삭제되었습니다. 연결된 프로젝트와 자료는 유지됩니다.",
      });
      router.push("/para?tab=areas");
    },
    onError: (error: Error) => {
      console.error("영역 삭제 실패:", error);
      toast({
        title: "삭제 실패",
        description: "영역 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // Firestore에서 실제 데이터 가져오기
  const {
    data: areaData,
    isLoading: isAreaLoading,
    error: areaError,
  } = useQuery({
    queryKey: ["area", id],
    queryFn: () => fetchAreaById(id),
    enabled: !!id,
  });

  // 연결된 프로젝트 가져오기
  const {
    data: projects,
    isLoading: isProjectsLoading,
    error: projectsError,
  } = useQuery({
    queryKey: ["projects", "area", id],
    queryFn: () => fetchProjectsByAreaId(id),
    enabled: !!id,
  });

  // 연결된 리소스 가져오기 (현재는 모든 리소스를 가져와서 필터링)
  const {
    data: allResources,
    isLoading: isResourcesLoading,
    error: resourcesError,
  } = useQuery({
    queryKey: ["resources", "area", id],
    queryFn: () => fetchAllResourcesByUserId(user?.uid || ""),
    enabled: !!id && !!user?.uid,
  });

  // 해당 영역의 리소스만 필터링
  const areaResources =
    allResources?.filter((resource) => resource.areaId === id) || [];

  // 에러 상태
  if (areaError || projectsError || resourcesError) {
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
            영역을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (!areaData) {
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
          <AlertDescription>해당 영역을 찾을 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // 아이콘 컴포넌트 매핑 함수
  const getIconComponent = (iconId: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
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
      heart: Heart,
      compass: Compass,
    };

    return iconMap[iconId] || Brain;
  };

  const IconComponent = getIconComponent(areaData.icon || "brain");

  // 프로젝트 상태 계산
  const projectsWithStatus =
    projects?.map((project) => ({
      ...project,
      status: getProjectStatus(project),
    })) || [];

  return (
    <Suspense fallback={<AreaDetailSkeleton />}>
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
            {/* "미분류" 영역은 수정/삭제 불가 */}
            {areaData.name !== "미분류" && (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/para/areas/edit/${id}`}>
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
              </>
            )}
          </div>
        </div>

        {/* 영역 정보 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-3 rounded-lg"
              style={{ backgroundColor: areaData.color + "20" }}
            >
              <IconComponent
                className="h-6 w-6"
                style={{ color: areaData.color }}
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{areaData.name}</h1>
              <p className="text-sm text-muted-foreground">
                {areaData.description}
              </p>
            </div>
          </div>
        </div>

        {/* 연결된 프로젝트 */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              연결된 프로젝트
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectsWithStatus.length > 0 ? (
              <div className="space-y-2">
                {projectsWithStatus.map((project) => (
                  <Link
                    key={project.id}
                    href={`/para/projects/${project.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{project.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const status = getProjectStatus(project);
                          switch (status) {
                            case "scheduled":
                              return "예정";
                            case "in_progress":
                              return "진행 중";
                            case "completed":
                              return "완료됨";
                            case "overdue":
                              return "기한 지남";
                            default:
                              return "진행 중";
                          }
                        })()}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                연결된 프로젝트가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 연결된 자료 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              연결된 자료
            </CardTitle>
          </CardHeader>
          <CardContent>
            {areaResources.length > 0 ? (
              <div className="space-y-2">
                {areaResources.map((resource) => (
                  <Link
                    key={resource.id}
                    href={`/para/resources/${resource.id}`}
                    className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{resource.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {resource.description}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                연결된 자료가 없습니다.
              </p>
            )}
          </CardContent>
        </Card>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="영역 삭제"
          description="이 영역을 삭제하시겠습니까?"
          type="delete"
          showCheckbox={true}
          checkboxLabel="연결된 프로젝트와 자료도 함께 삭제"
          checkboxChecked={deleteWithItems}
          onCheckboxChange={setDeleteWithItems}
          warningMessage={
            deleteWithItems
              ? "연결된 모든 프로젝트와 자료가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
              : undefined
          }
          onConfirm={() => {
            deleteAreaMutation.mutate();
            setShowDeleteDialog(false);
          }}
        />
      </div>
    </Suspense>
  );
}
