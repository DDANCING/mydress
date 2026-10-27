import { useState } from "react";
import { Modal } from "@/components/modal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useReceiptModal } from "@/hooks/use-receipt-modal";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const ReceiptModal = () => {
  const receiptModal = useReceiptModal();
  const [isDualCopy, setIsDualCopy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const onGenerateReceipt = async () => {
    if (!receiptModal.paymentData?.id) {
      toast.error('Dados do pagamento não encontrados');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`/api/payments/${receiptModal.paymentData.id}/receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: receiptModal.paymentData.id,
          isDualCopy,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar recibo');
      }

      // Converter resposta para blob
      const blob = await response.blob();
      
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo-pagamento-${receiptModal.paymentData.id}.pdf`;
      
      // Fazer download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL
      window.URL.revokeObjectURL(url);

      toast.success('Recibo gerado com sucesso!');
      receiptModal.onClose();
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      toast.error('Erro ao gerar recibo. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      title="Gerar Recibo de Pagamento"
      description="Configure as opções para gerar o recibo de pagamento em PDF"
      isOpen={receiptModal.isOpen}
      onClose={receiptModal.onClose}
    >
      <div className="space-y-6">
        {/* Informações do Pagamento */}
        {receiptModal.paymentData && (
          <div className="p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm text-foreground">Detalhes do Pagamento</h4>
            <div className="text-sm text-muted-foreground">
              <p><strong>Valor:</strong> R$ {Number(receiptModal.paymentData.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p><strong>Método:</strong> {receiptModal.paymentData.paymentMethod?.name || receiptModal.paymentData.description}</p>
              <p><strong>Data:</strong> {new Date(receiptModal.paymentData.paymentDate).toLocaleDateString('pt-BR')}</p>
              {receiptModal.paymentData.description && (
                <p><strong>Descrição:</strong> {receiptModal.paymentData.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Opções do Recibo */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="dualCopy" 
              checked={isDualCopy}
              onCheckedChange={(checked) => setIsDualCopy(checked === true)}
            />
            <Label htmlFor="dualCopy" className="text-sm">
              2 vias? 
            </Label>
          </div>
        </div>

        {/* Botões */}
        <div className="flex items-center gap-2 pt-4">
          <Button
            variant="outline"
            onClick={receiptModal.onClose}
            disabled={isGenerating}
          >
            Cancelar
          </Button>
          <Button
            onClick={onGenerateReceipt}
            disabled={isGenerating}
            className="flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Gerar Recibo PDF
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
