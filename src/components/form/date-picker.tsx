import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { cn, formatDate } from "../../lib/utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export interface DatePickerProps extends Omit<
  React.ComponentProps<typeof Button>,
  "value" | "onChange"
> {
  value?: string | null;
  onChange?: (value: string) => void;
  placeholder?: string;
}

function parseDate(value?: string | null): Date | undefined {
  if (!value) return undefined;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;

  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));

  if (
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return undefined;
  }

  return date;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "请选择日期",
  className,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = React.useMemo(() => parseDate(value), [value]);
  const [month, setMonth] = React.useState<Date>(() => selectedDate ?? new Date());

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) setMonth(selectedDate ?? new Date());
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn("w-full justify-start text-left font-normal", className)}
            {...props}
            type="button"
          />
        }
      >
        <CalendarIcon aria-hidden="true" />
        <span className={cn("truncate", !selectedDate && "text-muted-foreground")}>
          {selectedDate ? formatDate(selectedDate) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto gap-0 p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          month={month}
          onMonthChange={setMonth}
          onSelect={(date) => {
            if (!date) return;
            onChange?.(formatDate(date) ?? "");
            setOpen(false);
          }}
        />
        <div className="border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              onChange?.("");
              setOpen(false);
            }}
          >
            清空
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
