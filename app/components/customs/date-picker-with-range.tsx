"use client";

import * as React from "react";
import { addDays, format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface DatePickerWithRangeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect"> {
  value?: { from: Date; to: Date } | undefined;
  onSelect?: (range: { from: Date; to: Date } | undefined) => void;
}

interface PresetOption {
  label: string;
  value: string;
}

const presetOptions: PresetOption[] = [
  { label: "This Month", value: "thisMonth" },
  { label: "Last 3 Months", value: "last3Months" },
  { label: "Last 6 Months", value: "last6Months" },
  { label: "Last Year", value: "lastYear" },
  { label: "All Time", value: "allTime" },
];

export function DatePickerWithRange({
  className,
  value: externalValue,
  onSelect: externalOnSelect,
}: DatePickerWithRangeProps) {
  const [preset, setPreset] = React.useState<string>("thisMonth");

  // Helper function to compute date range based on preset
  const computeDateRange = (preset: string): { from: Date; to: Date } => {
    const today = new Date();
    switch (preset) {
      case "thisMonth":
        return {
          from: new Date(today.getFullYear(), today.getMonth(), 1),
          to: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        };
      case "last3Months":
        return {
          from: new Date(today.getFullYear(), today.getMonth() - 2, 1),
          to: today,
        };
      case "last6Months":
        return {
          from: new Date(today.getFullYear(), today.getMonth() - 5, 1),
          to: today,
        };
      case "lastYear":
        return {
          from: new Date(today.getFullYear() - 1, 0, 1),
          to: new Date(today.getFullYear() - 1, 11, 31),
        };
      case "allTime":
      default:
        return {
          from: new Date(2000, 0, 1),
          to: today,
        };
    }
  };

  const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
    {
      from: computeDateRange(preset).from,
      to: computeDateRange(preset).to,
    }
  );

  // When preset changes, update internal date range and notify parent if needed
  React.useEffect(() => {
    const range = computeDateRange(preset);
    setInternalDate({ from: range.from, to: range.to });
    if (externalOnSelect) {
      externalOnSelect({ from: range.from, to: range.to });
    }
  }, [preset, externalOnSelect]);

  // Use externally controlled value if provided, otherwise internal state.
  const date = externalValue || internalDate;

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-auto flex-col space-y-2 p-2"
        >
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger>
              <SelectValue placeholder="Select Preset" />
            </SelectTrigger>
            <SelectContent>
              {presetOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                if (range && range.from && range.to) {
                  if (externalOnSelect) {
                    externalOnSelect({ from: range.from, to: range.to });
                  } else {
                    setInternalDate({ from: range.from, to: range.to });
                  }
                } else {
                  if (externalOnSelect) {
                    externalOnSelect(undefined);
                  } else {
                    setInternalDate(undefined);
                  }
                }
              }}
              numberOfMonths={2}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
