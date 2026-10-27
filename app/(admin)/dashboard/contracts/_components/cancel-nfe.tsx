"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ban, Loader2 } from "lucide-react";

interface CancelNfeProps {
  contractId: string;
}

export function CancelNfe({ contractId }: CancelNfeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleCancel = async () => {
    if (!justificativa.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    if (justificativa.length < 15 || justificativa.length > 255) {
      toast.error("Justificativa deve ter entre 15 e 255 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/invoices/${contractId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ justificativa }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("NFe cancelada com sucesso");
        setIsOpen(false);
        setJustificativa("");
        // Recarregar a página para atualizar o status
        window.location.reload();
      } else {
        throw new Error(data.error || 'Erro ao cancelar NFe');
      }
    } catch (error: any) {
      console.error('Erro ao cancelar NFe:', error);
      toast.error(error.message || "Erro ao cancelar NFe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-rose-500" size="sm">
          <Ban className="h-4 w-4 mr-2" />
          Cancelar NFe
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar NFe</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação irá cancelar a NFe permanentemente. Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa para o cancelamento <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Digite a justificativa para o cancelamento (mínimo 15 caracteres)"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={4}
              maxLength={255}
            />
            <p className="text-sm text-muted-foreground">
              {justificativa.length}/255 caracteres
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleCancel}
            disabled={isLoading || !justificativa.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelando...
              </>
            ) : (
              "Cancelar NFe"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
