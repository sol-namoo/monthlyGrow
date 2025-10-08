"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase/index";
import { usePageData } from "@/hooks/usePageData";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

export default function MonthlySummaryPage() {
  const [user, loading] = useAuthState(auth);
  const [reflection, setReflection] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [selectedMonthlyId, setSelectedMonthlyId] = useState<
    string | undefined
  >(undefined);
  const { translate } = useLanguage();

  const { monthlies, isLoading: isLoadingMonthlies } = usePageData("home", {
    userId: user?.uid,
  });
  const router = useRouter();
  const { toast } = useToast();

  // 로그인 상태 확인 및 리다이렉션
  useEffect(() => {
    if (!loading && !user) {
      toast({
        title: "로그인이 필요합니다",
        description: "로그인 페이지로 이동합니다.",
        variant: "destructive",
      });
      router.push("/login");
    }
  }, [user, loading, toast, router]);

  // 최근 먼슬리 id 선택
  useEffect(() => {
    if (monthlies && Array.isArray(monthlies) && monthlies.length > 0) {
      setSelectedMonthlyId(monthlies[0]?.id);
    }
  }, [monthlies]);
  const { monthly, projects, isLoading, error } = usePageData("monthlyDetail", {
    monthlyId: selectedMonthlyId,
  });

  if (loading || isLoadingMonthlies || isLoading)
    return <div>{translate("settings.loading.loading")}</div>;

  if (!user) {
    return null;
  }

  if (error) return <div>에러 발생: {error.message}</div>;
  if (!monthly) return <div>먼슬리 데이터가 없습니다.</div>;

  const progress =
    monthly.keyResults && monthly.keyResults.length > 0
      ? Math.round(
          (monthly.keyResults.filter((kr) => kr.isCompleted).length /
            monthly.keyResults.length) *
            100
        )
      : 0;
  const total = monthly.keyResults?.length || 0;

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/monthly">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">월간 회고</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-4 text-xl font-bold">{monthly.objective}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>보상: {monthly.reward}</span>
        </div>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {progress}%</span>
            <span>
              {monthly.keyResults?.filter((kr) => kr.isCompleted).length || 0}/
              {total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </Card>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">프로젝트 달성 현황</h2>
        <div className="space-y-3">
          {projects && projects.length > 0 ? (
            projects.map((project, index) => {
              return (
                <Card key={project.id} className="p-4">
                  <h3 className="mb-2 font-medium">{project.title}</h3>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>완료된 태스크: {project.completedTasks}개</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-value"
                      style={{
                        width: `${project.completedTasks > 0 ? 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </Card>
              );
            })
          ) : (
            <div>프로젝트가 없습니다.</div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">회고</h2>
        <Card className="p-4">
          <Textarea
            placeholder="이번 먼슬리에서 배운 점, 어려웠던 점, 다음 먼슬리에 적용할 점 등을 자유롭게 작성해보세요."
            className="min-h-32"
            value={reflection || monthly.retrospective?.content || ""}
            onChange={(e) => setReflection(e.target.value)}
          />
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">보상 받기</h2>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium">{monthly.reward}</h3>
              <p className="text-sm text-muted-foreground">
                달성률 {progress}%로 보상을 받을 수 있습니다.
              </p>
            </div>
            <Button
              onClick={() => setRewardClaimed(true)}
              disabled={rewardClaimed}
            >
              {rewardClaimed ? "받음" : "받기"}
            </Button>
          </div>
        </Card>
      </section>

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/monthly/new">새 먼슬리 시작하기</Link>
        </Button>
      </div>
    </div>
  );
}
