"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Lightbulb,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getFailurePatternStats } from "@/lib/firebase/index";
import { useLanguage } from "@/hooks/useLanguage";

interface FailurePatternWidgetProps {
  userId: string;
}

export function FailurePatternWidget({ userId }: FailurePatternWidgetProps) {
  const { translate } = useLanguage();
  const [timeRange, setTimeRange] = useState<"monthly" | "yearly">("yearly");

  const { data: failureStats, isLoading } = useQuery({
    queryKey: ["failure-pattern-stats", userId, timeRange],
    queryFn: () => getFailurePatternStats(userId, timeRange),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded w-full"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!failureStats || failureStats.overallFailureRate === 0) {
    return (
      <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
        <div className="text-center py-6">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-medium mb-2">
            {translate("home.failurePattern.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {translate("home.failurePattern.noFailureData")}
            <br />
            {translate("home.failurePattern.noFailureDataDescription")}
          </p>
        </div>
      </Card>
    );
  }

  // 트렌드 계산
  const trends = failureStats.failureTrends;
  const isImproving =
    trends.length >= 2 &&
    trends[trends.length - 1].failureRate <
      trends[trends.length - 2].failureRate;

  return (
    <Card className="p-4 bg-card/80 dark:bg-card/60 border-border/50 dark:border-border/40">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold">
            {translate("home.failurePattern.title")}
          </h3>
        </div>
        <div className="flex gap-1">
          <Button
            variant={timeRange === "yearly" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("yearly")}
            className="h-7 text-xs"
          >
            {translate("home.failurePattern.yearly")}
          </Button>
          <Button
            variant={timeRange === "monthly" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange("monthly")}
            className="h-7 text-xs"
          >
            {translate("home.failurePattern.monthly")}
          </Button>
        </div>
      </div>

      {/* 전체 실패율 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {translate("home.failurePattern.overallFailureRate")}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-600">
              {failureStats.overallFailureRate}%
            </span>
            {isImproving ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>
        <Progress
          value={failureStats.overallFailureRate}
          className="h-2"
          style={
            {
              "--progress-background": "hsl(var(--orange-500))",
            } as React.CSSProperties
          }
        />
        <p className="text-xs text-muted-foreground mt-1">
          {timeRange === "yearly"
            ? translate("home.failurePattern.recent3Years")
            : translate("home.failurePattern.recent12Months")}{" "}
          기준
        </p>
      </div>

      {/* 주요 실패 이유 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          {translate("home.failurePattern.mainFailureReasons")}
        </h4>
        <div className="space-y-3">
          {failureStats.topFailureReasons.map((reason, index) => (
            <div
              key={reason.reason}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    index === 0
                      ? "bg-red-500"
                      : index === 1
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                  }`}
                />
                <span className="text-sm">{reason.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {reason.count}
                  {translate("home.failurePattern.times")}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {Math.round(
                    (reason.count /
                      failureStats.topFailureReasons.reduce(
                        (sum, r) => sum + r.count,
                        0
                      )) *
                      100
                  )}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 트렌드 차트 */}
      {trends.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {timeRange === "yearly"
              ? translate("home.failurePattern.yearly")
              : translate("home.failurePattern.monthly")}{" "}
            {translate("home.failurePattern.failureRateTrend")}
          </h4>
          <div className="h-24 bg-muted/20 rounded-lg p-3 flex items-end justify-between gap-1">
            {trends.slice(-6).map((trend, index) => (
              <div
                key={trend.period}
                className="flex flex-col items-center flex-1"
              >
                <div
                  className="bg-orange-500 rounded-t w-full mb-1 transition-all duration-300"
                  style={{
                    height: `${Math.max(trend.failureRate * 0.8, 4)}px`,
                    minHeight: "4px",
                  }}
                />
                <span className="text-xs text-muted-foreground text-center">
                  {trend.period}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 개선 제안 */}
      {failureStats.suggestions.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            {translate("home.failurePattern.improvementSuggestions")}
          </h4>
          <div className="space-y-2">
            {failureStats.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 {suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
