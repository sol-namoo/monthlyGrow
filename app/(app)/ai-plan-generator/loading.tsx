import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function AIPlanGeneratorLoading() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Skeleton className="h-8 w-64 mb-6" />

      {/* 기존 Areas 정보 스켈레톤 */}
      <Card className="mb-6 p-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-96 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </Card>

      {/* 목표 입력 스켈레톤 */}
      <div className="mb-6">
        <Skeleton className="h-5 w-32 mb-2" />
        <Skeleton className="h-24 w-full mb-1" />
        <Skeleton className="h-4 w-16" />
      </div>

      {/* 제약 조건 설정 스켈레톤 */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card className="p-4">
          <Skeleton className="h-5 w-20 mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-20 mb-3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </Card>
      </div>

      {/* 생성 버튼 스켈레톤 */}
      <div className="text-center mb-6">
        <Skeleton className="h-12 w-48 mx-auto" />
      </div>
    </div>
  );
}
