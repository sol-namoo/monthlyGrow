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
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "warning":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
        getStyles(),
        className
      )}
    >
      {getIcon()}
      <span>{message}</span>
    </div>
  );
}
