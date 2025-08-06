import * as React from "react";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import type { VariantProps } from "class-variance-authority";

interface CustomAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof Alert> {
  children: React.ReactNode;
}

const CustomAlert = React.forwardRef<HTMLDivElement, CustomAlertProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Alert
        ref={ref}
        className={`[&>svg~*]:pl-5 [&>svg]:top-5 [&>svg+div]:translate-y-[-1px] ${
          className || ""
        }`}
        style={
          {
            "--tw-translate-y": "-1px",
          } as React.CSSProperties
        }
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            // 아이콘인 경우 크기를 h-3 w-3로 조정
            if (
              child.type === "svg" ||
              (child.props as any)?.className?.includes("h-4")
            ) {
              return React.cloneElement(child, {
                className:
                  (child.props as any).className?.replace(
                    "h-4 w-4",
                    "h-3 w-3"
                  ) || "h-3 w-3",
              });
            }
            // AlertTitle인 경우 text-sm 적용
            if (child.type === AlertTitle) {
              return React.cloneElement(child, {
                className: `text-sm ${(child.props as any).className || ""}`,
              });
            }
            // AlertDescription인 경우 text-xs 적용
            if (child.type === AlertDescription) {
              return React.cloneElement(child, {
                className: `text-xs ${(child.props as any).className || ""}`,
              });
            }
          }
          return child;
        })}
      </Alert>
    );
  }
);

CustomAlert.displayName = "CustomAlert";

export { CustomAlert, AlertTitle, AlertDescription };
