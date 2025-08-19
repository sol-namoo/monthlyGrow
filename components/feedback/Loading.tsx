import { Loader2 } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  const { translate } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] w-full">
      <Loader2 className="animate-spin h-8 w-8 text-primary mb-3" />
      <span className="text-sm text-muted-foreground">
        {message || translate("pageLoading.loading")}
      </span>
    </div>
  );
}
