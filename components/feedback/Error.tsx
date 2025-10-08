import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const Error = ({ message, onRetry, showRetry = true }: ErrorProps) => {
  return (
    <Alert className="max-w-md mx-auto">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="mt-2">
        <div className="space-y-4">
          <p>{message}</p>
          {showRetry && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default Error;
