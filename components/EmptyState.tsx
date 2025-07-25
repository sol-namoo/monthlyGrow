import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  tips?: string[];
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  tips,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted/50 p-8 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel &&
        (onAction ? (
          <Button className="mb-4" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : actionHref ? (
          <Button asChild className="mb-4">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null)}
      {tips && tips.length > 0 && (
        <div className="space-y-2 text-xs text-muted-foreground">
          {tips.map((tip, i) => (
            <p key={i}>{tip}</p>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
