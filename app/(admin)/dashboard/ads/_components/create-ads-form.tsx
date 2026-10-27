"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMarketingExpense } from "@/actions/marketing-expense";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-sucess";

const PLATFORMS = [
  "Google Ads",
  "Facebook Ads",
  "Instagram Ads",
  "TikTok Ads",
  "LinkedIn Ads",
  "YouTube Ads",
  "Twitter Ads",
  "WhatsApp Business",
  "Outro",
];

export function CreateAdsForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    duration: "",
    amount: "",
    platform: "",
    campaign: "",
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      // Validação
      if (!formData.duration || parseInt(formData.duration) < 1) {
        throw new Error("Duração deve ser pelo menos 1 dia");
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error("Valor deve ser maior que 0");
      }

      if (!formData.platform) {
        throw new Error("Plataforma é obrigatória");
      }

      const result = await createMarketingExpense({
        duration: parseInt(formData.duration),
        amount: parseFloat(formData.amount),
        platform: formData.platform,
        campaign: formData.campaign || undefined,
      });

      if (result.success) {
        setSuccess("Publicidade adicionada com sucesso!");
        setFormData({
          duration: "",
          amount: "",
          platform: "",
          campaign: "",
        });

        setTimeout(() => {
          router.push("/dashboard/ads");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar publicidade");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar Nova Publicidade</CardTitle>
        <CardDescription>Preencha os dados da sua campanha de publicidade</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (dias) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="Ex: 30"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Número de dias que a publicidade vai rodar
              </p>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 500,00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                Valor total a ser investido
              </p>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) =>
                setFormData({ ...formData, platform: value })
              }
              disabled={isPending}
            >
              <SelectTrigger id="platform">
                <SelectValue placeholder="Selecione uma plataforma" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Onde será executada a publicidade
            </p>
          </div>

          {/* Campaign */}
          <div className="space-y-2">
            <Label htmlFor="campaign">Nome da Campanha (opcional)</Label>
            <Input
              id="campaign"
              type="text"
              placeholder="Ex: Promoção de Verão"
              value={formData.campaign}
              onChange={(e) =>
                setFormData({ ...formData, campaign: e.target.value })
              }
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Identifique sua campanha para melhor controle
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && <FormError message={error} />}
          {success && <FormSuccess message={success} />}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Adicionando..." : "Adicionar Publicidade"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
