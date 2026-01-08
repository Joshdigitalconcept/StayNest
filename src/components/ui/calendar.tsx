"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, DayProps, DayContentProps } from "react-day-picker"
import { addDays } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  disabled,
  ...props
}: CalendarProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day

  const DayWithTooltipAndStyles = (dayProps: DayContentProps) => {
    const { date, selected, modifiers } = dayProps
    const isPast = date < today
    const isDisabled = modifiers.disabled || isPast

    // Determine if this is start or end of range
    let tooltipContent: React.ReactNode = null
    if (props.mode === "range" && selected && "from" in selected && "to" in selected) {
      const { from, to } = selected as { from?: Date; to?: Date }
      if (from && date && from.toDateString() === date.toDateString()) {
        tooltipContent = <TooltipContent>Start date</TooltipContent>
      } else if (to && date && to.toDateString() === date.toDateString()) {
        tooltipContent = <TooltipContent>End date</TooltipContent>
      }
    }

    const dayElement = (
      <div
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all",
          // Font weight
          isDisabled ? "font-light text-muted-foreground/60" : "font-bold",
          // Selected state
          modifiers.selected && !isDisabled && "bg-primary text-primary-foreground",
          // Range middle
          modifiers.range_middle && "bg-accent text-accent-foreground rounded-none",
          // Hover only on enabled dates
          !isDisabled && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          // Today
          modifiers.today && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {date.getDate()}
      </div>
    )

    if (tooltipContent) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{dayElement}</TooltipTrigger>
          {tooltipContent}
        </Tooltip>
      )
    }

    return dayElement
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-6 sm:space-x-8 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-lg font-semibold",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-70 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex mt-2",
        head_cell: "text-muted-foreground w-9 font-medium text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center",
        day: "h-9 w-9 p-0",
        day_outside: "text-muted-foreground opacity-40",
        day_disabled: "text-muted-foreground/60 font-light",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        DayContent: DayWithTooltipAndStyles,
      }}
      disabled={[
        { before: today }, // Disable all past dates
        ...(Array.isArray(disabled) ? disabled : disabled ? [disabled] : []),
      ]}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }