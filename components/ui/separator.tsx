"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

interface SeparatorWithTextProps
  extends React.ComponentProps<typeof SeparatorPrimitive.Root> {
  withText?: boolean
  text?: string
}

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  withText = false,
  text = "ou",
  ...props
}: SeparatorWithTextProps) {
  if (withText && orientation === "horizontal") {
    return (
      <div className="flex items-center gap-4">
        <SeparatorPrimitive.Root
          decorative={decorative}
          orientation="horizontal"
          className={cn("bg-border h-px w-full", className)}
          {...props}
        />
        <span className="text-sm text-muted-foreground">{text}</span>
        <SeparatorPrimitive.Root
          decorative={decorative}
          orientation="horizontal"
          className={cn("bg-border h-px w-full", className)}
          {...props}
        />
      </div>
    )
  }

  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
