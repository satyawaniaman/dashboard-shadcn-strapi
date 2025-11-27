"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { FilterX, Funnel } from "lucide-react";

interface ColumnFilterProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ColumnFilter({
  label,
  value,
  onChange,
  placeholder,
}: ColumnFilterProps) {
  const [inputValue, setInputValue] = useState(value || "");
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onChange(inputValue);
    setOpen(false);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setInputValue(value || "");
    }
  };

  return (
    <div className="flex items-center gap-1">
      {label}
      {value ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 p-1 text-primary"
          onClick={handleClear}
        >
          <FilterX className="h-4 w-4" />
        </Button>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-1">
              <Funnel className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleApply();
                }
              }}
              className="mb-2"
            />
            <Button onClick={handleApply} size="sm" className="w-full">
              Apply
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
