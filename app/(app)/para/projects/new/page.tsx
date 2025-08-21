"use client";

import type React from "react";
import { useState, useEffect, use, Suspense, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ChevronLeft,
  Briefcase,
  Plus,
  X,
  Calendar,
  Clock,
  Edit2,
  Info,
} from "lucide-react";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getProjectStatus, formatDate, formatDateForInput } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { useFieldArray, Controller } from "react-hook-form";
import type { Project } from "@/lib/types";
import {
  createProject,
  fetchAllAreasByUserId,
  fetchAllProjectsByUserId,
  fetchAllMonthliesByUserId,
} from "@/lib/firebase/index";
import {
  CustomAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/custom-alert";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { Alert } from "@/components/ui/alert";

// 새 프로젝트 생성 폼 스키마 정의
const newProjectFormSchema = z
  .object({
    title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
    description: z.string().min(1, "프로젝트 설명을 입력해주세요"),
    category: z.enum(["repetitive", "task_based"], {
      required_error: "프로젝트 유형을 선택해주세요",
    }),
    areaId: z.string().optional(),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    endDate: z.string().min(1, "종료일을 입력해주세요"),
    target: z.string().min(1, "목표 설명을 입력해주세요"),
    targetCount: z.number().min(0, "목표 개수를 입력해주세요"),
    total: z.number().min(0, "목표 개수를 입력해주세요"),
    tasks: z.array(
      z.object({
        id: z.any(),
        title: z.string().min(1, "태스크 제목을 입력해주세요"),
        date: z.string().min(1, "태스크 날짜를 입력해주세요"),
        duration: z
          .number()
          .min(0.1, "소요 시간은 0.1 이상이어야 합니다")
          .multipleOf(0.1, "소요 시간은 소수점 첫째 자리까지 입력 가능합니다"),
        done: z.boolean(),
      })
    ),
  })
  .refine(
    (data) => {
      if (data.category === "repetitive") {
        return data.targetCount > 0;
      }
      return true;
    },
    {
      message: "반복형 프로젝트는 목표 횟수를 설정해야 합니다",
      path: ["targetCount"],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      return endDate >= startDate;
    },
    {
      message: "종료일은 시작일 이후여야 합니다",
      path: ["endDate"],
    }
  );

type NewProjectFormData = z.infer<typeof newProjectFormSchema>;

function NewProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { translate, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user] = useAuthState(auth);

  // URL 파라미터에서 returnUrl과 monthlyId 추출
  const returnUrl = searchParams.get("returnUrl");
  const returnUrlMonthlyId = searchParams.get("monthlyId");

  // 상태 관리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [selectedMonthlyIds, setSelectedMonthlyIds] = useState<string[]>([]);
  const [showMonthlyConnectionDialog, setShowMonthlyConnectionDialog] =
    useState(false);

  // 폼 초기화
  const form = useForm<NewProjectFormData>({
    resolver: zodResolver(newProjectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "task_based",
      areaId: "",
      startDate: formatDateForInput(new Date()),
      endDate: formatDateForInput(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ),
      target: "",
      targetCount: 1,
      total: 1,
      tasks: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  // 데이터 조회
  const { data: areas = [] } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  const { data: allMonthlies = [] } = useQuery({
    queryKey: ["monthlies", user?.uid],
    queryFn: () => fetchAllMonthliesByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 현재 먼슬리 정보
  const currentMonthly = returnUrlMonthlyId
    ? allMonthlies.find((m) => m.id === returnUrlMonthlyId)
    : null;

  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-md px-4 py-4 relative h-fit">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.history.back()}
          className="mr-2"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">프로젝트 만들기</h1>
      </div>

      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-lg font-bold mb-2">
          새로운 프로젝트를 만들어보세요
        </h2>
        <p className="text-sm text-muted-foreground">
          프로젝트는 목표 달성을 위한 구체적인 실행 단위입니다.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">프로젝트 제목</Label>
            <Input
              id="title"
              placeholder="프로젝트 제목을 입력하세요"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">프로젝트 설명</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 자세한 설명을 입력하세요"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-3 mt-6">
        <Button className="flex-1">프로젝트 생성</Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          취소
        </Button>
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewProjectPageContent />
    </Suspense>
  );
}
