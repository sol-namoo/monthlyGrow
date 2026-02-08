"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
  lazy,
} from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronRight,
  Star,
  Bookmark,
  Clock,
  CalendarDays,
  BookOpen,
  AlertCircle,
  Calendar,
  Zap,
  Award,
  Edit,
  BookOpen as BookOpenIcon,
  Plus,
  Archive,
  Target,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Users,
  FileText,
  Settings,
  Sparkles,
  PenTool,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "@/components/feedback/Loading";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { Monthly } from "@/lib/types";
import {
  fetchAllMonthliesByUserId,
  fetchCurrentMonthlyProjects,
  createMonthly,
  updateMonthly,
  deleteMonthlyById,
  fetchProjectsByIds,
} from "@/lib/firebase/index";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/hooks/useLanguage";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ProgressCard } from "@/components/widgets/progress-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MonthlyDetailContent } from "@/components/monthly/MonthlyDetailContent";

// Lazy loaded components for other tabs
const FutureMonthliesTab = lazy(
  () => import("./components/FutureMonthliesTab")
);
const PastMonthliesTab = lazy(() => import("./components/PastMonthliesTab"));

function MonthlyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, userLoading] = useAuthState(auth);
  const { translate, currentLanguage } = useLanguage();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 상태 관리
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "completionRate">(
    "latest"
  );
  const [currentTab, setCurrentTab] = useState(
    searchParams.get("tab") || "current"
  );

  // useEffect를 useQuery 전에 호출
  useEffect(() => {
    setCurrentTab(searchParams.get("tab") || "current");
  }, [searchParams]);

  // 현재 먼슬리만 가져오기 (최적화)
  const { data: currentMonthly = null, isLoading: currentMonthlyLoading } =
    useQuery({
      queryKey: ["current-monthly", user?.uid],
      queryFn: async () => {
        const allMonthlies = await fetchAllMonthliesByUserId(user?.uid || "");
        const monthly = allMonthlies.find(
          (monthly) => getMonthlyStatus(monthly) === "in_progress"
        );

        if (monthly) {
          // 연결된 프로젝트: SSOT인 monthly.connectedProjects 기준으로 조회
          const projectIds = (monthly.connectedProjects ?? []).map(
            (c: { projectId?: string } | string) =>
              typeof c === "string" ? c : c.projectId!
          );
          try {
            const connectedProjects =
              projectIds.length > 0 ? await fetchProjectsByIds(projectIds) : [];
            return {
              ...monthly,
              connectedProjects,
            };
          } catch (error) {
            console.warn("연결된 프로젝트 조회 실패:", error);
            return {
              ...monthly,
              connectedProjects: [],
            };
          }
        }

        return null;
      },
      enabled: !!user?.uid && currentTab === "current",
      staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
      gcTime: 5 * 60 * 1000, // 5분간 가비지 컬렉션 방지
    });

  // 미래 먼슬리들 (탭이 활성화될 때만 가져오기)
  const { data: futureMonthlies = [], isLoading: futureMonthliesLoading } =
    useQuery({
      queryKey: ["future-monthlies", user?.uid],
      queryFn: async () => {
        const allMonthlies = await fetchAllMonthliesByUserId(user?.uid || "");
        return allMonthlies.filter(
          (monthly) => getMonthlyStatus(monthly) === "planned"
        );
      },
      enabled: !!user?.uid && currentTab === "future",
      staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
      gcTime: 5 * 60 * 1000, // 5분간 가비지 컬렉션 방지
    });

  // 과거 먼슬리들 (탭이 활성화될 때만 가져오기)
  const { data: pastMonthlies = [], isLoading: pastMonthliesLoading } =
    useQuery({
      queryKey: ["past-monthlies", user?.uid],
      queryFn: async () => {
        const allMonthlies = await fetchAllMonthliesByUserId(user?.uid || "");
        return allMonthlies.filter(
          (monthly) => getMonthlyStatus(monthly) === "ended"
        );
      },
      enabled: !!user?.uid && currentTab === "past",
      staleTime: 2 * 60 * 1000, // 2분간 캐시 유지
      gcTime: 5 * 60 * 1000, // 5분간 가비지 컬렉션 방지
    });

  // 프로젝트 개수 데이터 (임시로 빈 객체 사용)
  const projectCounts: Record<string, number> = {};
  const projectCountsLoading = false;

  // 초기 로딩 상태
  if (
    userLoading ||
    (currentTab === "current" && currentMonthlyLoading) ||
    (currentTab === "future" && futureMonthliesLoading) ||
    (currentTab === "past" && pastMonthliesLoading)
  ) {
    return (
      <div className="container max-w-md px-3 py-4 pb-20">
        <div className="mb-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // 정렬
  const sortedFutureMonthlies = [...futureMonthlies].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const sortedPastMonthlies = [...pastMonthlies].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    router.push(`/monthly?tab=${value}`, { scroll: false });
  };

  const handleCreateMonthly = (monthOffset: number) => {
    const searchParams = new URLSearchParams();
    searchParams.set("monthOffset", monthOffset.toString());
    router.push(`/monthly/new?${searchParams.toString()}`);
  };

  return (
    <div className="container max-w-md px-3 py-4 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{translate("monthly.title")}</h1>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="mb-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">
            {translate("monthly.tabs.current")}
          </TabsTrigger>
          <TabsTrigger value="future" className="relative">
            {translate("monthly.tabs.future")}
            {sortedFutureMonthlies.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-4 w-4 p-0 text-xs flex-shrink-0"
              >
                {sortedFutureMonthlies.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="relative">
            {translate("monthly.tabs.past")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentMonthly ? (
            <MonthlyDetailContent
              monthly={currentMonthly}
              showHeader={true}
              showActions={true}
              onDelete={() => {
                // 삭제 후 현재 먼슬리가 없어지면 빈 상태로 변경
                queryClient.invalidateQueries({
                  queryKey: ["current-monthly", user?.uid],
                });
              }}
            />
          ) : (
            <Card className="border-2 border-dashed border-primary/30 dark:border-primary/50 p-8 text-center bg-card/80 dark:bg-card/60">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-lg font-bold">
                {translate("monthly.currentMonthly.noMonthly.title")}
              </h3>
              <p className="mb-6 text-xs text-muted-foreground max-w-sm mx-auto">
                {translate("monthly.currentMonthly.noMonthly.description")}
              </p>
              <Button onClick={() => handleCreateMonthly(0)}>
                <Plus className="mr-2 h-4 w-4" />
                {translate("monthly.currentMonthly.noMonthly.button")}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="future" className="mt-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <FutureMonthliesTab
              monthlies={sortedFutureMonthlies}
              projectCounts={projectCounts}
              projectCountsLoading={projectCountsLoading}
              onCreateMonthly={handleCreateMonthly}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            }
          >
            <PastMonthliesTab
              projectCounts={projectCounts}
              projectCountsLoading={projectCountsLoading}
              sortBy={sortBy}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MonthlyPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MonthlyPageContent />
    </Suspense>
  );
}
