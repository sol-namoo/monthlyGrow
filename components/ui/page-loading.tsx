"use client";

import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message, className = "" }: PageLoadingProps) {
  const { translate } = useLanguage();

  return (
    <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        {message || translate("common.loading")}
      </p>
    </div>
  );
}
