import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Info, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  type?: "delete" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
  showCheckbox?: boolean;
  checkboxLabel?: string;
  checkboxChecked?: boolean;
  onCheckboxChange?: (checked: boolean) => void;
  warningMessage?: string;
  children?: React.ReactNode;
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  confirmText,
  cancelText = "취소",
  onConfirm,
  onCancel,
  destructive = false,
  showCheckbox = false,
  checkboxLabel,
  checkboxChecked = false,
  onCheckboxChange,
  warningMessage,
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (type) {
      case "delete":
        return <Trash2 className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "info":
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    if (destructive) return "destructive";
    if (type === "delete") return "destructive";
    return "default";
  };

  const getConfirmText = () => {
    if (confirmText) return confirmText;
    switch (type) {
      case "delete":
        return "삭제";
      case "warning":
        return "확인";
      case "info":
      default:
        return "확인";
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-none max-h-none rounded-none border-0 m-0 p-2 sm:max-w-lg sm:max-h-[90vh] sm:rounded-lg sm:border sm:mx-2 sm:my-4">
        <DialogHeader className="pt-4">
          <DialogTitle>
            <div className="flex items-center gap-2">
              {getIcon()}
              {title}
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col space-y-3 text-center sm:text-left">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {children}
          {showCheckbox && checkboxLabel && (
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="confirm-checkbox"
                checked={checkboxChecked}
                onCheckedChange={(checked) =>
                  onCheckboxChange?.(checked as boolean)
                }
              />
              <label
                htmlFor="confirm-checkbox"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {checkboxLabel}
              </label>
            </div>
          )}
          {warningMessage && (
            <p className="text-sm text-red-600">⚠️ {warningMessage}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {getConfirmText()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
