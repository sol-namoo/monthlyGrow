import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      <Loader2 className="animate-spin h-8 w-8 text-primary mb-3" />
      <span className="text-sm text-muted-foreground">
        잠시만 기다려 주세요...
      </span>
    </div>
  );
}
