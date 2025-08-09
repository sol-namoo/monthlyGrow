"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Star } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { usePageData } from "@/hooks/usePageData";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

export default function ChapterSummaryPage() {
  const [user, loading] = useAuthState(auth);
  const [reflection, setReflection] = useState("");
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const [selectedChapterId, setSelectedChapterId] = useState<
    string | undefined
  >(undefined);
  const { translate } = useLanguage();

  const { chapters, isLoading: isLoadingChapters } = usePageData("home", {
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

  // 최근 챕터 id 선택
  useEffect(() => {
    if (chapters && chapters.length > 0) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters]);
  const { chapter, projects, isLoading, error } = usePageData("chapterDetail", {
    chapterId: selectedChapterId,
  });

  if (loading || isLoadingChapters || isLoading)
    return <div>{translate("settings.loading.loading")}</div>;

  if (!user) {
    return null;
  }

  if (error) return <div>에러 발생: {error.message}</div>;
  if (!chapter) return <div>챕터 데이터가 없습니다.</div>;

  const progress =
    chapter.targetCount > 0
      ? Math.round((chapter.doneCount / chapter.targetCount) * 100)
      : 0;
  const total = chapter.targetCount;

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/chapter">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">월간 회고</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-4 text-xl font-bold">{chapter.title}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>보상: {chapter.reward}</span>
        </div>
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {progress}%</span>
            <span>
              {chapter.doneCount}/{total}
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
              const projProgress =
                project.target > 0
                  ? Math.round((project.completedTasks / project.target) * 100)
                  : 0;
              return (
                <Card key={project.id} className="p-4">
                  <h3 className="mb-2 font-medium">{project.title}</h3>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>달성률: {projProgress}%</span>
                    <span>
                      {project.completedTasks}/{project.target}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-value"
                      style={{ width: `${projProgress}%` }}
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
            placeholder="이번 챕터에서 배운 점, 어려웠던 점, 다음 챕터에 적용할 점 등을 자유롭게 작성해보세요."
            className="min-h-32"
            value={reflection || chapter.retrospective?.content || ""}
            onChange={(e) => setReflection(e.target.value)}
          />
        </Card>
      </section>

      <section className="mb-6">
        <h2 className="mb-4 text-xl font-bold">보상 받기</h2>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h3 className="font-medium">{chapter.reward}</h3>
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
          <Link href="/chapter/new">새 챕터 시작하기</Link>
        </Button>
      </div>
    </div>
  );
}
