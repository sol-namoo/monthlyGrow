"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Database, CheckCircle, AlertTriangle } from "lucide-react";
import {
  migrateTasksToSubcollections,
  checkMigrationStatus,
} from "@/lib/firebase/migration-utils";
import { PageLoading } from "@/components/ui/page-loading";
import { useLanguage } from "@/hooks/useLanguage";

export default function MigrateTasksPage() {
  const [user, loading] = useAuthState(auth);
  const { toast } = useToast();
  const { translate } = useLanguage();
  const [isChecking, setIsChecking] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    mainCollectionCount: number;
    subcollectionCount: number;
    needsMigration: boolean;
  } | null>(null);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    migratedCount: number;
    errors: string[];
  } | null>(null);

  const handleCheckStatus = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      const status = await checkMigrationStatus(user.uid);
      setMigrationStatus(status);

      if (status.needsMigration) {
        toast({
          title: "마이그레이션 필요",
          description: `${status.mainCollectionCount}개의 태스크를 서브컬렉션으로 이동해야 합니다.`,
        });
      } else {
        toast({
          title: "마이그레이션 불필요",
          description: "모든 태스크가 이미 서브컬렉션에 있습니다.",
        });
      }
    } catch (error) {
      console.error("상태 확인 실패:", error);
      toast({
        title: "오류 발생",
        description: "마이그레이션 상태 확인에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleMigrate = async () => {
    if (!user) return;

    setIsMigrating(true);
    try {
      const result = await migrateTasksToSubcollections(user.uid);
      setMigrationResult(result);

      if (result.success) {
        toast({
          title: "마이그레이션 완료",
          description: `${result.migratedCount}개의 태스크를 성공적으로 이동했습니다.`,
        });
        // 상태 다시 확인
        await handleCheckStatus();
      } else {
        toast({
          title: "마이그레이션 실패",
          description: `${result.errors.length}개의 오류가 발생했습니다.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("마이그레이션 실패:", error);
      toast({
        title: "오류 발생",
        description: "마이그레이션 실행에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <PageLoading message={translate("common.loading")} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {translate("common.loginRequired")}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">태스크 마이그레이션</h1>
        <p className="text-muted-foreground">
          기존 tasks 컬렉션의 데이터를 프로젝트 서브컬렉션으로 이동합니다.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5" />
          <h2 className="text-lg font-semibold">마이그레이션 상태 확인</h2>
        </div>

        <Button
          onClick={handleCheckStatus}
          disabled={isChecking}
          className="mb-4"
        >
          {isChecking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          상태 확인
        </Button>

        {migrationStatus && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>메인 컬렉션 태스크:</span>
              <span className="font-medium">
                {migrationStatus.mainCollectionCount}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>서브컬렉션 태스크:</span>
              <span className="font-medium">
                {migrationStatus.subcollectionCount}개
              </span>
            </div>
            <div className="flex justify-between">
              <span>마이그레이션 필요:</span>
              <span
                className={`font-medium ${
                  migrationStatus.needsMigration
                    ? "text-orange-600"
                    : "text-green-600"
                }`}
              >
                {migrationStatus.needsMigration ? "예" : "아니오"}
              </span>
            </div>
          </div>
        )}
      </Card>

      {migrationStatus?.needsMigration && (
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold">마이그레이션 실행</h2>
          </div>

          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              이 작업은 되돌릴 수 없습니다. 마이그레이션 전에 데이터를
              백업하세요.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleMigrate}
            disabled={isMigrating}
            variant="destructive"
          >
            {isMigrating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            마이그레이션 실행
          </Button>
        </Card>
      )}

      {migrationResult && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle
              className={`h-5 w-5 ${
                migrationResult.success ? "text-green-600" : "text-red-600"
              }`}
            />
            <h2 className="text-lg font-semibold">마이그레이션 결과</h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>성공 여부:</span>
              <span
                className={`font-medium ${
                  migrationResult.success ? "text-green-600" : "text-red-600"
                }`}
              >
                {migrationResult.success ? "성공" : "실패"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>이동된 태스크:</span>
              <span className="font-medium">
                {migrationResult.migratedCount}개
              </span>
            </div>
            {migrationResult.errors.length > 0 && (
              <div>
                <span className="font-medium text-red-600">
                  오류 ({migrationResult.errors.length}개):
                </span>
                <ul className="mt-2 space-y-1">
                  {migrationResult.errors.map((error, index) => (
                    <li
                      key={index}
                      className="text-sm text-red-600 bg-red-50 p-2 rounded"
                    >
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
