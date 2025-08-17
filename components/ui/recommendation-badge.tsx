import { AlertCircle, Info, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationBadgeProps {
  type: "info" | "warning" | "success";
  message: string;
  className?: string;
}

export function RecommendationBadge({
  type,
  message,
  className,
}: RecommendationBadgeProps) {
  const getIcon = () => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "warning":
        return <AlertCircle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "info":
        return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-700";
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/30 dark:border-orange-700";
      case "success":
        return "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-700";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-4 text-xs flex-shrink-0",
        getStyles(),
        className
      )}
    >
      <span>{message}</span>
    </div>
  );
}
