"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, Plus, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { Monthly } from "@/lib/types";
import { formatDate, getMonthlyStatus } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface FutureMonthliesTabProps {
  monthlies: Monthly[];
  projectCounts: Record<string, number>;
  projectCountsLoading: boolean;
  onCreateMonthly: (monthOffset: number) => void;
}

export default function FutureMonthliesTab({
  monthlies,
  projectCounts,
  projectCountsLoading,
  onCreateMonthly,
}: FutureMonthliesTabProps) {
  const { translate, currentLanguage } = useLanguage();

  const getProjectCount = (monthly: Monthly) => {
    return projectCounts[monthly.id] || 0;
  };

  return (
    <div className="space-y-6">
      {/* 미래 먼슬리 헤더 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {translate("monthly.futureMonthlies.totalCount").replace(
            "{count}",
            monthlies.length.toString()
          )}
        </div>
        <Button onClick={() => onCreateMonthly(1)}>
          <Plus className="mr-2 h-4 w-4" />
          {translate("monthly.futureMonthlies.button")}
        </Button>
      </div>

      {/* 미래 먼슬리 리스트 */}
      {monthlies.length > 0 ? (
        <div className="space-y-4">
          {monthlies.map((monthly) => (
            <Card key={monthly.id} className="p-4">
              <Link href={`/monthly/${monthly.id}`} className="block">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{monthly.objective}</h3>
                    {monthly.objective && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {monthly.objective}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {translate("monthly.futureMonthlies.keyResults")}:{" "}
                      {monthly.keyResults?.length || 0}
                      {translate(
                        "monthly.futureMonthlies.keyResultsCount"
                      ).replace("{count}", "")}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-primary/30 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <BookOpenIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold">
            {translate("monthly.futureMonthlies.noMonthlies.title")}
          </h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-sm mx-auto">
            {translate("monthly.futureMonthlies.noMonthlies.description")}
          </p>
          <Button onClick={() => onCreateMonthly(1)}>
            <Plus className="mr-2 h-4 w-4" />
            {translate("monthly.futureMonthlies.noMonthlies.button")}
          </Button>
        </Card>
      )}
    </div>
  );
}
