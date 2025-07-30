"use client";

import type React from "react";
import { useState, Suspense } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RecommendationBadge } from "@/components/ui/recommendation-badge";
import {
  AlertCircle,
  Plus,
  Trash2,
  Calendar,
  Target,
  Clock,
  ChevronLeft,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/components/feedback/Loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 폼 스키마 정의
const projectFormSchema = z.object({
  title: z.string().min(1, "프로젝트 제목을 입력해주세요"),
  description: z.string().min(1, "프로젝트 설명을 입력해주세요"),
  area: z.string().min(1, "영역을 선택해주세요"),
  loop: z.string().optional(),
  startDate: z.string().min(1, "시작일을 입력해주세요"),
  dueDate: z.string().min(1, "목표 완료일을 입력해주세요"),
  targetCount: z.string().min(1, "목표 횟수를 입력해주세요"),
  tasks: z.array(
    z.object({
      id: z.number(),
      title: z.string().min(1, "태스크 제목을 입력해주세요"),
      date: z.string(),
      duration: z.number().min(1),
      done: z.boolean(),
    })
  ),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

function NewProjectPageContent() {
  // 상태 관리
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [tasks, setTasks] = useState([{ title: "", date: "", duration: 1 }]);
  const [showLoopConnectionDialog, setShowLoopConnectionDialog] =
    useState(false);
  const [availableLoops, setAvailableLoops] = useState<any[]>([]);
  const [selectedLoopId, setSelectedLoopId] = useState<string>("");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // URL 파라미터에서 loopId와 addedMidway 값을 가져옴
  const loopId = searchParams.get("loopId");
  const addedMidway = searchParams.get("addedMidway") === "true";
  const returnUrl = searchParams.get("returnUrl");

  // react-hook-form 설정
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      area: "",
      loop: "",
      startDate: "",
      dueDate: "",
      targetCount: "",
      tasks: [{ id: 1, title: "", date: "", duration: 1, done: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  // 샘플 데이터 - 현재 루프 정보 (loopId가 있는 경우)
  const currentLoop = loopId
    ? {
        id: loopId,
        title: "5월 루프: 건강 관리",
        projectCount: 4, // 현재 루프에 연결된 프로젝트 수
      }
    : null;

  // 샘플 데이터
  const areas = [
    { id: "health", name: "건강" },
    { id: "career", name: "커리어" },
    { id: "relationships", name: "인간관계" },
    { id: "finance", name: "재정" },
    { id: "personal", name: "자기계발" },
    { id: "fun", name: "취미/여가" },
  ];

  // 실제 생성된 루프만 표시 (아직 생성되지 않은 루프는 제외)
  const loops = [
    { id: "1", name: "5월 루프: 건강 관리", projectCount: 4 },
    { id: "none", name: "루프에 포함하지 않음", projectCount: 0 },
  ];

  // 루프 프로젝트 개수 제한 확인
  const selectedLoop = loops.find((loop) => loop.id === form.watch("loop"));
  const isLoopFull =
    selectedLoop &&
    selectedLoop.id !== "none" &&
    selectedLoop.projectCount >= 5;

  const addTask = () => {
    const newId = Math.max(...fields.map((t) => t.id), 0) + 1;
    append({ id: newId, title: "", date: "", duration: 1, done: false });
  };

  const removeTask = (taskId: number) => {
    const index = fields.findIndex((task) => task.id === taskId);
    if (index > -1) {
      remove(index);
    }
  };

  const onSubmit = (data: ProjectFormData) => {
    // 프로젝트 생성 로직 (실제 구현에서는 API 호출)
    const projectData = {
      ...data,
      createdAt: new Date(),
    };

    console.log("프로젝트 생성:", projectData);

    // 임시로 생성된 프로젝트 ID (실제로는 API 응답에서 받아옴)
    const newProjectId = `project_${Date.now()}`;

    toast({
      title: "프로젝트 생성 완료",
      description: `${data.title} 프로젝트가 생성되었습니다.`,
    });

    // 루프 생성 페이지에서 왔다면 새 프로젝트 ID와 함께 돌아가기
    if (returnUrl) {
      const separator = returnUrl.includes("?") ? "&" : "?";
      const urlWithProjectId = `${returnUrl}${separator}newProjectId=${newProjectId}`;
      router.push(urlWithProjectId);
    } else {
      // 일반적인 경우는 PARA projects 페이지로 이동
      router.push("/para/projects");
    }
  };

  // 루프 연결 처리
  const handleLoopConnection = (connectToLoop: boolean) => {
    if (connectToLoop && selectedLoopId) {
      // 선택된 루프에 프로젝트 연결하는 로직 구현 예정
      console.log("루프에 연결:", selectedLoopId);
      toast({
        title: "루프 연결 완료",
        description: "프로젝트가 선택한 루프에 연결되었습니다.",
      });
    }
    setShowLoopConnectionDialog(false);
    setSelectedLoopId("");
  };

  // 루프 연결 대화상자 열기
  const openLoopConnectionDialog = () => {
    // TODO: 현재 진행 중인 루프들을 가져오는 로직 구현
    // setAvailableLoops(activeLoops);
    setShowLoopConnectionDialog(true);
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
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              프로젝트 생성 완료 후 루프 생성 페이지로 돌아갑니다.
            </p>
          </div>
        )}
      </div>

      {currentLoop && (
        <Card className="mb-6 p-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{currentLoop.title}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            현재 루프에 연결된 프로젝트: {currentLoop.projectCount}개
          </p>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold">기본 정보</h2>

          <div className="space-y-4">
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
              <Select onValueChange={(value) => form.setValue("area", value)}>
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
                />
                {form.formState.errors.dueDate && (
                  <p className="mt-1 text-sm text-red-500">
                    {form.formState.errors.dueDate.message}
                  </p>
                )}
              </div>
            </div>

            <RecommendationBadge
              type="info"
              message="권장 기간: 3개월 이내로 설정하면 효과적으로 관리할 수 있어요"
            />

            {duration > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>예상 기간: {duration}일</span>
                {duration > 56 && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}

            {duration > 56 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>장기 프로젝트 안내</AlertTitle>
                <AlertDescription>
                  8주 이상의 장기 프로젝트입니다. 루프 단위로 나누어 진행하는
                  것을 권장합니다.
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="targetCount">목표 횟수</Label>
              <Input
                id="targetCount"
                type="number"
                {...form.register("targetCount")}
                placeholder="예: 30"
              />
              <RecommendationBadge
                type="info"
                message="권장: 3~10회 (일주일에 2회 이상이면 루프 집중에 도움이 돼요)"
                className="mt-2"
              />
              {form.formState.errors.targetCount && (
                <p className="mt-1 text-sm text-red-500">
                  {form.formState.errors.targetCount.message}
                </p>
              )}
            </div>

            {weeklyAverage > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>주당 평균: {weeklyAverage}회</span>
                {weeklyAverage < 2 && (
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}

            {weeklyAverage < 2 && weeklyAverage > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>활동 빈도 낮음</AlertTitle>
                <AlertDescription>
                  주당 평균이 2회 미만입니다. 더 자주 활동할 수 있도록 목표를
                  조정해보세요.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>

        {/* 루프 연결 섹션 */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">루프 연결 (선택사항)</h2>
            <p className="text-sm text-muted-foreground">
              이 프로젝트를 현재 진행 중인 루프에 연결할 수 있습니다.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={openLoopConnectionDialog}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            루프에 연결하기
          </Button>

          {selectedLoopId && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-sm">선택된 루프: {selectedLoopId}</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">태스크 목록</h2>
            <Button type="button" variant="outline" size="sm" onClick={addTask}>
              <Plus className="mr-2 h-4 w-4" />
              태스크 추가
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    태스크 {index + 1}
                  </span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTask(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div>
                  <Label>태스크 제목</Label>
                  <Input
                    {...form.register(`tasks.${index}.title`)}
                    placeholder="태스크 제목을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>예정일</Label>
                    <Input
                      type="date"
                      {...form.register(`tasks.${index}.date`)}
                      min={form.watch("startDate") || undefined}
                      max={form.watch("dueDate") || undefined}
                    />
                  </div>
                  <div>
                    <Label>소요 시간 (시간)</Label>
                    <Input
                      type="number"
                      {...form.register(`tasks.${index}.duration`, {
                        valueAsNumber: true,
                      })}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1">
            프로젝트 생성
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
        </div>
      </form>

      {/* 루프 연결 대화상자 */}
      <Dialog
        open={showLoopConnectionDialog}
        onOpenChange={setShowLoopConnectionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프에 연결</DialogTitle>
            <DialogDescription>
              이 프로젝트를 연결할 루프를 선택하세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {availableLoops.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  현재 진행 중인 루프가 없습니다.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setShowLoopConnectionDialog(false);
                    router.push("/loop/new");
                  }}
                >
                  새 루프 만들기
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {availableLoops.map((loop) => (
                    <div
                      key={loop.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedLoopId === loop.id
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => setSelectedLoopId(loop.id)}
                    >
                      <h4 className="font-medium">{loop.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(loop.startDate).toLocaleDateString()} -{" "}
                        {new Date(loop.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleLoopConnection(true)}
                    disabled={!selectedLoopId}
                    className="flex-1"
                  >
                    연결하기
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleLoopConnection(false)}
                    className="flex-1"
                  >
                    나중에
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
