"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { use, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Book } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchResourceById,
  updateResource,
  fetchAllAreasByUserId,
  auth,
} from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 폼 스키마 정의
const resourceFormSchema = z.object({
  title: z.string().min(1, "자료 제목을 입력해주세요"),
  description: z.string().optional(),
  url: z.string().url("올바른 URL을 입력해주세요").optional().or(z.literal("")),
  text: z.string().optional(),
  area: z.string().min(1, "영역을 선택해주세요"),
});

type ResourceFormData = z.infer<typeof resourceFormSchema>;

// 로딩 스켈레톤 컴포넌트
function EditResourceSkeleton() {
  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Skeleton className="h-8 w-8 mr-2" />
        <Skeleton className="h-6 w-32" />
      </div>

      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4 mb-6" />

      <Skeleton className="h-32 w-full mb-4" />
      <Skeleton className="h-32 w-full mb-4" />
    </div>
  );
}

export default function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [user, userLoading] = useAuthState(auth);

  // react-hook-form 설정
  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      url: "",
      text: "",
      area: "",
    },
  });

  // 자료 데이터 가져오기
  const {
    data: resource,
    isLoading: resourceLoading,
    error: resourceError,
  } = useQuery({
    queryKey: ["resource", id],
    queryFn: () => fetchResourceById(id),
    enabled: !!id,
  });

  // 영역 데이터 가져오기
  const { data: allAreas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 자료 수정 mutation
  const updateResourceMutation = useMutation({
    mutationFn: (data: ResourceFormData) =>
      updateResource(id, {
        name: data.title,
        description: data.description || "",
        link: data.url || undefined,
        text: data.text || undefined,
        areaId: data.area,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource", id] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({
        title: "자료 수정 완료",
        description: "자료가 성공적으로 수정되었습니다.",
      });
      router.push(`/para/resources/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "자료 수정 실패",
        description: error.message || "자료 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 자료 데이터가 로드되면 폼에 설정
  useEffect(() => {
    if (resource) {
      form.reset({
        title: resource.name,
        description: resource.description || "",
        url: resource.link || "",
        text: resource.text || "",
        area: resource.areaId || "",
      });
    }
  }, [resource, form]);

  const onSubmit = (data: ResourceFormData) => {
    updateResourceMutation.mutate(data);
  };

  if (userLoading || resourceLoading) {
    return <EditResourceSkeleton />;
  }

  if (resourceError || !resource) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href="/para?tab=resources">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">자료 수정</h1>
        </div>

        <Alert>
          <AlertDescription>
            자료를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Suspense fallback={<EditResourceSkeleton />}>
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" size="icon" asChild className="mr-2">
            <Link href={`/para/resources/${id}`}>
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">자료 수정</h1>
        </div>

        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Book className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2">자료를 수정해보세요</h2>
          <p className="text-sm text-muted-foreground">
            자료의 내용이나 연결된 영역을 변경하여 최신 상태로 유지할 수
            있습니다.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">자료 제목</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="예: 효과적인 시간 관리법"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="area">소속 영역</Label>
              <Select
                onValueChange={(value) => form.setValue("area", value)}
                value={form.watch("area")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="영역을 선택해주세요" />
                </SelectTrigger>
                <SelectContent>
                  {allAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.area && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.area.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">설명 (선택 사항)</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="자료에 대한 간단한 설명을 입력하세요 (리스트에서 미리보기로 표시됩니다)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="url">링크 (선택 사항)</Label>
              <Input
                id="url"
                type="url"
                {...form.register("url")}
                placeholder="https://example.com"
              />
              {form.formState.errors.url && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="text">내용 (선택 사항)</Label>
              <Textarea
                id="text"
                {...form.register("text")}
                placeholder="자료의 상세한 내용을 입력하세요 (긴 텍스트, 메모, 요약 등)"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateResourceMutation.isPending}
            >
              {updateResourceMutation.isPending ? "수정 중..." : "자료 수정"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </div>
    </Suspense>
  );
}
