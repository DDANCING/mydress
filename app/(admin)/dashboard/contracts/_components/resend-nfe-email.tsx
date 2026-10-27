"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Mail } from "lucide-react";
import axios from "axios";

interface ResendNfeEmailProps {
  contractId: string;
  haveNfe?: boolean;
  buyerEmail?: string;
}

export const ResendNfeEmail: React.FC<ResendNfeEmailProps> = ({ 
  contractId, 
  haveNfe, 
  buyerEmail 
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");

  // Inicializar com o email do comprador se disponível
  const handleOpenModal = () => {
    if (buyerEmail && emails.length === 0) {
      setEmails([buyerEmail]);
    }
    setOpen(true);
  };

  const addEmail = () => {
    if (newEmail.trim()) {
      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail.trim())) {
        toast.error("Formato de email inválido");
        return;
      }

      // Verificar se já existe
      if (emails.includes(newEmail.trim())) {
        toast.error("Este email já está na lista");
        return;
      }

      // Verificar limite máximo
      if (emails.length >= 10) {
        toast.error("Máximo de 10 emails por vez");
        return;
      }

      setEmails([...emails, newEmail.trim()]);
      setNewEmail("");
    }
  };

  const removeEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const handleResendEmail = async () => {
    if (emails.length === 0) {
      toast.error("Adicione pelo menos um email");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/invoices/${contractId}/email`, {
        emails: emails
      });

      if (response.data.success) {
        toast.success(`NFe reenviada com sucesso para ${emails.length} email(s)`);
        setOpen(false);
        setEmails([]);
        setNewEmail("");
      } else {
        toast.error(response.data.error || "Erro ao reenviar email");
      }
    } catch (error: any) {
      console.error("Erro ao reenviar email da NFe:", error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Erro ao reenviar email da NFe");
      }
    } finally {
      setLoading(false);
    }
  };

  // Não mostrar o botão se não tem NFe
  if (!haveNfe) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenModal}
        
        >
          <Mail className="h-4 w-4" />
          Reenviar Email
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reenviar Email da NFe</DialogTitle>
          <DialogDescription>
            Envie a nota fiscal por email para destinatários adicionais.
          </DialogDescription>
          {contractId && (
            <div className="mt-2">
              <span className="text-sm text-muted-foreground">
                NFe: <span className="font-mono">{contractId}</span>
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Input para adicionar novos emails */}
          <div className="space-y-2">
            <Label htmlFor="email">Adicionar Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <Button
                type="button"
                size="sm"
                onClick={addEmail}
                disabled={loading || emails.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de emails */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Emails para envio ({emails.length}/10)</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {emails.map((email, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <span className="text-sm font-mono">{email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmail(index)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emails.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum email adicionado</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleResendEmail}
            disabled={loading || emails.length === 0}
          >
            {loading ? "Enviando..." : `Enviar para ${emails.length} email(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
