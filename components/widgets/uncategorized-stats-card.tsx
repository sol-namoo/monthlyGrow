"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderOpen, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UncategorizedStatsCardProps {
  uncategorizedProjects: number;
  uncategorizedResources: number;
  totalAreas: number;
}

export function UncategorizedStatsCard({
  uncategorizedProjects,
  uncategorizedResources,
  totalAreas,
}: UncategorizedStatsCardProps) {
  const totalUncategorized = uncategorizedProjects + uncategorizedResources;
  const hasUncategorized = totalUncategorized > 0;
  const isHighCount = totalUncategorized >= 5;

  if (!hasUncategorized) {
    return null; // 미분류 항목이 없으면 표시하지 않음
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-orange-800 text-sm">
          <FolderOpen className="h-4 w-4" />
          미분류 항목 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isHighCount && (
          <Alert className="border-orange-200 bg-orange-100/50 py-2">
            <AlertTriangle className="h-3 w-3 text-orange-600" />
            <AlertDescription className="text-orange-800 text-xs">
              미분류 항목이 {totalUncategorized}개 있습니다. 영역별로 분류하면
              더 체계적으로 관리할 수 있어요!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {uncategorizedProjects}
            </div>
            <div className="text-xs text-orange-700">미분류 프로젝트</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">
              {uncategorizedResources}
            </div>
            <div className="text-xs text-orange-700">미분류 리소스</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-orange-700">
            총 {totalAreas}개 영역 중 {totalUncategorized}개 항목 분류 필요
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs h-7"
          >
            <Link href="/para">
              분류하기
              <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
