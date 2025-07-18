"use client";
import useLoops from "../../../lib/query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loop } from "../../../lib/types";
import { Timestamp } from "firebase/firestore";

export default function Loops() {
  const { data: loops, isLoading, isError } = useLoops();
  const router = useRouter();
  const [isFirstDayOfMonth, setIsFirstDayOfMonth] = useState(false);
  const [currentLoop, setCurrentLoop] = useState<Loop | null>(null);
  const [nextLoop, setNextLoop] = useState<Loop | null>(null);
  const [pastLoops, setPastLoops] = useState<Loop[]>([]);

  useEffect(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    setIsFirstDayOfMonth(now.toDateString() === firstDayOfMonth.toDateString());

    if (loops) {
      const current =
        loops.find(
          (loop) =>
            now.getTime() >= loop.startDate.getTime() &&
            now.getTime() <= loop.endDate.getTime()
        ) || null;
      const next =
        loops.find((loop) => now.getTime() < loop.startDate.getTime()) || null;
      const past =
        loops.filter((loop) => now.getTime() > loop.endDate.getTime()) || [];
      setCurrentLoop(current);
      setNextLoop(next);
      setPastLoops(past);
    }
  }, [loops]);

  // 루프 생성 버튼 클릭 핸들러
  const handleCreateLoop = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const nextMonth = (currentMonth + 1) % 12;
    const nextMonthYear = nextMonth === 0 ? currentYear + 1 : currentYear;

    if (currentLoop && nextLoop) {
      toast("다음 루프가 이미 준비되어 있어요");
      return;
    }

    // 루프 생성 페이지로 이동
    // 현재 루프 존재 여부에 따라 다른 파라미터 전달
    const startDate = currentLoop
      ? `${nextMonthYear}-${String(nextMonth + 1).padStart(2, "0")}-01` // 다음 달 1일
      : `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`; // 현재 달 1일
    await router.push(`/loop/new?startDate=${startDate}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error occurred.</div>;
  }

  return (
    <div className="container max-w-md px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">월간 루프</h1>
        <button className="btn btn-primary" onClick={handleCreateLoop}>
          루프 생성
        </button>
      </div>
      {/* Current Loop */}
      {currentLoop ? (
        <div>
          <h2>{currentLoop.title}</h2>
          <p>Reward: {currentLoop.reward}</p>
        </div>
      ) : (
        <div>No current loop</div>
      )}
      {/* Next Loop */}
      {nextLoop ? (
        <div>
          <h2>{nextLoop.title}</h2>
          <p>Reward: {nextLoop.reward}</p>
        </div>
      ) : (
        <div>No next loop</div>
      )}

      {/* Past Loops */}
      {pastLoops.length > 0 && (
        <div>
          <h2>Past Loops</h2>
          <ul>
            {pastLoops.map((loop) => (
              <li key={loop.title}>{loop.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
