"use client"

import { useState } from "react"
import { TagSelector } from "@/components/ui/tag-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSchedule } from "@/actions/schedule"

interface ScheduleFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function ScheduleForm({ onSuccess, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    sellerId: "",
    productId: "",
  })
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createSchedule({
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        type: "CLIENT_APPOINTMENT",
        sellerId: formData.sellerId || undefined,
        productId: formData.productId || undefined,
        tags: selectedTags,
      })

      onSuccess?.()
    } catch (error) {
      console.error("Erro ao criar agendamento:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="sellerId">Vendedor</Label>
          <Input
            id="sellerId"
            value={formData.sellerId}
            onChange={(e) => setFormData(prev => ({ ...prev, sellerId: e.target.value }))}
            placeholder="ID do vendedor (opcional)"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Data/Hora de Início</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="endDate">Data/Hora de Fim</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="productId">Produto (ID)</Label>
        <Input
          id="productId"
          value={formData.productId}
          onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
          placeholder="ID do produto (opcional)"
        />
      </div>

      {/* Seletor de Tags */}
      <TagSelector
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        maxTags={5}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Criando..." : "Criar Agendamento"}
        </Button>
      </div>
    </form>
  )
}
