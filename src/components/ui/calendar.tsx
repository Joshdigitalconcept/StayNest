
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayProps, Day as DayComponent } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  
  const DayWithTooltip = (dayProps: DayProps) => {
    const { date, displayMonth } = dayProps;

    if (date && props.mode === 'range') {
      const { from, to } = (props.selected as { from?: Date; to?: Date }) || {};
      let tooltipContent: React.ReactNode = null;
      
      if (from && isSameDay(date, from)) {
        tooltipContent = <TooltipContent>Start date</TooltipContent>;
      } else if (to && isSameDay(date, to)) {
        tooltipContent = <TooltipContent>End date</TooltipContent>;
      }

      if (tooltipContent) {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <DayComponent {...dayProps} />
            </TooltipTrigger>
            {tooltipContent}
          </Tooltip>
        );
      }
    }
    return <DayComponent {...dayProps} />;
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hidden"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-full [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-bold rounded-full aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full",
        day_today: "bg-accent text-accent-foreground rounded-full",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50 font-light",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Day: DayWithTooltip
      }}
      footer={
          <div className="flex justify-between pt-4">
               <Button
                size="sm"
                variant="outline"
                onClick={() => props.onMonthChange?.(addDays(props.month || new Date(), -30))}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Prev
              </Button>
               <Button
                size="sm"
                variant="outline"
                onClick={() => props.onMonthChange?.(addDays(props.month || new Date(), 30))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
          </div>
      }
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

function isSameDay(d1: Date, d2: Date) {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


export { Calendar }
