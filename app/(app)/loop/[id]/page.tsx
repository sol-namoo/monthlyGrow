"use client";

import { useState } from "react";
import Link from "next/link";

import { Project, Snapshot, Loop } from '@/lib/types';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Clock, Star, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Loading from '@/components/Loading'; // 로딩 컴포넌트
import Error from '@/components/Error'; // 에러 컴포넌트

import { useToast } from "@/hooks/use-toast";
import { usePageData } from '@/hooks/usePageData';



interface LoopDetailPageProps {
  params: {
      id: string;
  };
}

interface LoopDetailPageData {
  loop?: Loop;
  projects?: Project[];
  snapshots?: Snapshot[];
  isLoading: boolean;
  error?: Error;
}

const LoopDetailPage = ({ params }: LoopDetailPageProps) => {
  const { toast } = useToast();
  const { loop, projects, snapshots, isLoading, error } = usePageData('loopDetail', { loopId: params.id });
  const [showAddProjectDialog, setShowAddProjectDialog] = useState(false);

  const canAddProject = projects ? projects.length < 5 : false;

  // 프로젝트 추가 처리 함수
  const handleAddProject = () => {
    if (!canAddProject) {
      toast({
        title: "프로젝트 추가 실패",
        description: "한 루프에는 최대 5개의 프로젝트만 등록할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    // 여기서 프로젝트 추가 페이지로 이동하거나 다이얼로그를 표시
    setShowAddProjectDialog(true);
  };


  if (isLoading) {
    return <Loading />;
}

if (error) {
    return <Error message={error.message} />;
}

const progress = loop?.targetCount !== 0 ? Math.round(((loop?.doneCount || 0) / (loop?.targetCount || 0)) * 100) : 0;

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href="/loop">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">루프 상세</h1>
      </div>

      <Card className="mb-6 p-4">
        <h2 className="mb-2 text-xl font-bold">{loop?.title || '-'}</h2>
        <div className="mb-4 flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>보상: {loop?.reward}</span>
        </div>

        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>달성률: {progress}%</span>
            <span>
             ({loop?.doneCount} / {loop?.targetCount} || '-' )
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {loop?.startDate?.toLocaleDateString()|| '-'} ~ {loop?.endDate?.toLocaleDateString()|| '-'}
          </span>
        </div>

        <div className="mb-4">
          <h3 className="mb-2 font-medium">중점 Areas</h3>
          <div className="flex flex-wrap gap-2">
            {loop?.areas?.map((area) => (
              <span
                key={area}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs"
              >
                {area}
              </span>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">프로젝트 ({projects?.length}/5)</h3>
            {!loop?.completed && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddProject}
                disabled={!canAddProject}
              >
                <Plus className="mr-1 h-4 w-4" />
                프로젝트 추가
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {projects?.map((project) => (
              <div
                key={project.id}
                className="rounded-lg bg-secondary p-3 text-sm"
              >
                <div className="mb-1 flex justify-between">
                  <div className="flex items-center gap-2">
                    <span>{project.title}</span>
                    {project.addedMidway && (
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 text-xs"
                      >
                        🔥 루프 중 추가됨
                      </Badge>
                    )}
                  </div>
                  <span>
                    {project.progress}/{project.total}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-value"
                    style={{
                      width: `${Math.round(
                        (project.progress / project.total) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))?? <div>No Projects</div>}
             {snapshots?.map((snapshot: Snapshot) => (
                <div key={snapshot.id}>{snapshot.doneCount} / {snapshot.targetCount}</div>
            )) ?? <div>No Snapshots</div>}
          </div>
        </div>

        {loop?.reflection && (
          <div className="mb-4">
            <h3 className="mb-2 font-medium">회고</h3>
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p>{loop?.reflection}</p>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          {!loop?.completed && (
            <Button variant="outline" asChild>
              <Link href="/loop/summary">회고 작성</Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/loop">돌아가기</Link>
          </Button>
        </div>
      </Card>

      {/* 프로젝트 추가 다이얼로그 */}
      <Dialog
        open={showAddProjectDialog}
        onOpenChange={setShowAddProjectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>루프에 프로젝트 추가</DialogTitle>
            <DialogDescription>
              루프 중간에 추가된 프로젝트는 별도로 표시되며, 월말 리포트에서
              '후속 투입 항목'으로 집계됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <Button asChild>
              <Link href="/project/new?loopId=1&addedMidway=true">
                새 프로젝트 생성
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/loop/add-existing-project?loopId=1">
                기존 프로젝트 연결
              </Link>
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowAddProjectDialog(false)}
            >
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
