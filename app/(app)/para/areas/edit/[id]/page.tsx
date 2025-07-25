"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, MapPin, Folder, BookOpen, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { SelectItemsDialog } from "@/components/widgets/select-items-dialog";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  status: string;
}

interface Resource {
  id: string;
  name: string;
  type: string;
}

export default function EditAreaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // 샘플 데이터 로드 (실제 앱에서는 params.id를 사용하여 데이터베이스에서 가져옴)
  const initialAreaData = {
    name: "개인 성장",
    description: "자기 계발 및 학습 관련 활동을 관리하는 영역입니다.",
    tags: "자기계발, 학습, 성장",
    associatedProjects: [
      { id: "p1", name: "Next.js 학습 프로젝트", status: "진행 중" },
      { id: "p2", name: "TypeScript 마스터하기", status: "완료" },
    ],
    associatedResources: [
      { id: "r1", name: "클린 코드", type: "책" },
      { id: "r2", name: "React 공식 문서", type: "웹사이트" },
    ],
  };

  // 모든 프로젝트 및 자료 샘플 데이터 (실제 앱에서는 데이터베이스에서 가져옴)
  const allAvailableProjects: Project[] = [
    { id: "p1", name: "Next.js 학습 프로젝트", status: "진행 중" },
    { id: "p2", name: "TypeScript 마스터하기", status: "완료" },
    { id: "p3", name: "포트폴리오 웹사이트 구축", status: "계획 중" },
    { id: "p4", name: "알고리즘 문제 풀이", status: "진행 중" },
  ];

  const allAvailableResources: Resource[] = [
    { id: "r1", name: "클린 코드", type: "책" },
    { id: "r2", name: "React 공식 문서", type: "웹사이트" },
    { id: "r3", name: "실용주의 프로그래머", type: "책" },
    { id: "r4", name: "MDN Web Docs", type: "웹사이트" },
  ];

  const [formData, setFormData] = useState(initialAreaData);
  const [isProjectSelectOpen, setIsProjectSelectOpen] = useState(false);
  const [isResourceSelectOpen, setIsResourceSelectOpen] = useState(false);

  useEffect(() => {
    // 실제 앱에서는 여기서 params.id를 사용하여 데이터를 불러와 setFormData
    // 예: fetchArea(params.id).then(data => setFormData(data));

    const tab = searchParams.get("tab");
    if (tab === "projects") {
      setIsProjectSelectOpen(true);
    } else if (tab === "resources") {
      setIsResourceSelectOpen(true);
    }
  }, [params.id, searchParams]);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveProjects = (selectedIds: string[]) => {
    const newAssociatedProjects = allAvailableProjects.filter((p) =>
      selectedIds.includes(p.id)
    );
    setFormData((prev) => ({
      ...prev,
      associatedProjects: newAssociatedProjects,
    }));
  };

  const handleSaveResources = (selectedIds: string[]) => {
    const newAssociatedResources = allAvailableResources.filter((r) =>
      selectedIds.includes(r.id)
    );
    setFormData((prev) => ({
      ...prev,
      associatedResources: newAssociatedResources,
    }));
  };

  const handleRemoveProject = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      associatedProjects: prev.associatedProjects.filter(
        (p) => p.id !== projectId
      ),
    }));
  };

  const handleRemoveResource = (resourceId: string) => {
    setFormData((prev) => ({
      ...prev,
      associatedResources: prev.associatedResources.filter(
        (r) => r.id !== resourceId
      ),
    }));
  };

  const handleCloseModal = () => {
    // 모달 닫기 시 URL 파라미터 제거
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.delete("tab");
    const query = current.toString();
    const newUrl = query
      ? `${window.location.pathname}?${query}`
      : window.location.pathname;
    router.replace(newUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 여기서 Area 업데이트 로직 구현
    // formData.name, formData.description, formData.tags,
    // formData.associatedProjects, formData.associatedResources를 서버로 전송
    console.log("Updated Area Data:", formData);

    toast({
      title: "영역 수정 완료",
      description: `${formData.name} 영역이 업데이트되었습니다.`,
    });

    // 영역 상세 페이지로 이동
    router.push(`/para/areas/${params.id}`);
  };

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/para/areas/${params.id}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">영역 수정하기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">영역 정보를 수정하세요</h2>
        <p className="text-sm text-muted-foreground">
          영역의 이름과 설명을 업데이트할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="mb-6 p-4">
          <div className="mb-4">
            <Label htmlFor="name">영역 이름</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="예: 개인 성장, 재정 관리"
              className="mt-1"
              required
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">간단한 설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="이 영역에 대한 간단한 설명을 입력하세요."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="tags">태그</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="태그를 쉼표로 구분해서 입력하세요 (예: 자기계발, 학습)"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              태그를 사용하면 영역을 쉽게 분류할 수 있습니다.
            </p>
          </div>
        </Card>

        {/* 연결된 프로젝트 섹션 */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            연결된 프로젝트
          </h2>
          {formData.associatedProjects.length > 0 ? (
            <div className="space-y-2">
              {formData.associatedProjects.map((project) => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveProject(project.id)}
                    aria-label={`Remove ${project.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              아직 연결된 프로젝트가 없습니다.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full bg-transparent"
            onClick={() => setIsProjectSelectOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            기존 프로젝트 추가
          </Button>
        </Card>

        {/* 연결된 자료 섹션 */}
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            연결된 자료
          </h2>
          {formData.associatedResources.length > 0 ? (
            <div className="space-y-2">
              {formData.associatedResources.map((resource) => (
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveResource(resource.id)}
                    aria-label={`Remove ${resource.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              아직 연결된 자료가 없습니다.
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-4 w-full bg-transparent"
            onClick={() => setIsResourceSelectOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            기존 자료 추가
          </Button>
        </Card>

        <Button type="submit" className="w-full">
          변경 사항 저장
        </Button>
      </form>

      {/* 프로젝트 선택 모달 */}
      <SelectItemsDialog
        isOpen={isProjectSelectOpen}
        onClose={() => {
          setIsProjectSelectOpen(false);
          handleCloseModal();
        }}
        items={allAvailableProjects}
        selectedItemIds={formData.associatedProjects.map((p) => p.id)}
        onSave={handleSaveProjects}
        title="프로젝트 선택"
        description="이 영역에 연결할 프로젝트를 선택하세요."
        searchPlaceholder="프로젝트 검색..."
      />

      {/* 자료 선택 모달 */}
      <SelectItemsDialog
        isOpen={isResourceSelectOpen}
        onClose={() => {
          setIsResourceSelectOpen(false);
          handleCloseModal();
        }}
        items={allAvailableResources}
        selectedItemIds={formData.associatedResources.map((r) => r.id)}
        onSave={handleSaveResources}
        title="자료 선택"
        description="이 영역에 연결할 자료를 선택하세요."
        searchPlaceholder="자료 검색..."
      />
    </div>
  );
}
