"use client";
import { useEffect, useState, use, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { auth } from "@/lib/firebase/index";
import {
  fetchAreaById,
  fetchProjectsByAreaId,
  fetchAllResourcesByUserId,
  updateArea,
  deleteAreaById,
} from "@/lib/firebase/index";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

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
  const { translate } = useLanguage();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 영역 삭제 mutation
  const deleteAreaMutation = useMutation({
    mutationFn: () => deleteAreaById(id),
    onSuccess: () => {
      // 성공 시 캐시 무효화 및 목록 페이지로 이동
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: translate("para.areas.detail.success.deleteComplete"),
        description: deleteWithItems
          ? translate("para.areas.detail.success.deleteWithItems")
          : translate("para.areas.detail.success.deleteWithoutItems"),
      });
      router.push("/para?tab=areas");
    },
    onError: (error: Error) => {
      console.error("영역 삭제 실패:", error);
      toast({
        title: translate("para.areas.detail.error.deleteFailed"),
        description: translate("para.areas.detail.error.deleteError"),
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
            {translate("para.areas.detail.error.loadError")}
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
          <AlertDescription>
            {translate("para.areas.detail.error.notFound")}
          </AlertDescription>
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
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">
              {translate("para.areas.detail.connectedProjects")} (
              {projectsWithStatus.length})
            </TabsTrigger>
            <TabsTrigger value="resources">
              {translate("para.areas.detail.connectedResources")} (
              {areaResources.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects">
            <Card className="mb-4">
              <CardContent className="pt-6">
                {projectsWithStatus.length > 0 ? (
                  <div className="space-y-2">
                    {projectsWithStatus.map((project) => (
                      <Link
                        key={project.id}
                        href={`/para/projects/${project.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block">
                              {project.title}
                            </span>
                            {project.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0 ml-2"
                          >
                            {(() => {
                              const status = getProjectStatus(project);
                              switch (status) {
                                case "scheduled":
                                  return translate(
                                    "para.projects.status.planned"
                                  );
                                case "in_progress":
                                  return translate(
                                    "para.projects.status.inProgress"
                                  );
                                case "completed":
                                  return translate(
                                    "para.projects.status.completed"
                                  );
                                case "overdue":
                                  return translate(
                                    "para.projects.status.overdue"
                                  );
                                default:
                                  return translate(
                                    "para.projects.status.inProgress"
                                  );
                              }
                            })()}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {translate("para.areas.detail.noConnectedProjects")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="resources">
            <Card>
              <CardContent className="pt-6">
                {areaResources.length > 0 ? (
                  <div className="space-y-2">
                    {areaResources.map((resource) => (
                      <Link
                        key={resource.id}
                        href={`/para/resources/${resource.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <span className="font-medium block">
                              {resource.name}
                            </span>
                            {resource.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {resource.description}
                              </p>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {translate("para.areas.detail.noConnectedResources")}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 삭제 확인 다이얼로그 */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={translate("para.areas.detail.delete.title")}
          description={translate("para.areas.detail.delete.description")}
          type="delete"
          showCheckbox={true}
          checkboxLabel={translate("para.areas.detail.delete.withItems")}
          checkboxChecked={deleteWithItems}
          onCheckboxChange={setDeleteWithItems}
          warningMessage={
            deleteWithItems
              ? translate("para.areas.detail.delete.warning")
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
