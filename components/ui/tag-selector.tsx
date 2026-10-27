"use client"

import { SCHEDULE_TAGS, getTagColor } from "@/lib/schedule-tags"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface TagSelectorProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  maxTags?: number
}

export function TagSelector({ selectedTags, onTagsChange, maxTags = 5 }: TagSelectorProps) {
  const availableTags = SCHEDULE_TAGS.filter(tag => !selectedTags.includes(tag.tag))

  const handleTagAdd = (tagName: string) => {
    if (selectedTags.length < maxTags && !selectedTags.includes(tagName)) {
      onTagsChange([...selectedTags, tagName])
    }
  }

  const handleTagRemove = (tagName: string) => {
    onTagsChange(selectedTags.filter(tag => tag !== tagName))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Etiquetas ({selectedTags.length}/{maxTags})
        </label>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={() => onTagsChange([])}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar todas
          </button>
        )}
      </div>
      
      {/* Select para adicionar tags */}
      {selectedTags.length < maxTags && (
        <Select onValueChange={handleTagAdd}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma etiqueta..." />
          </SelectTrigger>
          <SelectContent>
            {availableTags.map((tag) => (
              <SelectItem key={tag.tag} value={tag.tag}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.tag}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      
      {/* Tags selecionadas */}
      {selectedTags.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Etiquetas selecionadas:</label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tagName, index) => (
              <Badge
                key={tagName}
                variant="secondary"
                className={cn(
                  "flex items-center gap-1 text-white",
                  index === 0 && "ring-2 ring-offset-2 ring-blue-500" // Destacar primeira tag
                )}
                style={{ backgroundColor: getTagColor(tagName) }}
              >
                {index === 0 && <span className="text-xs">🎨</span>}
                {tagName}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tagName)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <p className="text-xs text-muted-foreground">
              🎨 A primeira etiqueta define a cor do evento
            </p>
          )}
        </div>
      )}
    </div>
  )
}
