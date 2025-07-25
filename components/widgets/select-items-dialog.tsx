"use client";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

interface SelectItem {
  id: string;
  name: string;
  description?: string;
  type?: string; // For resources
  status?: string; // For projects
}

interface SelectItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: SelectItem[];
  selectedItemIds: string[];
  onSave: (newSelectedIds: string[]) => void;
  title: string;
  description: string;
  searchPlaceholder?: string;
}

export function SelectItemsDialog({
  isOpen,
  onClose,
  items,
  selectedItemIds,
  onSave,
  title,
  description,
  searchPlaceholder = "검색...",
}: SelectItemsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentSelection, setCurrentSelection] =
    useState<string[]>(selectedItemIds);

  useEffect(() => {
    setCurrentSelection(selectedItemIds);
  }, [selectedItemIds, isOpen]); // 모달이 열릴 때마다 초기화

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCurrentSelection((prev) =>
      checked ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    onSave(currentSelection);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="relative mb-4">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="flex-grow pr-4 -mr-4">
          <div className="grid gap-3">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={currentSelection.includes(item.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(item.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={`item-${item.id}`} className="flex flex-col">
                    <span className="font-medium">{item.name}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                    {item.type && (
                      <span className="text-xs text-muted-foreground">
                        유형: {item.type}
                      </span>
                    )}
                    {item.status && (
                      <span className="text-xs text-muted-foreground">
                        상태: {item.status}
                      </span>
                    )}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                검색 결과가 없습니다.
              </p>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
