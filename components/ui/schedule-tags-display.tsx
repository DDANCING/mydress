"use client"

import { getTagColor } from "@/lib/schedule-tags"
import { cn } from "@/lib/utils"

interface ScheduleTagsDisplayProps {
  tags: string[]
  maxVisible?: number
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ScheduleTagsDisplay({ 
  tags, 
  maxVisible = 3, 
  className,
  size = "sm" 
}: ScheduleTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null
  }

  const visibleTags = tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1", 
    lg: "text-base px-3 py-1.5"
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {visibleTags.map((tag, index) => (
        <span
          key={index}
          className={cn(
            "inline-flex items-center rounded-full font-medium text-white",
            sizeClasses[size]
          )}
          style={{ backgroundColor: getTagColor(tag) }}
          title={tag}
        >
          {tag}
        </span>
      ))}
      
      {hiddenCount > 0 && (
        <span
          className={cn(
            "inline-flex items-center rounded-full bg-gray-500 text-white font-medium",
            sizeClasses[size]
          )}
          title={`+${hiddenCount} tags: ${tags.slice(maxVisible).join(", ")}`}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}
