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

type ResourceFormData = {
  title: string;
  description?: string;
  url?: string;
  text?: string;
  area: string;
};

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
  const { translate } = useLanguage();

  // 폼 스키마 정의 (translate 함수 사용을 위해 컴포넌트 내부로 이동)
  const resourceFormSchema = z.object({
    title: z
      .string()
      .min(1, translate("para.resources.edit.validation.titleRequired")),
    description: z.string().optional(),
    url: z
      .string()
      .url(translate("para.resources.edit.validation.urlInvalid"))
      .optional()
      .or(z.literal("")),
    text: z.string().optional(),
    area: z
      .string()
      .min(1, translate("para.resources.edit.validation.areaRequired")),
  });

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
        title: translate("para.resources.edit.success.title"),
        description: translate("para.resources.edit.success.description"),
      });
      router.push(`/para/resources/${id}`);
    },
    onError: (error: Error) => {
      toast({
        title: translate("para.resources.edit.error.title"),
        description:
          error.message || translate("para.resources.edit.error.description"),
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
          <h1 className="text-2xl font-bold">
            {translate("para.resources.edit.title")}
          </h1>
        </div>

        <Alert>
          <AlertDescription>
            {translate("para.resources.detail.error.loadError")}
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
          <h1 className="text-2xl font-bold">
            {translate("para.resources.edit.title")}
          </h1>
        </div>

        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Book className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h2 className="text-lg font-bold mb-2">
            {translate("para.resources.edit.description")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {translate("para.resources.edit.explanation")}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">
                {translate("para.resources.edit.titleLabel")}
              </Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder={translate("para.resources.edit.titlePlaceholder")}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="area">
                {translate("para.resources.edit.areaLabel")}
              </Label>
              <Select
                onValueChange={(value) => form.setValue("area", value)}
                value={form.watch("area")}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={translate(
                      "para.resources.edit.areaPlaceholder"
                    )}
                  />
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
              <Label htmlFor="description">
                {translate("para.resources.edit.descriptionLabel")}
              </Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder={translate(
                  "para.resources.edit.descriptionPlaceholder"
                )}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="url">
                {translate("para.resources.edit.linkLabel")}
              </Label>
              <Input
                id="url"
                type="url"
                {...form.register("url")}
                placeholder={translate("para.resources.edit.linkPlaceholder")}
              />
              {form.formState.errors.url && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.url.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="text">
                {translate("para.resources.edit.contentLabel")}
              </Label>
              <Textarea
                id="text"
                {...form.register("text")}
                placeholder={translate(
                  "para.resources.edit.contentPlaceholder"
                )}
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
              {updateResourceMutation.isPending
                ? translate("para.resources.edit.submitting")
                : translate("para.resources.edit.submit")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {translate("para.resources.edit.cancel")}
            </Button>
          </div>
        </form>
      </div>
    </Suspense>
  );
}
