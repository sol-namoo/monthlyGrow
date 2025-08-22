import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import type { Monthly } from "@/lib/types";

interface MonthlyConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableMonthlies: Monthly[];
  selectedMonthlyIds: string[];
  onMonthlySelectionChange: (monthlyIds: string[]) => void;
  onConfirm: () => void;
}

// 월간 상태 확인
const getMonthlyStatus = (monthly: Monthly) => {
  const now = new Date();
  const monthlyStart = new Date(monthly.startDate);
  const monthlyEnd = new Date(monthly.endDate);

  if (now >= monthlyStart && now <= monthlyEnd) {
    return "in_progress";
  } else if (now < monthlyStart) {
    return "planned";
  } else {
    return "completed";
  }
};

// 월간에 연결된 프로젝트 수를 계산하는 함수
const getConnectedProjectCount = (monthlyId: string, allProjects: any[]) => {
  if (!allProjects) return 0;

  // 모든 프로젝트에서 해당 월간에 연결된 프로젝트 수 계산
  return allProjects.filter((project) =>
    project.connectedMonthlies?.includes(monthlyId)
  ).length;
};

export function MonthlyConnectionDialog({
  open,
  onOpenChange,
  availableMonthlies,
  selectedMonthlyIds,
  onMonthlySelectionChange,
  onConfirm,
}: MonthlyConnectionDialogProps) {
  const { translate, currentLanguage } = useLanguage();
  const { toast } = useToast();

  // 월간 선택/해제 핸들러
  const toggleMonthlySelection = (monthlyId: string) => {
    const newSelection = selectedMonthlyIds.includes(monthlyId)
      ? selectedMonthlyIds.filter((id) => id !== monthlyId)
      : [...selectedMonthlyIds, monthlyId];

    onMonthlySelectionChange(newSelection);
  };

  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
    toast({
      title: "먼슬리 연결 설정됨",
      description: `${selectedMonthlyIds.length}개 먼슬리가 선택되었습니다. 저장 시 적용됩니다.`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>먼슬리에 연결</DialogTitle>
          <DialogDescription>
            이 프로젝트를 연결할 먼슬리를 선택하세요.
            <br />
            (프로젝트 기간과 겹치는 먼슬리만 표시됩니다)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availableMonthlies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                연결할 수 있는 먼슬리가 없습니다.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                프로젝트 기간과 겹치는 먼슬리만 연결할 수 있습니다.
              </p>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>팁:</strong> 먼슬리를 먼저 생성하거나 프로젝트
                  기간을 조정해보세요.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {availableMonthlies.map((monthly) => (
                  <div
                    key={monthly.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMonthlyIds.includes(monthly.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => toggleMonthlySelection(monthly.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{monthly.objective}</h4>
                        {selectedMonthlyIds.includes(monthly.id) && (
                          <Badge variant="outline" className="text-xs">
                            선택됨
                          </Badge>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          getMonthlyStatus(monthly) === "in_progress"
                            ? "bg-green-100 text-green-700"
                            : getMonthlyStatus(monthly) === "planned"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getMonthlyStatus(monthly) === "in_progress"
                          ? "진행 중"
                          : getMonthlyStatus(monthly) === "planned"
                          ? "예정"
                          : "완료"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(monthly.startDate, currentLanguage)} -{" "}
                      {formatDate(monthly.endDate, currentLanguage)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleConfirm} className="flex-1">
                  확인 ({selectedMonthlyIds.length}개)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
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
  );
} 