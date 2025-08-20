"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  hideNavigation?: boolean
}

function Calendar({ className, classNames, showOutsideDays = true, hideNavigation = false, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays={showOutsideDays}
      className={cn("p-3 w-fit mx-auto", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: hideNavigation ? "hidden" : "relative flex items-center justify-center pt-1",
        caption_label: hideNavigation ? "hidden" : "text-sm font-medium",
        nav: hideNavigation ? "hidden" : "absolute inset-x-0 top-0 flex items-center justify-between px-2",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          hideNavigation && "hidden"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          hideNavigation && "hidden"
        ),
        table: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        today: "bg-accent/80 text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: hideNavigation ? () => null : ({ orientation, ...props }: any) => {
          if (orientation === 'left') return <ChevronLeft className="h-4 w-4" {...props} />
          if (orientation === 'right') return <ChevronRight className="h-4 w-4" {...props} />
          return null as any
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
