import React from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  isVisible,
  message,
  className = "",
}: LoadingOverlayProps) {
  const { translate } = useLanguage();
  const defaultMessage = translate("pageLoading.processing");
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-auto">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center gap-4 ${className}`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">
          {message || defaultMessage}
        </p>
      </div>
    </div>
  );
}
