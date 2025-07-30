"use client";
import { useEffect, useState } from "react";
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

export default function AreaDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteWithItems, setDeleteWithItems] = useState(false);

  // 샘플 데이터 로드 (실제 앱에서는 params.id를 사용하여 데이터베이스에서 가져옴)
  const areaData = {
    id: params.id,
    name: "개인 성장",
    description:
      "자기 계발 및 학습 관련 활동을 관리하는 영역입니다. 독서, 온라인 강의 수강, 새로운 기술 습득 등 다양한 프로젝트와 자료가 이 영역에 포함됩니다.",
    icon: "brain",
    color: "#8b5cf6",
    // tags: ["자기계발", "학습", "성장"], // 태그 기능 제거
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
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/para/areas/edit/${areaData.id}`}>
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

      {/* Area 기본 정보 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="rounded-full p-3"
            style={{ backgroundColor: `${areaData.color}20` }}
          >
            {(() => {
              const getIconComponent = (iconId: string) => {
                const iconMap: { [key: string]: any } = {
                  compass: Compass,
                  heart: Heart,
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
                };
                return iconMap[iconId] || Compass;
              };
              const AreaIcon = getIconComponent(areaData.icon);
              return (
                <AreaIcon
                  className="h-6 w-6"
                  style={{ color: areaData.color }}
                />
              );
            })()}
          </div>
          <h1 className="text-2xl font-bold">{areaData.name}</h1>
        </div>
        <p className="text-muted-foreground mb-4">{areaData.description}</p>
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setDeleteWithItems(false);
        }}
        title="Area 삭제"
        type="delete"
        showCheckbox={
          areaData.associatedProjects.length > 0 ||
          areaData.associatedResources.length > 0
        }
        checkboxLabel="이 Area와 연결된 모든 항목을 함께 삭제하시겠습니까?"
        checkboxChecked={deleteWithItems}
        onCheckboxChange={setDeleteWithItems}
        warningMessage={
          deleteWithItems
            ? "이 작업은 되돌릴 수 없습니다. 연결된 모든 프로젝트와 자료가 영구적으로 삭제됩니다."
            : undefined
        }
        onConfirm={() => {
          if (deleteWithItems) {
            alert(
              `Area와 연결된 모든 항목(${areaData.associatedProjects.length}개 프로젝트, ${areaData.associatedResources.length}개 자료)이 함께 삭제되었습니다.`
            );
          } else {
            alert("Area가 삭제되었습니다.");
          }
          router.push("/para?tab=areas");
        }}
        confirmDisabled={
          (areaData.associatedProjects.length > 0 ||
            areaData.associatedResources.length > 0) &&
          !deleteWithItems
        }
      >
        {areaData.associatedProjects.length > 0 ||
        areaData.associatedResources.length > 0 ? (
          <>
            <p className="text-red-600 font-medium">
              연결된 항목이 있어서 삭제할 수 없습니다.
            </p>
            <div className="space-y-2">
              {areaData.associatedProjects.length > 0 && (
                <div>
                  <p className="font-medium text-sm">
                    연결된 프로젝트 ({areaData.associatedProjects.length}개):
                  </p>
                  <ul className="text-sm text-muted-foreground ml-4">
                    {areaData.associatedProjects.map((project) => (
                      <li key={project.id}>• {project.name}</li>
                    ))}
                  </ul>
                </div>
              )}
              {areaData.associatedResources.length > 0 && (
                <div>
                  <p className="font-medium text-sm">
                    연결된 자료 ({areaData.associatedResources.length}개):
                  </p>
                  <ul className="text-sm text-muted-foreground ml-4">
                    {areaData.associatedResources.map((resource) => (
                      <li key={resource.id}>• {resource.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        ) : (
          <p>이 Area를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
