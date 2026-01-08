"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayRender, type DayProps } from "react-day-picker"
import { format } from "date-fns"

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
  today.setHours(0, 0, 0, 0)

  const CustomDay = (dayProps: DayProps) => {
    const { date, displayMonth } = dayProps
    if (!date) return <></>

    const ref = React.useRef<HTMLButtonElement>(null)
    const dayRender = useDayRender(date, displayMonth, ref)

    if (dayRender.isHidden) {
      return <></>
    }

    const isPast = date < today
    const isDisabled = dayRender.isDisabled || isPast

    let tooltipContent: React.ReactNode = null
    if (props.mode === "range" && props.selected) {
      const selected = props.selected as { from?: Date; to?: Date }
      if (selected.from && date.toDateString() === selected.from.toDateString()) {
        tooltipContent = <TooltipContent>Start date</TooltipContent>
      } else if (selected.to && date.toDateString() === selected.to.toDateString()) {
        tooltipContent = <TooltipContent>End date</TooltipContent>
      }
    }

    const dayElement = (
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors",
          isDisabled ? "font-light text-muted-foreground/60" : "font-bold",
          !isDisabled && "hover:bg-accent hover:text-accent-foreground cursor-pointer",
          dayRender.modifiers.selected && !dayRender.modifiers.range_middle && "bg-primary text-primary-foreground",
          dayRender.modifiers.range_middle && "bg-accent text-accent-foreground rounded-none",
          dayRender.modifiers.today && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {date.getDate()}
      </div>
    )

    if (!dayRender.isButton) {
      return <div {...dayRender.divProps}>{dayElement}</div>
    }

    const buttonElement = <button {...dayRender.buttonProps} ref={ref}>{dayElement}</button>

    if (tooltipContent) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
          {tooltipContent}
        </Tooltip>
      )
    }

    return buttonElement
  }

  const CustomCaption = () => {
    return (
      <div className="flex items-center justify-between px-1 py-2">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.preventDefault()
            props.onMonthChange?.(new Date(props.month!.getFullYear(), props.month!.getMonth() - 1))
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-sm font-semibold">
          {format(props.month || new Date(), "MMMM yyyy")}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => {
            e.preventDefault()
            props.onMonthChange?.(new Date(props.month!.getFullYear(), props.month!.getMonth() + 1))
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col space-y-6",
        month: "space-y-4",
        caption: "hidden",
        table: "w-full border-collapse",
        head_row: "flex mt-2",
        head_cell: "text-muted-foreground w-9 font-medium text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "relative p-0 text-center",
        day_outside: "text-muted-foreground opacity-40",
        day_disabled: "text-muted-foreground/60 font-light",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Day: CustomDay,
        CaptionLabel: CustomCaption,
      }}
      disabled={[
        { before: today },
        ...(Array.isArray(disabled) ? disabled : disabled ? [disabled] : []),
      ]}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
