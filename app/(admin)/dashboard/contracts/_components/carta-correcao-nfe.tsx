"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileEdit, Loader2 } from "lucide-react";

interface CartaCorrecaoNfeProps {
  contractId: string;
}

export function CartaCorrecaoNfe({ contractId }: CartaCorrecaoNfeProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [correcao, setCorrecao] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async () => {
    if (!correcao.trim()) {
      toast.error("Correção é obrigatória");
      return;
    }

    if (correcao.length < 15 || correcao.length > 1000) {
      toast.error("Correção deve ter entre 15 e 1000 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = { correcao };
      if (dataEvento) {
        payload.data_evento = dataEvento;
      }

      const response = await fetch(`/api/invoices/${contractId}/carta-correcao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Carta de correção enviada com sucesso. Número: ${data.numero_carta_correcao}`);
        setIsOpen(false);
        setCorrecao("");
        setDataEvento("");
      } else {
        throw new Error(data.error || 'Erro ao enviar carta de correção');
      }
    } catch (error: any) {
      console.error('Erro ao enviar carta de correção:', error);
      toast.error(error.message || "Erro ao enviar carta de correção");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FileEdit className="h-4 w-4 " />
          Carta de Correção
        </Button> 
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Carta de Correção da NFe</AlertDialogTitle>
          <AlertDialogDescription>
            Envie uma carta de correção para corrigir informações da NFe já emitida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="correcao">
              Correção <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="correcao"
              placeholder="Descreva a correção a ser feita (mínimo 15 caracteres)"
              value={correcao}
              onChange={(e) => setCorrecao(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-sm text-muted-foreground">
              {correcao.length}/1000 caracteres
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataEvento">
              Data do Evento (opcional)
            </Label>
            <Input
              id="dataEvento"
              type="datetime-local"
              value={dataEvento}
              onChange={(e) => setDataEvento(e.target.value)}
              placeholder="YYYY-MM-DDTHH:MM:SS"
            />
            <p className="text-xs text-muted-foreground">
              Se não informado, será utilizada a data/hora atual
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleSubmit}
            disabled={isLoading || !correcao.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Correção"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
