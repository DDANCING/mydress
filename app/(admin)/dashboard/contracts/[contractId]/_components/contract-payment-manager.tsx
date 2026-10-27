"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, CreditCard, Copy, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatter } from "@/lib/utils";
import { PaymentMethod } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { useReceiptModal } from "@/hooks/use-receipt-modal";

// Função utilitária para traduzir métodos de pagamento
const translatePaymentMethod = (name: string) => {
  switch (name?.toLowerCase()) {
    case "pix":
      return "PIX";
    case "credit":
      return "Cartão de Crédito";
    case "debit":
      return "Cartão de Débito";
    case "boleto":
      return "Boleto";
    case "check":
      return "Cheque";
    case "money":
      return "Dinheiro";
    case "other":
      return "Outros";
    default:
      return name;
  }
};

interface ContractPayment {
  id?: string;
  paymentMethodId: string;
  amount: number;
  paymentDate: Date;
  description?: string;
  installmentNumber?: number;
  dueDate?: Date;
  isPaid: boolean;
}

interface ContractPaymentManagerProps {
  paymentMethods: PaymentMethod[];
  contractPayments: ContractPayment[];
  onPaymentsChange: (payments: ContractPayment[]) => void;
  totalAmount: number | string;
  discountedTotal?: number; // Valor total com desconto aplicado
  loading?: boolean;
  onPaymentAdded?: (payment: ContractPayment) => void; // Callback para quando um pagamento é adicionado
}

