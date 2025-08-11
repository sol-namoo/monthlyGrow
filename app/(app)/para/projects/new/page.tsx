"use client";

import type React from "react";
import { useState, Suspense, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CustomAlert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/custom-alert";
import { Badge } from "@/components/ui/badge";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Target,
  Clock,
  ChevronLeft,
  Briefcase,
  X,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/feedback/Loading";
import { useQuery } from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  auth,
  fetchAllChaptersByUserId,
  fetchAllAreasByUserId,
  fetchChapterById,
  createProject,
  addTaskToProject,
} from "@/lib/firebase";

import { getChapterStatus, formatDate, formatDateForInput } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

// 폼 스키마 정의
const projectFormSchema = z
  .object({
    title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
    description: z.string().min(1, "프로젝트 설명을 입력해주세요"),
    category: z.enum(["repetitive", "task_based"], {
      required_error: "프로젝트 유형을 선택해주세요",
    }),
    area: z.string().min(1, "영역을 선택해주세요"),
    chapter: z.string().optional(),
    startDate: z.string().min(1, "시작일을 입력해주세요"),
    dueDate: z.string().min(1, "목표 완료일을 입력해주세요"),
    target: z.string().min(1, "목표 설명을 입력해주세요"),
    targetCount: z.string().refine((val) => {
      if (!val) return false;
      const num = parseInt(val);
      return !isNaN(num) && num >= 0;
    }, "목표 개수를 입력해주세요"),
    tasks: z
      .array(
        z.object({
          id: z.any(), // 시스템에서 자동 생성하므로 검증 불필요
          title: z.string().min(1, "태스크 제목을 입력해주세요"),
          date: z.string(),
          duration: z
            .number()
            .min(0, "소요 시간은 0 이상이어야 합니다")
            .multipleOf(
              0.1,
              "소요 시간은 소수점 첫째 자리까지 입력 가능합니다"
            ),
          done: z.boolean(),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      // 종료일이 시작일보다 앞서면 안됨
      if (data.startDate && data.dueDate) {
        const startDate = new Date(data.startDate);
        const dueDate = new Date(data.dueDate);
        return dueDate >= startDate;
      }
      return true;
    },
    {
      message: "종료일은 시작일과 같거나 이후여야 합니다",
      path: ["dueDate"], // 에러를 dueDate 필드에 표시
    }
  )
  .refine(
    (data) => {
      // 태스크가 없으면 통과
      if (!data.tasks || data.tasks.length === 0) return true;

      // 태스크 날짜가 프로젝트 기간 내에 있어야 함
      if (data.startDate && data.dueDate) {
        const startDate = new Date(data.startDate);
        const dueDate = new Date(data.dueDate);

        return data.tasks.every((task) => {
          if (!task.date) return false;
          const taskDate = new Date(task.date);
          return taskDate >= startDate && taskDate <= dueDate;
        });
      }
      return true;
    },
    {
      message: "모든 태스크 날짜는 프로젝트 기간 내에 있어야 합니다",
      path: ["tasks"], // 에러를 tasks 필드에 표시
    }
  );

type ProjectFormData = z.infer<typeof projectFormSchema>;

function NewProjectPageContent() {
  const { translate } = useLanguage();

  // 상태 관리
  const [selectedCategory, setSelectedCategory] = useState<
    "repetitive" | "task_based"
  >("repetitive");
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);
  const [chapterTargetCounts, setChapterTargetCounts] = useState<
    Record<string, number>
  >({});

  // 선택된 태스크들을 관리하는 상태
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  // 챕터 연결 관리 상태
  const [showChapterConnectionDialog, setShowChapterConnectionDialog] =
    useState(false);

  // 프로젝트 유형 변경 다이얼로그 상태
  const [showCategoryChangeDialog, setShowCategoryChangeDialog] =
    useState(false);
  const [pendingCategoryChange, setPendingCategoryChange] = useState<
    "repetitive" | "task_based" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 프로젝트 생성 중 로딩 상태

  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);

  // 로그인 상태 확인 및 리다이렉션
  useEffect(() => {
    if (!userLoading && !user) {
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 페이지로 이동합니다.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, userLoading, toast, router]);

  // URL 파라미터에서 chapterId와 addedMidway 값을 가져옴
  const chapterId = searchParams.get("chapterId");
  const addedMidway = searchParams.get("addedMidway") === "true";
  const returnUrl = searchParams.get("returnUrl");

  // returnUrl에서 챕터 ID 추출 (챕터 수정 페이지에서 온 경우)
  const extractChapterIdFromReturnUrl = () => {
    if (returnUrl) {
      const match = returnUrl.match(/\/chapter\/edit\/([^/?]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const returnUrlChapterId = extractChapterIdFromReturnUrl();

  // 사용자의 모든 챕터 가져오기
  const { data: allChapters = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ["chapters", user?.uid],
    queryFn: () => fetchAllChaptersByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 사용자의 모든 영역 가져오기
  const { data: areas = [], isLoading: areasLoading } = useQuery({
    queryKey: ["areas", user?.uid],
    queryFn: () => fetchAllAreasByUserId(user?.uid || ""),
    enabled: !!user?.uid,
  });

  // 기본 날짜 값 계산
  const getDefaultDates = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // 로컬 시간으로 이번 달 말일 계산
    const endOfMonth = new Date(year, month + 1, 0);

    const startDateString = formatDateForInput(today);
    const endDateString = formatDateForInput(endOfMonth);

    return {
      startDate: startDateString,
      endDate: endDateString,
    };
  };

  // react-hook-form 설정
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "repetitive",
      area: "", // 초기값은 빈 문자열로 설정
      chapter: "",
      startDate: getDefaultDates().startDate,
      dueDate: getDefaultDates().endDate,
      target: "",
      targetCount: "",
      tasks: [], // 빈 배열로 시작
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  // 프로젝트 기간과 겹치는 챕터만 필터링 (현재 달로부터 6개월 이후까지의 기간과 겹치는 것만)
  const getOverlappingChapters = () => {
    const startDate = form.watch("startDate");
    const dueDate = form.watch("dueDate");

    if (!startDate || !dueDate) {
      // 날짜가 없으면 현재 달로부터 6개월 이후까지의 기간과 겹치는 챕터만 반환
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const sixMonthsLater = new Date(currentYear, currentMonth + 6, 0);

      return allChapters.filter((chapter) => {
        const chapterStart = new Date(chapter.startDate);
        const chapterEnd = new Date(chapter.endDate);

        // 챕터가 6개월 이후 범위와 겹치는지 확인
        return chapterStart <= sixMonthsLater && chapterEnd >= currentDate;
      });
    }

    const projectStart = new Date(startDate);
    const projectEnd = new Date(dueDate);

    return allChapters.filter((chapter) => {
      const chapterStart = new Date(chapter.startDate);
      const chapterEnd = new Date(chapter.endDate);

      // 프로젝트 기간과 챕터 기간이 겹치는지 확인
      return (
        (projectStart <= chapterEnd && projectEnd >= chapterStart) ||
        // returnUrl에서 추출한 챕터는 항상 포함 (자동 선택용)
        chapter.id === returnUrlChapterId
      );
    });
  };

  const overlappingChapters = getOverlappingChapters();

  // 선택된 챕터들 계산
  const selectedChapters = overlappingChapters.filter((chapter) =>
    selectedChapterIds.includes(chapter.id)
  );

  // 영역이 로드되면 첫 번째 영역(미분류)을 기본값으로 설정
  useEffect(() => {
    if (areas.length > 0) {
      form.setValue("area", areas[0].id);
    }
  }, [areas, form]);

  // returnUrl에서 추출한 챕터 ID가 있으면 자동으로 선택
  useEffect(() => {
    if (returnUrlChapterId && overlappingChapters.length > 0) {
      const targetChapter = overlappingChapters.find(
        (chapter) => chapter.id === returnUrlChapterId
      );
      if (targetChapter && !selectedChapterIds.includes(returnUrlChapterId)) {
        setSelectedChapterIds((prev) => [...prev, returnUrlChapterId]);
      }
    }
  }, [returnUrlChapterId, overlappingChapters, selectedChapterIds]);

  // 반복형 프로젝트에서 카테고리나 날짜 변경 시 태스크 목록 자동 업데이트
  useEffect(() => {
    const category = form.watch("category");
    const targetCount = form.watch("targetCount");
    const startDate = form.watch("startDate");
    const dueDate = form.watch("dueDate");

    if (category === "repetitive" && targetCount && startDate && dueDate) {
      const targetNumber = parseInt(targetCount);
      if (!isNaN(targetNumber) && targetNumber > 0) {
        // 기존 태스크 목록을 가져와서 제목 유지
        const currentTasks = form.getValues("tasks");
        const previewTasks = generatePreviewTasks(
          targetNumber,
          startDate,
          dueDate,
          currentTasks
        );
        // 날짜순으로 정렬
        const sortedTasks = previewTasks.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        replace(sortedTasks);
      }
    }
    // 작업형 프로젝트에서는 목표 설정 시 태스크 목록을 초기화하지 않음
  }, [
    form.watch("category"),
    form.watch("targetCount"),
    form.watch("startDate"),
    form.watch("dueDate"),
    replace,
  ]);

  // 프로젝트 기간과 겹치는 챕터만 필터링 (연결용)
  const availableChaptersForConnection = overlappingChapters.filter(
    (chapter) => {
      const status = getChapterStatus(chapter);
      // 과거 챕터 제외 + 활성 챕터만
      return status === "in_progress" || status === "planned";
    }
  );

  // 챕터에 연결된 프로젝트 개수 계산 (현재 선택된 챕터들 기준)
  const getConnectedProjectCount = (chapterId: string) => {
    // 현재 선택된 챕터들 중에서 해당 챕터가 포함되어 있는지 확인
    return selectedChapterIds.includes(chapterId) ? 1 : 0;
  };

  // 프로젝트 유형별 헬퍼 함수
  const getUnitLabel = (category: "repetitive" | "task_based") => {
    return category === "repetitive" ? "회" : "개 작업";
  };

  const getTargetPlaceholder = (category: "repetitive" | "task_based") => {
    return category === "repetitive"
      ? "목표 설명 (예: 주요 개념 정리)"
      : "목표 설명 (예: 완성된 이력서 1부)";
  };

  const getTargetCountPlaceholder = (category: "repetitive" | "task_based") => {
    return category === "repetitive"
      ? translate("para.projects.targetCount.repetitivePlaceholder")
      : translate("para.projects.targetCount.taskBasedPlaceholder");
  };

  const getTargetDescription = (category: "repetitive" | "task_based") => {
    return category === "repetitive"
      ? translate("para.projects.targetCount.description.repetitive")
      : translate("para.projects.targetCount.description.taskBased");
  };

  // 현재 챕터 정보 가져오기 (chapterId가 있는 경우)
  const { data: currentChapter } = useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => fetchChapterById(chapterId!),
    enabled: !!chapterId,
  });

  // 프로젝트 유형 변경 핸들러
  const handleCategoryChange = (newCategory: "repetitive" | "task_based") => {
    const currentCategory = form.watch("category");
    const currentTasks = form.watch("tasks") || [];

    // 같은 카테고리면 변경하지 않음
    if (currentCategory === newCategory) return;

    // 기존 태스크가 있고, 프로젝트 유형을 변경하는 경우 다이얼로그 표시
    if (currentTasks.length > 0) {
      setPendingCategoryChange(newCategory);
      setShowCategoryChangeDialog(true);
      return;
    }

    // 태스크가 없는 경우 바로 변경
    applyCategoryChange(newCategory);
  };

  // 실제 카테고리 변경 적용
  const applyCategoryChange = (newCategory: "repetitive" | "task_based") => {
    form.setValue("category", newCategory);
    setSelectedCategory(newCategory);

    if (newCategory === "repetitive") {
      // 반복형으로 변경 시 기존 태스크 초기화 (다이얼로그에서 선택한 경우 제외)
      replace([]);
    }
    // 작업형으로 변경 시 기존 태스크 유지
  };

  // 챕터별 기본 태스크 개수 계산 (프로젝트 기간과 챕터 기간을 고려)
  const getDefaultTargetCount = (chapter: any) => {
    const projectStartDate = new Date(form.watch("startDate"));
    const projectEndDate = new Date(form.watch("dueDate"));
    const chapterStartDate = new Date(chapter.startDate);
    const chapterEndDate = new Date(chapter.endDate);

    // 프로젝트와 챕터의 겹치는 기간 계산
    const overlapStart = new Date(
      Math.max(projectStartDate.getTime(), chapterStartDate.getTime())
    );
    const overlapEnd = new Date(
      Math.min(projectEndDate.getTime(), chapterEndDate.getTime())
    );

    if (overlapEnd <= overlapStart) return 1;

    const overlapDays = Math.ceil(
      (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalProjectDays = Math.ceil(
      (projectEndDate.getTime() - projectStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const targetCount = parseInt(form.watch("targetCount")) || 1;

    // 겹치는 기간 비율에 따라 태스크 개수 계산
    return Math.max(
      1,
      Math.round((overlapDays / totalProjectDays) * targetCount)
    );
  };

  // 챕터별 태스크 개수 업데이트 핸들러
  const updateChapterTargetCount = (chapterId: string, count: number) => {
    setChapterTargetCounts((prev) => ({
      ...prev,
      [chapterId]: Math.max(1, count), // 최소 1개
    }));
  };

  // 챕터 선택/해제 핸들러
  const toggleChapterSelection = (chapterId: string) => {
    setSelectedChapterIds((prev) => {
      const newSelection = prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId];

      // 챕터가 해제되면 해당 챕터의 태스크 개수도 제거
      if (!newSelection.includes(chapterId)) {
        setChapterTargetCounts((prev) => {
          const newCounts = { ...prev };
          delete newCounts[chapterId];
          return newCounts;
        });
      }

      return newSelection;
    });
  };

  // 반복형 프로젝트에서 목표 횟수에 따라 태스크 목록 동적 생성
  const generatePreviewTasks = (
    targetCount: number,
    startDate: string,
    dueDate: string,
    existingTasks: any[] = []
  ) => {
    if (!startDate || !dueDate || targetCount <= 0) return [];

    const start = new Date(startDate);
    const end = new Date(dueDate);
    const duration = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const tasks = [];
    for (let i = 0; i < targetCount; i++) {
      const taskDate = new Date(start);

      // 첫 번째 태스크는 시작일, 마지막 태스크는 종료일로 설정
      if (i === 0) {
        taskDate.setTime(start.getTime());
      } else if (i === targetCount - 1) {
        taskDate.setTime(end.getTime());
      } else {
        // 중간 태스크들은 균등 분배
        const progress = i / (targetCount - 1);
        const daysFromStart = Math.round(progress * duration);
        taskDate.setDate(start.getDate() + daysFromStart);
      }

      // 프로젝트 기간을 벗어나지 않도록 조정
      if (taskDate < start) {
        taskDate.setTime(start.getTime());
      } else if (taskDate > end) {
        taskDate.setTime(end.getTime());
      }

      // 기존 태스크의 제목을 유지하거나 새로 생성
      const existingTask = existingTasks[i];
      const title = existingTask?.title || `${i + 1}회차`;

      tasks.push({
        id: (i + 1).toString(),
        title: title,
        date: taskDate.toISOString().split("T")[0], // YYYY-MM-DD 형식
        duration: 1.0,
        done: false,
      });
    }
    return tasks;
  };

  // 작업형 프로젝트에서 목표 횟수에 따라 빈 태스크 생성
  const generateTaskBasedTasks = (targetCount: number) => {
    const startDate = form.watch("startDate");
    const tasks = [];
    for (let i = 0; i < targetCount; i++) {
      tasks.push({
        id: (i + 1).toString(),
        title: "",
        date: startDate || "",
        duration: 1,
        done: false,
      });
    }
    return tasks;
  };

  const addTask = () => {
    const newId =
      Math.max(
        ...fields.map((t) =>
          typeof t.id === "string" ? parseInt(t.id) : t.id
        ),
        0
      ) + 1;
    const startDate = form.watch("startDate");
    append({
      id: newId.toString(),
      title: "",
      date: startDate || "",
      duration: 1,
      done: false,
    });
  };

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true); // 로딩 상태 시작

    // 사용자에게 즉시 피드백 제공
    toast({
      title: "프로젝트 생성 중...",
      description: "프로젝트를 생성하고 있습니다. 잠시만 기다려주세요.",
    });

    try {
      // areaId는 필수이므로 그대로 사용
      const areaId = data.area;

      // Date 객체 생성 시 유효성 검사 추가
      const createValidDate = (dateString: string) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error(`Invalid date: ${dateString}`);
        }
        return date;
      };

      // 반복형 프로젝트일 때 자동으로 태스크 생성
      const generateRepetitiveTasks = (
        targetCount: number,
        startDate: Date,
        endDate: Date
      ) => {
        const tasks = [];
        const duration = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // 프로젝트 기간이 목표 횟수보다 짧으면 매일 하나씩, 아니면 균등 분배
        const interval = Math.max(1, Math.floor(duration / targetCount));

        for (let i = 0; i < targetCount; i++) {
          const taskDate = new Date(startDate);

          // 첫 번째 태스크는 시작일, 마지막 태스크는 종료일로 설정
          if (i === 0) {
            taskDate.setTime(startDate.getTime());
          } else if (i === targetCount - 1) {
            taskDate.setTime(endDate.getTime());
          } else {
            // 중간 태스크들은 균등 분배
            const progress = i / (targetCount - 1);
            const daysFromStart = Math.round(progress * duration);
            taskDate.setDate(startDate.getDate() + daysFromStart);
          }

          // 프로젝트 기간을 벗어나지 않도록 조정
          if (taskDate < startDate) {
            taskDate.setTime(startDate.getTime());
          } else if (taskDate > endDate) {
            taskDate.setTime(endDate.getTime());
          }

          tasks.push({
            id: `task_${i + 1}`,
            title: `${i + 1}회차`,
            date: taskDate,
            duration: 1.0, // 기본 1시간
            done: false,
            projectId: "", // 생성 후 업데이트
            userId: user!.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return tasks;
      };

      // 태스크 생성 로직
      let tasks = [];
      if (data.category === "repetitive") {
        // 반복형 프로젝트: 자동으로 태스크 생성
        const startDate = createValidDate(data.startDate);
        const endDate = createValidDate(data.dueDate);
        const targetCount = parseInt(data.targetCount);

        tasks = generateRepetitiveTasks(targetCount, startDate, endDate);
      } else {
        // 작업형 프로젝트: 사용자가 입력한 태스크만 사용 (자동 생성 없음)
        tasks = (data.tasks || []).map((task, index) => {
          // duration 안전하게 처리
          let safeDuration = 1; // 기본값
          if (typeof task.duration === "string") {
            const parsed = parseFloat(task.duration);
            safeDuration = isNaN(parsed) ? 1 : Math.max(0, parsed);
          } else if (typeof task.duration === "number") {
            safeDuration = isNaN(task.duration)
              ? 1
              : Math.max(0, task.duration);
          }

          return {
            id: `task_${index + 1}`,
            title: task.title,
            date: createValidDate(task.date),
            duration: safeDuration,
            done: task.done,
            projectId: "", // 생성 후 업데이트
            userId: user!.uid,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });
      }

      // 선택된 챕터들을 ConnectedChapter 형식으로 변환
      const connectedChapters = selectedChapters.map((chapter) => chapter.id);

      const projectData = {
        title: data.title,
        description: data.description,
        category: data.category,
        areaId, // 필수 필드
        startDate: createValidDate(data.startDate),
        endDate: createValidDate(data.dueDate),
        target: data.target,
        targetCount: parseInt(data.targetCount),
        completedTasks: 0,
        connectedChapters, // 선택된 챕터 ID 배열
        notes: [], // 초기에는 빈 배열
        tasks,
        userId: user!.uid,
      };

      const newProject = await createProject(projectData);

      // 태스크가 있으면 Firebase에 저장
      if (tasks.length > 0) {
        try {
          // 각 태스크를 Firebase에 저장
          const taskPromises = tasks.map(async (task) => {
            const taskData = {
              ...task,
              projectId: newProject.id, // 프로젝트 ID 설정
            };

            return await addTaskToProject(newProject.id, {
              title: taskData.title,
              date: taskData.date,
              duration: taskData.duration,
              done: taskData.done,
            });
          });

          await Promise.all(taskPromises);
        } catch (taskError) {
          // 태스크 저장 실패해도 프로젝트는 생성되었으므로 경고만 표시
          toast({
            title: "프로젝트 생성 완료 (태스크 저장 실패)",
            description: "프로젝트는 생성되었지만 태스크 저장에 실패했습니다.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "프로젝트 생성 완료!",
        description: `${data.title} 프로젝트가 성공적으로 생성되었습니다.${
          selectedChapters.length > 0
            ? ` (${selectedChapters.length}개 챕터에 연결됨)`
            : ""
        }`,
      });

      // 챕터 생성 페이지에서 왔다면 새 프로젝트 ID와 함께 돌아가기
      if (returnUrl) {
        const separator = returnUrl.includes("?") ? "&" : "?";
        const urlWithProjectId = `${returnUrl}${separator}newProjectId=${newProject.id}`;
        router.replace(urlWithProjectId);
      } else {
        // 일반적인 경우는 프로젝트 상세 페이지로 이동 (replace로 히스토리 대체)
        router.replace(`/para/projects/${newProject.id}`);
      }
    } catch (error) {
      toast({
        title: "프로젝트 생성 실패",
        description: "프로젝트 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false); // 로딩 상태 해제
    }
  };

  // 챕터 연결 대화상자 열기
  const openChapterConnectionDialog = () => {
    setShowChapterConnectionDialog(true);
  };

  const calculateDuration = (startDate: string, dueDate: string) => {
    if (!startDate || !dueDate) return 0;
    const start = new Date(startDate);
    const end = new Date(dueDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // 시작일과 종료일 포함
  };

  const calculateWeeklyAverage = (targetCount: string) => {
    if (!targetCount || !form.watch("startDate") || !form.watch("dueDate"))
      return 0;
    const count = parseInt(targetCount);
    const duration = calculateDuration(
      form.watch("startDate"),
      form.watch("dueDate")
    );
    if (duration === 0) return 0;
    return Math.round((count / duration) * 7 * 10) / 10;
  };

  const duration = calculateDuration(
    form.watch("startDate"),
    form.watch("dueDate")
  );
  const weeklyAverage = calculateWeeklyAverage(form.watch("targetCount"));

  // 로딩 상태 확인
  if (userLoading || chaptersLoading || areasLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={`container max-w-md px-4 py-6 relative ${
        isSubmitting ? "pointer-events-none opacity-60" : ""
      }`}
    >
      {/* 로딩 오버레이 */}
      <LoadingOverlay
        isVisible={isSubmitting}
        message="프로젝트를 생성하고 있습니다..."
      />
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
          프로젝트는 목표 달성을 위한 구체적인 실행 단위입니다. 달성하고 싶은
          목표를 자유롭게 등록해보세요.
        </p>
        {returnUrl && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              프로젝트 생성 완료 후 챕터 생성 페이지로 돌아갑니다.
            </p>
          </div>
        )}
      </div>

      {currentChapter && (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{currentChapter.title}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 챕터에 연결된 프로젝트:{" "}
            {currentChapter.connectedProjects?.length || 0}개
          </p>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

          <div className="space-y-4">
            {/* 프로젝트 유형 선택 */}
            <div>
              <Label>프로젝트 유형</Label>
              <RadioGroup
                value={form.watch("category")}
                onValueChange={(value: "repetitive" | "task_based") => {
                  handleCategoryChange(value);
                }}
                className="mt-2"
              >
                <div className="space-y-3">
                  <Label htmlFor="repetitive" className="block cursor-pointer">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem
                        value="repetitive"
                        id="repetitive"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          반복형 프로젝트
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          동일한 행동을 여러 번 반복하는 프로젝트 (운동, 독서,
                          습관 등)
                        </p>
                      </div>
                    </div>
                  </Label>
                  <Label htmlFor="task_based" className="block cursor-pointer">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem
                        value="task_based"
                        id="task_based"
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          작업형 프로젝트
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          다양한 업무를 단계별로 완료하는 프로젝트 (개발, 학습,
                          창작 등)
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {form.formState.errors.category && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.category.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="title">프로젝트 제목</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="예: 아침 운동 습관화"
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">프로젝트 설명</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="이 프로젝트로 달성하고 싶은 목표를 설명해주세요"
                rows={3}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="area">소속 영역</Label>
              <Select
                value={form.watch("area")}
                onValueChange={(value) => form.setValue("area", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="영역을 선택해주세요" />
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
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">일정 및 목표</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">시작일</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate", {
                    onChange: (e) => {
                      const startDate = e.target.value;
                      const dueDate = form.getValues("dueDate");
                      if (
                        startDate &&
                        dueDate &&
                        new Date(startDate) > new Date(dueDate)
                      ) {
                        form.setValue("dueDate", startDate);
                      }
                    },
                  })}
                />
                {form.formState.errors.startDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.startDate.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate">목표 완료일</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register("dueDate", {
                    onChange: (e) => {
                      const dueDate = e.target.value;
                      const startDate = form.getValues("startDate");
                      if (
                        startDate &&
                        dueDate &&
                        new Date(dueDate) < new Date(startDate)
                      ) {
                        form.setValue("dueDate", startDate);
                      }
                    },
                  })}
                  min={form.watch("startDate") || undefined}
                  max={(() => {
                    // 이번달 이후 6개월까지만 가능 (챕터 생성 가능 월과 동일)
                    const currentDate = new Date();
                    const currentYear = currentDate.getFullYear();
                    const currentMonth = currentDate.getMonth();
                    const sixMonthsLater = new Date(
                      currentYear,
                      currentMonth + 6,
                      0
                    );
                    return sixMonthsLater.toISOString().split("T")[0];
                  })()}
                />
                {form.formState.errors.dueDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            {duration > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>예상 기간: {duration}일</span>
                {duration > 56 && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              <span>종료일은 이번달 이후 6개월까지만 설정 가능합니다</span>
            </div>

            {duration > 56 && (
              <CustomAlert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>장기 프로젝트 안내</AlertTitle>
                <AlertDescription>
                  8주 이상의 장기 프로젝트입니다. 챕터 단위로 나누어 진행하는
                  것을 권장합니다.
                </AlertDescription>
              </CustomAlert>
            )}

            <div>
              <Label htmlFor="target">목표 설명</Label>
              <Controller
                name="target"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="target"
                    type="text"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={getTargetPlaceholder(form.watch("category"))}
                    className="flex-1"
                  />
                )}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {form.watch("category") === "repetitive"
                  ? "반복할 행동의 구체적인 목표를 설명하세요"
                  : "완성할 결과물의 구체적인 목표를 설명하세요"}
              </p>
              {form.formState.errors.target && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.target.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="targetCount">
                {translate("para.projects.targetCount.label")}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({getUnitLabel(form.watch("category"))})
                </span>
              </Label>
              <div className="flex gap-2 items-center">
                <Controller
                  name="targetCount"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="targetCount"
                      type="number"
                      min="1"
                      value={field.value}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value);

                        // 실시간으로 태스크 목록 업데이트
                        const category = form.watch("category");
                        const startDate = form.watch("startDate");
                        const dueDate = form.watch("dueDate");

                        if (
                          category === "repetitive" &&
                          value &&
                          startDate &&
                          dueDate
                        ) {
                          const targetNumber = parseInt(value);
                          if (!isNaN(targetNumber) && targetNumber > 0) {
                            const currentTasks = form.getValues("tasks");
                            const previewTasks = generatePreviewTasks(
                              targetNumber,
                              startDate,
                              dueDate,
                              currentTasks
                            );
                            replace(previewTasks);
                          }
                        }
                      }}
                      placeholder={getTargetCountPlaceholder(
                        form.watch("category")
                      )}
                      className="flex-1"
                    />
                  )}
                />
                <span className="text-sm text-muted-foreground">
                  {getUnitLabel(form.watch("category"))}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {getTargetDescription(form.watch("category"))}
              </p>
              {form.formState.errors.targetCount && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.targetCount.message}
                </p>
              )}
            </div>

            {weeklyAverage > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>
                  주당 평균: {weeklyAverage}
                  {getUnitLabel(form.watch("category"))}
                </span>
                {weeklyAverage < 2 && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}

            {weeklyAverage < 2 &&
              weeklyAverage > 0 &&
              form.watch("category") === "repetitive" && (
                <CustomAlert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>활동 빈도 낮음</AlertTitle>
                  <AlertDescription>
                    주당 평균이 2회 미만입니다. 더 자주 활동할 수 있도록 목표를
                    조정해보세요.
                  </AlertDescription>
                </CustomAlert>
              )}

            {/* 권장사항 아코디언 */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem
                value="recommendations"
                className="border rounded-lg"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">권장사항</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3">
                    <RecommendationBadge
                      type="info"
                      message="프로젝트 기간: 3개월 이내로 설정하면 효과적으로 관리할 수 있어요"
                    />
                    {form.watch("category") === "repetitive" && (
                      <RecommendationBadge
                        type="info"
                        message="목표 설정: 일주일에 2회 이상이면 챕터 집중에 도움이 돼요"
                      />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">태스크 목록</h2>
              <span className="text-sm text-muted-foreground">
                ({fields.length}개)
              </span>
            </div>
            {form.watch("category") === "task_based" && (
              <div className="flex gap-2">
                {selectedTasks.length > 0 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      // 선택된 태스크들 삭제
                      const selectedIndexes = selectedTasks
                        .map((taskId) =>
                          fields.findIndex((field) => field.id === taskId)
                        )
                        .filter((index) => index !== -1)
                        .sort((a, b) => b - a); // 뒤에서부터 삭제

                      // 실제로 fields에서 선택된 인덱스들을 제거 (뒤에서부터 제거하여 인덱스 변화 방지)
                      selectedIndexes.forEach((index) => {
                        remove(index);
                      });

                      // 선택 상태 초기화
                      setSelectedTasks([]);

                      const deletedCount = selectedTasks.length;
                      toast({
                        title: "태스크 삭제됨",
                        description: `${deletedCount}개 태스크가 삭제되었습니다.`,
                      });
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    삭제 ({selectedTasks.length})
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  태스크 추가
                </Button>
              </div>
            )}
          </div>

          {form.watch("category") === "repetitive" && (
            <div className="mb-4 p-3 bg-muted/50 dark:bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">
                💡{" "}
                {translate("para.projects.targetCount.description.repetitive")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                🎯 목표 달성 후 초과 달성 태스크를 추가할 수 있어요
              </p>
            </div>
          )}

          {form.watch("category") === "repetitive" ? (
            // 반복형 프로젝트용 태스크 목록
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">
                    {translate("para.projects.targetCount.hint.repetitive")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {translate("para.projects.targetCount.hint.setup")}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">
                      자동 생성된 태스크 목록
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {fields.length}개 태스크
                    </span>
                  </div>
                  <div className="max-h-[calc(100vh-120px)] overflow-y-auto space-y-2 pr-2">
                    {fields.map((field, index) => (
                      <div key={field.id} className="group">
                        {/* 태스크 카드 */}
                        <div className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                          <div className="space-y-4">
                            {/* 첫 번째 줄: 제목 */}
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {index + 1}
                                </span>
                              </div>
                              <Input
                                {...form.register(`tasks.${index}.title`)}
                                placeholder={`${index + 1}회차`}
                                className="flex-1 min-w-0"
                              />
                            </div>

                            {/* 두 번째 줄: 날짜, 시간 */}
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input
                                  type="date"
                                  {...form.register(`tasks.${index}.date`)}
                                  className="w-auto text-sm min-w-0"
                                  min={form.watch("startDate")}
                                  max={form.watch("dueDate")}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  {...form.register(`tasks.${index}.duration`, {
                                    valueAsNumber: true,
                                  })}
                                  className="w-20 text-sm"
                                  placeholder="소요시간"
                                />
                                <span className="text-xs text-muted-foreground">
                                  시간
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 작업형 프로젝트용 태스크 목록
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">
                    등록된 태스크가 없습니다
                  </p>
                  <p className="text-sm text-muted-foreground">
                    프로젝트 달성을 위한 구체적인 태스크를 추가해보세요
                  </p>
                </div>
              ) : (
                <div className="max-h-[calc(100vh-120px)] overflow-y-auto space-y-2 pr-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="group">
                      {/* 선택 체크박스 (카드 위쪽) */}
                      <div className="flex justify-start mb-2">
                        <Checkbox
                          checked={selectedTasks.includes(field.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTasks((prev) => [...prev, field.id]);
                            } else {
                              setSelectedTasks((prev) =>
                                prev.filter((id) => id !== field.id)
                              );
                            }
                          }}
                        />
                      </div>

                      {/* 태스크 카드 */}
                      <div className="p-4 border rounded-xl bg-card shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-primary/20">
                        <div className="space-y-4">
                          {/* 첫 번째 줄: 제목 */}
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                              <span className="text-xs font-medium text-muted-foreground">
                                {index + 1}
                              </span>
                            </div>
                            <Input
                              {...form.register(`tasks.${index}.title`)}
                              placeholder="태스크 제목"
                              className="flex-1 min-w-0"
                            />
                          </div>

                          {/* 두 번째 줄: 날짜, 시간 */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Input
                                type="date"
                                {...form.register(`tasks.${index}.date`)}
                                className="w-auto text-sm min-w-0"
                                min={form.watch("startDate")}
                                max={form.watch("dueDate")}
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                {...form.register(`tasks.${index}.duration`, {
                                  valueAsNumber: true,
                                  onChange: (e) => {},
                                  onBlur: (e) => {
                                    // 에러 상태 확인
                                    setTimeout(() => {
                                      const errors = form.formState.errors;
                                      const currentValues = form.getValues();
                                    }, 100);
                                  },
                                })}
                                placeholder="소요시간"
                                min="0"
                                step="0.1"
                                className="w-20 text-sm"
                              />
                              <span className="text-xs text-muted-foreground">
                                시간
                              </span>
                            </div>
                          </div>

                          {/* 에러 메시지 표시 */}
                          {form.formState.errors.tasks?.[index] && (
                            <div className="text-sm text-red-500">
                              {Object.values(
                                form.formState.errors.tasks[index] || {}
                              ).map((error: any, errorIndex: number) => (
                                <p key={errorIndex}>{error?.message}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 챕터 연결 섹션 */}
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">챕터 연결</h2>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              이 프로젝트를 특정 챕터에 연결하여 월별 목표로 관리할 수 있습니다.
            </p>

            {/* 현재 연결된 챕터들 표시 */}
            {selectedChapterIds.length > 0 && allChapters.length > 0 && (
              <div>
                <Label>현재 연결된 챕터</Label>
                <div className="mt-2 space-y-2">
                  {allChapters
                    .filter((chapter) =>
                      selectedChapterIds.includes(chapter.id)
                    )
                    .map((chapter) => (
                      <div
                        key={chapter.id}
                        className="p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium">{chapter.title}</span>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(chapter.startDate)} ~{" "}
                              {formatDate(chapter.endDate)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // 챕터 연결 해제
                              setSelectedChapterIds((prev) =>
                                prev.filter((id) => id !== chapter.id)
                              );
                              // 챕터가 해제되면 해당 챕터의 태스크 개수도 제거
                              setChapterTargetCounts((prev) => {
                                const newCounts = { ...prev };
                                delete newCounts[chapter.id];
                                return newCounts;
                              });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 챕터별 태스크 개수 설정 */}
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center gap-2">
                            <Label
                              htmlFor={`target-${chapter.id}`}
                              className="text-sm font-medium"
                            >
                              이 챕터에서 완성할 태스크 개수
                            </Label>
                            <Badge variant="secondary" className="text-xs">
                              권장: {getDefaultTargetCount(chapter)}개
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              id={`target-${chapter.id}`}
                              type="number"
                              min="1"
                              max="100"
                              value={
                                chapterTargetCounts[chapter.id] ||
                                getDefaultTargetCount(chapter)
                              }
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                updateChapterTargetCount(chapter.id, value);
                              }}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">
                              개
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateChapterTargetCount(
                                  chapter.id,
                                  getDefaultTargetCount(chapter)
                                );
                              }}
                              className="text-xs"
                            >
                              권장값 적용
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            프로젝트 기간과 챕터 기간을 고려한 권장 개수입니다.
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (프로젝트 정보: 미완료 태스크{" "}
                            {form.watch("targetCount") || 1}개 / 총 태스크{" "}
                            {form.watch("targetCount") || 1}개)
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="text-center p-4 border-2 border-dashed rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                새로운 챕터에 연결하거나 기존 연결을 관리하세요
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  openChapterConnectionDialog();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                챕터 연결 관리
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                프로젝트 생성 중...
              </div>
            ) : (
              "프로젝트 생성"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
        </div>
      </form>

      {/* 프로젝트 유형 변경 다이얼로그 */}
      <Dialog
        open={showCategoryChangeDialog}
        onOpenChange={setShowCategoryChangeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로젝트 유형 변경</DialogTitle>
            <DialogDescription>
              프로젝트 유형을 변경하면 기존에 생성된 모든 태스크가 삭제됩니다.
              계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ 현재 {form.watch("tasks")?.length || 0}개의 태스크가 생성되어
              있습니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCategoryChangeDialog(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingCategoryChange) {
                  applyCategoryChange(pendingCategoryChange);
                }
                setShowCategoryChangeDialog(false);
                setPendingCategoryChange(null);
              }}
            >
              유형 변경하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 챕터 연결 대화상자 */}
      <Dialog
        open={showChapterConnectionDialog}
        onOpenChange={setShowChapterConnectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>챕터에 연결</DialogTitle>
            <DialogDescription>
              이 프로젝트를 연결할 챕터를 선택하세요. 연결된 챕터에서 프로젝트를
              함께 관리할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableChaptersForConnection.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  연결할 수 있는 챕터가 없습니다.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  6개월 이내의 챕터만 연결할 수 있습니다.
                </p>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    💡 <strong>팁:</strong> AI 플래닝 기능(준비중)을 사용하면
                    장기 목표에 맞는 여러 챕터를 자동으로 생성할 수 있습니다.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {availableChaptersForConnection.map((chapter) => (
                    <div
                      key={chapter.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedChapterIds.includes(chapter.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => toggleChapterSelection(chapter.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{chapter.title}</h4>
                          {selectedChapterIds.includes(chapter.id) && (
                            <Badge variant="outline" className="text-xs">
                              선택됨
                            </Badge>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            getChapterStatus(chapter) === "in_progress"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {getChapterStatus(chapter) === "in_progress"
                            ? "진행 중"
                            : "예정"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(chapter.startDate)} -{" "}
                        {formatDate(chapter.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        연결된 프로젝트: {getConnectedProjectCount(chapter.id)}
                        개
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowChapterConnectionDialog(false);
                      if (selectedChapterIds.length > 0) {
                        toast({
                          title: "챕터 연결 완료",
                          description: `${selectedChapterIds.length}개 챕터에 연결되었습니다.`,
                        });
                      }
                    }}
                    className="flex-1"
                  >
                    {selectedChapterIds.length > 0
                      ? `연결하기 (${selectedChapterIds.length}개)`
                      : "연결 없이 진행"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedChapterIds([]);
                      setShowChapterConnectionDialog(false);
                    }}
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<Loading />}>
      <NewProjectPageContent />
    </Suspense>
  );
}
