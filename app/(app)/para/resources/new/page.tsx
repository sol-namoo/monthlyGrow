"use client";

import type React from "react";
import { useForm } from "react-hook-form";
import { useState } from "react";
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
import { Book, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchAllAreasByUserId, auth } from "@/lib/firebase/index";
import { useAuthState } from "react-firebase-hooks/auth";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { PageLoading } from "@/components/ui/page-loading";
import { useLanguage } from "@/hooks/useLanguage";

type ResourceFormData = {
  title: string;
  description?: string;
  url?: string;
  text?: string;
  area: string;
};

export default function NewResourcePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);
  const [isSubmitting, setIsSubmitting] = useState(false); // Resource 생성 중 로딩 상태
  const { translate } = useLanguage();

  // 폼 스키마 정의 (translate 함수 사용을 위해 컴포넌트 내부로 이동)
  const resourceFormSchema = z.object({
    title: z
      .string()
      .min(1, translate("para.resources.add.validation.titleRequired")),
    description: z.string().optional(),
    url: z
      .string()
      .url(translate("para.resources.add.validation.urlInvalid"))
      .optional()
      .or(z.literal("")),
    text: z.string().optional(),
    area: z
      .string()
      .min(1, translate("para.resources.add.validation.areaRequired")),
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

  // 영역 데이터 가져오기
  const { data: allAreas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const areas = allAreas;

  const onSubmit = async (data: ResourceFormData) => {
    setIsSubmitting(true); // 로딩 상태 시작

    try {
      toast({
        title: translate("para.resources.add.success.title"),
        description: translate(
          "para.resources.add.success.description"
        ).replace("{title}", data.title),
      });

      router.push("/para/resources");
    } catch (error) {
      console.error("Resource 생성 실패:", error);
      toast({
        title: translate("para.resources.add.error.title"),
        description: translate("para.resources.add.error.description"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // 로딩 상태 해제
    }
  };

  if (userLoading || areasLoading) {
    return (
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {translate("para.resources.add.title")}
          </h1>
        </div>
        <PageLoading message={translate("common.loadingData")} />
      </div>
    );
  }

  return (
    <div className="container max-w-md px-4 py-6 relative">
      <LoadingOverlay 
        isLoading={isSubmitting} 
        message={translate("common.loading")}
      >
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="mr-2"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {translate("para.resources.add.title")}
          </h1>
        </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Book className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">
          {translate("para.resources.add.description")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {translate("para.resources.add.explanation")}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">
              {translate("para.resources.add.titleLabel")}
            </Label>
            <Input
              id="title"
              {...form.register("title")}
              placeholder={translate("para.resources.add.titlePlaceholder")}
            />
            {form.formState.errors.title && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="area">
              {translate("para.resources.add.areaLabel")}
            </Label>
            <Select onValueChange={(value) => form.setValue("area", value)}>
              <SelectTrigger>
                <SelectValue
                  placeholder={translate("para.resources.add.areaPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
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
              {translate("para.resources.add.descriptionLabel")}
            </Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder={translate(
                "para.resources.add.descriptionPlaceholder"
              )}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="url">
              {translate("para.resources.add.linkLabel")}
            </Label>
            <Input
              id="url"
              type="url"
              {...form.register("url")}
              placeholder={translate("para.resources.add.linkPlaceholder")}
            />
            {form.formState.errors.url && (
              <p className="mt-1 text-sm text-red-500">
                {form.formState.errors.url.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="text">
              {translate("para.resources.add.contentLabel")}
            </Label>
            <Textarea
              id="text"
              {...form.register("text")}
              placeholder={translate("para.resources.add.contentPlaceholder")}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            {translate("para.resources.add.submit")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {translate("para.resources.add.cancel")}
          </Button>
        </div>
      </form>
      </LoadingOverlay>
    </div>
  );
}