export function ContractPaymentManager({
  paymentMethods,
  contractPayments,
  onPaymentsChange,
  totalAmount,
  discountedTotal,
  loading = false,
  onPaymentAdded,
}: ContractPaymentManagerProps) {
  const receiptModal = useReceiptModal();
  
  // Estado para controlar o valor do input de multiplicação por índice
  const [multiQtyMap, setMultiQtyMap] = useState<{ [key: number]: number }>({});
  const [newPayment, setNewPayment] = useState<Partial<ContractPayment>>({
    paymentMethodId: '',
    amount: 0,
    paymentDate: new Date(),
    description: '',
    installmentNumber: contractPayments.length + 1,
    isPaid: true,
  });

  const addPayment = () => {
    if (!newPayment.paymentMethodId || !newPayment.amount || Number(newPayment.amount) <= 0) {
      return;
    }

    const payment: ContractPayment = {
      paymentMethodId: newPayment.paymentMethodId,
      amount: Number(newPayment.amount),
      paymentDate: newPayment.paymentDate || new Date(),
      description: newPayment.description || '',
      installmentNumber: newPayment.installmentNumber || contractPayments.length + 1,
      dueDate: newPayment.dueDate,
      isPaid: newPayment.isPaid || true,
    };

    onPaymentsChange([...contractPayments, payment]);
    
    // Callback para notificar que um pagamento foi adicionado
    if (onPaymentAdded) {
      onPaymentAdded(payment);
    }
    
    // Reset form
    setNewPayment({
      paymentMethodId: '',
      amount: 0,
      paymentDate: new Date(),
      description: '',
      installmentNumber: contractPayments.length + 2,
      isPaid: true,
    });
  };

  const removePayment = (index: number) => {
    const updatedPayments = contractPayments.filter((_, i) => i !== index);
    onPaymentsChange(updatedPayments);
  };

  const updatePayment = (index: number, field: keyof ContractPayment, value: any) => {
    const updatedPayments = contractPayments.map((payment, i) => 
      i === index ? { ...payment, [field]: value } : payment
    );
    onPaymentsChange(updatedPayments);
  };

  // Multiplica o pagamento selecionado em N parcelas mensais
  const multiplyPayment = (index: number, quantity: number) => {
    if (quantity < 1 || quantity > 12) return;
    const base = contractPayments[index];
    if (!base) return;
    const newPayments: ContractPayment[] = [];
    // Descobre o maior número de parcela já existente para esse método
    let lastInstallment = Math.max(
      ...contractPayments
        .filter(p => p.paymentMethodId === base.paymentMethodId)
        .map(p => p.installmentNumber || 1),
      base.installmentNumber || 1
    );
    // A primeira duplicada já pula um mês
    let startDate = base.dueDate ? new Date(base.dueDate) : new Date();
    for (let i = 1; i <= quantity; i++) {
      let nextDueDate = new Date(startDate);
      nextDueDate.setMonth(nextDueDate.getMonth() + i); // i meses à frente da original
      newPayments.push({
        ...base,
        id: undefined,
        installmentNumber: lastInstallment + i,
        dueDate: nextDueDate,
        paymentDate: nextDueDate,
        isPaid: false,
      });
    }
    onPaymentsChange([
      ...contractPayments,
      ...newPayments
    ]);
  };

  const totalPaid = contractPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalAmountNumber = Number(totalAmount) || 0;
  const effectiveTotal = discountedTotal || totalAmountNumber; // Use desconto se disponível
  const remainingAmount = effectiveTotal - totalPaid;

  const getPaymentMethodName = (id: string) => {
    const method = paymentMethods.find(method => method.id === id);
    if (!method) return 'Método não encontrado';
    
    return translatePaymentMethod(method.name);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamentos do Contrato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo Financeiro */}
        <div className="grid md:grid-cols-4 gap-4 p-4 bg-muted/60 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-lg font-semibold">{formatter.format(totalAmountNumber)}</p>
          </div>
          {discountedTotal && discountedTotal !== totalAmountNumber && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total com Desconto</p>
              <p className="text-lg font-semibold text-sky-600">{formatter.format(discountedTotal)}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Pago</p>
            <p className="text-lg font-semibold text-emerald-600">{formatter.format(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Restante</p>
            <p className={cn(
              "text-lg font-semibold",
              remainingAmount > 0 ? "text-rose-600" : "text-emerald-600"
            )}>
              {formatter.format(remainingAmount)}
            </p>
          </div>
        </div>

        {/* Lista de Pagamentos Existentes */}
        {contractPayments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Pagamentos Registrados</h4>
            {contractPayments.map((payment, index) => {
              const multiQty = multiQtyMap[index] ?? 1;
              return (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="font-medium">{getPaymentMethodName(payment.paymentMethodId)}</p>
                    <p className="text-muted-foreground">
                      {payment.installmentNumber}ª parcela
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{formatter.format(payment.amount)}</p>
                    <p className="text-muted-foreground">
                      {format(payment.paymentDate, "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`isPaid-switch-${index}`}
                        checked={payment.isPaid}
                        onCheckedChange={(checked) => updatePayment(index, "isPaid", checked)}
                        disabled={loading}
                      />
                      <Label htmlFor={`isPaid-switch-${index}`} className={cn("font-medium", payment.isPaid ? "text-green-600" : "text-red-600")}>{payment.isPaid ? "Pago" : "Pendente"}</Label>
                    </div>
                    {payment.dueDate && (
                      <p className="text-muted-foreground">
                        Vence: {format(payment.dueDate, "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-muted-foreground">{payment.description}</p>
                  </div>
                  </div>
                  <div className="flex flex-col gap-1 items-center">
                    <div className="grid sm:flex  gap-1">
                      {payment.isPaid && payment.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => receiptModal.onOpen({
                            id: payment.id,
                            amount: payment.amount,
                            paymentDate: payment.paymentDate,
                            description: payment.description,
                            paymentMethod: paymentMethods.find(method => method.id === payment.paymentMethodId)
                          })}
                          disabled={loading}
                          title="Gerar recibo de pagamento"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex flex-col-reverse">
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={multiQty}
                        onChange={e => {
                          const val = Math.max(1, Math.min(12, Number(e.target.value)));
                          setMultiQtyMap(prev => ({ ...prev, [index]: val }));
                        }}
                        className="w-10 border rounded text-center text-xs"
                        disabled={loading}
                        title="Quantidade de parcelas"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => multiplyPayment(index, multiQty)}
                        disabled={loading}
                        title="Multiplicar pagamento em parcelas mensais"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePayment(index)}
                        disabled={loading}
                        title="Remover pagamento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulário para Adicionar Novo Pagamento */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Adicionar Novo Pagamento</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2">Método de Pagamento</Label>
              <Select
               
                value={newPayment.paymentMethodId}
                onValueChange={(value) => setNewPayment({ ...newPayment, paymentMethodId: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o método" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {translatePaymentMethod(method.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2" >Valor</Label>
              <Input
                type="amount"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>

            <div>
              <Label className="mb-2">Data do Pagamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newPayment.paymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newPayment.paymentDate ? (
                      format(newPayment.paymentDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newPayment.paymentDate}
                    onSelect={(date) => setNewPayment({ ...newPayment, paymentDate: date || new Date() })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-2">Número da Parcela</Label>
              <Input
                type="number"
                value={newPayment.installmentNumber}
                onChange={(e) => setNewPayment({ ...newPayment, installmentNumber: Number(e.target.value) })}
                placeholder="1"
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="mb-2">Descrição</Label>
              <Textarea
                value={newPayment.description}
                onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                placeholder="Descrição do pagamento..."
                className="resize-none"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={addPayment}
            disabled={loading || !newPayment.paymentMethodId || !newPayment.amount || Number(newPayment.amount) <= 0}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pagamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
