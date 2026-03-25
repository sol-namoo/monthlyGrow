"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadingOverlayProps {
  isLoading?: boolean;
  isVisible?: boolean;
  message?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  isVisible,
  message,
  children,
}: LoadingOverlayProps) {
  const { translate } = useLanguage();
  const visible = isLoading ?? isVisible ?? false;

  if (!visible) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {message || translate("common.loading")}
          </p>
        </div>
      </div>
    </div>
  );
}
