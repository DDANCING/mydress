"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";

// Tipos para o componente
interface Produto {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

interface EntryInvoiceFormData {
  supplier: {
    document: string;
    name: string;
    fantasia?: string;
    email?: string;
    phone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
    inscricaoEstadual?: string;
  };
  destinatario: {
    document: string;
    name: string;
    fantasia?: string;
    email?: string;
    phone?: string;
    endereco: {
      logradouro: string;
      numero: string;
      bairro: string;
      municipio: string;
      uf: string;
      cep: string;
    };
    inscricaoEstadual?: string;
    regimeTributario?: number;
  };
  produtos: Produto[];
  operationType: 'COMPRA_MERCADORIA' | 'COMPRA_PRODUCAO' | 'COMPRA_USO_CONSUMO' | 'COMPRA_ATIVO_IMOBILIZADO' | 'TRANSFERENCIA' | 'DEVOLUCAO_COMPRA';
  serie?: number;
  observacoes?: string;
}

export default function EntryInvoiceForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<EntryInvoiceFormData>({
    supplier: {
      document: '',
      name: '',
      fantasia: '',
      email: '',
      phone: '',
      endereco: {
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        uf: '',
        cep: '',
      },
      inscricaoEstadual: '',
    },
    destinatario: {
      document: '',
      name: '',
      fantasia: '',
      email: '',
      phone: '',
      endereco: {
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: '',
        uf: '',
        cep: '',
      },
      inscricaoEstadual: '',
      regimeTributario: 1,
    },
    produtos: [{
      codigo: '',
      descricao: '',
      ncm: '',
      cfop: '',
      unidade: 'UN',
      quantidade: 1,
      valorUnitario: 0,
      valorTotal: 0,
    }],
    operationType: 'COMPRA_MERCADORIA',
    serie: 1,
    observacoes: '',
  });

  // Função para adicionar novo produto
  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      produtos: [
        ...prev.produtos,
        {
          codigo: '',
          descricao: '',
          ncm: '',
          cfop: '',
          unidade: 'UN',
          quantidade: 1,
          valorUnitario: 0,
          valorTotal: 0,
        }
      ]
    }));
  };

  // Função para remover produto
  const removeProduct = (index: number) => {
    setFormData(prev => ({
      ...prev,
      produtos: prev.produtos.filter((_, i) => i !== index)
    }));
  };

  // Função para calcular valor total do produto
  const calculateProductTotal = (index: number, quantidade: number, valorUnitario: number) => {
    const total = quantidade * valorUnitario;
    setFormData(prev => {
      const newProdutos = [...prev.produtos];
      newProdutos[index] = {
        ...newProdutos[index],
        quantidade,
        valorUnitario,
        valorTotal: total
      };
      return {
        ...prev,
        produtos: newProdutos
      };
    });
  };

  // Função para criar nota de entrada
  const createEntryInvoice = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/invoices/entry/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Nota de entrada criada com sucesso!', {
          description: `Número: ${result.invoiceNumber} - Status: ${result.status === 'processing' ? 'Processando' : 'Concluída'}`
        });
        
        // Atualizar a interface automaticamente após sucesso
        router.refresh();
        
        // Opcional: Resetar o formulário ou redirecionar
        // resetForm();
        // router.push('/admin/dashboard/finance/invoices');
        
      } else {
        const errorMessage = result.error || result.message || 'Erro ao criar nota de entrada';
        toast.error('Erro ao criar nota de entrada', {
          description: errorMessage
        });
        
        // Log de debug em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
          console.error('Erro detalhado:', result);
        }
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      toast.error('Erro interno', {
        description: 'Falha na comunicação com o servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para editar uma invoice existente
  const updateEntryInvoice = async (invoiceId: string, updateData: Partial<EntryInvoiceFormData>) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Nota de entrada atualizada com sucesso!');
        
        // Atualizar a interface automaticamente após sucesso
        router.refresh();
        
      } else {
        toast.error('Erro ao atualizar nota de entrada', {
          description: result.error || result.message || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      toast.error('Erro interno', {
        description: 'Falha na comunicação com o servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para deletar uma invoice
  const deleteEntryInvoice = async (invoiceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota de entrada?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Nota de entrada deletada com sucesso!');
        
        // Atualizar a interface automaticamente após sucesso
        router.refresh();
        
      } else {
        toast.error('Erro ao deletar nota de entrada', {
          description: result.error || result.message || 'Erro desconhecido'
        });
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      toast.error('Erro interno', {
        description: 'Falha na comunicação com o servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Nota de Entrada</CardTitle>
          <CardDescription>
            Preencha os dados para gerar uma nova nota fiscal de entrada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do Fornecedor */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dados do Fornecedor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier-document">CNPJ/CPF</Label>
                <Input
                  id="supplier-document"
                  value={formData.supplier.document}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier, document: e.target.value }
                  }))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <Label htmlFor="supplier-name">Nome/Razão Social</Label>
                <Input
                  id="supplier-name"
                  value={formData.supplier.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    supplier: { ...prev.supplier, name: e.target.value }
                  }))}
                  placeholder="Nome do fornecedor"
                />
              </div>
              {/* Adicionar mais campos conforme necessário */}
            </div>
          </div>

          {/* Lista de Produtos */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Produtos</h3>
              <Button onClick={addProduct} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </div>
            
            {formData.produtos.map((produto, index) => (
              <Card key={index} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Código</Label>
                    <Input
                      value={produto.codigo}
                      onChange={(e) => {
                        const newProdutos = [...formData.produtos];
                        newProdutos[index] = { ...newProdutos[index], codigo: e.target.value };
                        setFormData(prev => ({ ...prev, produtos: newProdutos }));
                      }}
                      placeholder="Código do produto"
                    />
                  </div>
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={produto.quantidade}
                      onChange={(e) => {
                        const quantidade = Number(e.target.value);
                        calculateProductTotal(index, quantidade, produto.valorUnitario);
                      }}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Valor Unitário</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={produto.valorUnitario}
                      onChange={(e) => {
                        const valorUnitario = Number(e.target.value);
                        calculateProductTotal(index, produto.quantidade, valorUnitario);
                      }}
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProduct(index)}
                      disabled={formData.produtos.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Tipo de Operação */}
          <div>
            <Label htmlFor="operation-type">Tipo de Operação</Label>
            <Select
              value={formData.operationType}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, operationType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de operação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMPRA_MERCADORIA">Compra para Comercialização</SelectItem>
                <SelectItem value="COMPRA_PRODUCAO">Compra para Industrialização</SelectItem>
                <SelectItem value="COMPRA_USO_CONSUMO">Compra para Uso e Consumo</SelectItem>
                <SelectItem value="COMPRA_ATIVO_IMOBILIZADO">Compra de Ativo Imobilizado</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                <SelectItem value="DEVOLUCAO_COMPRA">Devolução de Compra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Informações adicionais sobre a nota fiscal"
              rows={3}
            />
          </div>

          {/* Botão de Envio */}
          <Button 
            onClick={createEntryInvoice} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Nota de Entrada...
              </>
            ) : (
              'Gerar Nota de Entrada'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
