"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderOpen, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

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
  const { theme } = useTheme();
  const totalUncategorized = uncategorizedProjects + uncategorizedResources;
  const hasUncategorized = totalUncategorized > 0;
  const isHighCount = totalUncategorized >= 5;

  if (!hasUncategorized) {
    return null; // 미분류 항목이 없으면 표시하지 않음
  }

  const isDark = theme === "dark";

  return (
    <Card
      className="border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30"
      style={{
        backgroundColor: isDark ? "rgba(88, 28, 135, 0.3)" : "#faf5ff",
        borderColor: isDark ? "#7c3aed" : "#e9d5ff",
      }}
    >
      <CardHeader className="pb-2">
        <CardTitle
          className="flex items-center gap-2 text-purple-800 dark:text-purple-200 text-sm"
          style={{
            color: isDark ? "#e9d5ff" : "#6b21a8",
          }}
        >
          <FolderOpen className="h-4 w-4" />
          미분류 항목 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isHighCount && (
          <Alert
            className="border-purple-200 bg-purple-100 dark:border-purple-700 dark:bg-purple-900/50 py-2"
            style={{
              backgroundColor: isDark ? "rgba(147, 51, 234, 0.5)" : "#f3e8ff",
              borderColor: isDark ? "#7c3aed" : "#e9d5ff",
            }}
          >
            <AlertTriangle
              className="h-3 w-3 text-purple-600 dark:text-purple-400"
              style={{
                color: isDark ? "#a855f7" : "#9333ea",
              }}
            />
            <AlertDescription
              className="text-purple-800 dark:text-purple-200 text-xs"
              style={{
                color: isDark ? "#e9d5ff" : "#6b21a8",
              }}
            >
              미분류 항목이 {totalUncategorized}개 있습니다. 영역별로 분류하면
              더 체계적으로 관리할 수 있어요!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div
              className="text-lg font-bold text-purple-600 dark:text-purple-400"
              style={{
                color: isDark ? "#a855f7" : "#9333ea",
              }}
            >
              {uncategorizedProjects}
            </div>
            <div
              className="text-xs text-purple-700 dark:text-purple-300"
              style={{
                color: isDark ? "#c4b5fd" : "#7c3aed",
              }}
            >
              미분류 프로젝트
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-lg font-bold text-purple-600 dark:text-purple-400"
              style={{
                color: isDark ? "#a855f7" : "#9333ea",
              }}
            >
              {uncategorizedResources}
            </div>
            <div
              className="text-xs text-purple-700 dark:text-purple-300"
              style={{
                color: isDark ? "#c4b5fd" : "#7c3aed",
              }}
            >
              미분류 리소스
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div
            className="text-xs text-purple-700 dark:text-purple-300"
            style={{
              color: isDark ? "#c4b5fd" : "#7c3aed",
            }}
          >
            총 {totalAreas}개 영역 중 {totalUncategorized}개 항목 분류 필요
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-purple-300 text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-900/50 text-xs h-7"
            style={{
              borderColor: isDark ? "#7c3aed" : "#d8b4fe",
              color: isDark ? "#c4b5fd" : "#7c3aed",
              backgroundColor: isDark ? "transparent" : "transparent",
            }}
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
