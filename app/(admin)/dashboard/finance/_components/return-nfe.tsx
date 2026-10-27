"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeftRight, FileText, Loader2, ShoppingCart, Package } from "lucide-react";
import { formatter } from "@/lib/utils";
import { toast } from "sonner";

interface ProductFromXML {
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  ncm: string;
  cfop: string;
  unidade: string;
}

interface OriginalInvoiceData {
  chaveNfe: string;
  emitente: any;
  destinatario: any;
  produtos: ProductFromXML[];
  dataEmissao: string;
  valorTotal: number;
}

interface SelectedItem {
  codigo: string;
  quantidade: number;
  index: number;
}

export function ReturnNfeComponent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalInvoiceData, setOriginalInvoiceData] = useState<OriginalInvoiceData | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: SelectedItem }>({});
  const [emitenteIE, setEmitenteIE] = useState("");
  const [emitenteIsIsento, setEmitenteIsIsento] = useState(true);
  const [serie, setSerie] = useState("1");
  const [pesoTotal, setPesoTotal] = useState(""); // Novo campo

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".xml")) {
        setSelectedFile(file);
        setOriginalInvoiceData(null);
        setSelectedItems({});
      } else {
        toast.error("Por favor, selecione um arquivo XML válido");
        event.target.value = "";
      }
    }
  };

  const handleAnalyzeXml = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um arquivo XML");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("xmlFile", selectedFile);

      const response = await fetch("/api/invoices/return/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setOriginalInvoiceData(data.data);
        toast.success("XML analisado com sucesso! Selecione os itens.");
      } else {
        toast.error(data.message || "Erro ao analisar XML");
      }
    } catch (error) {
      console.error("Erro ao analisar XML:", error);
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelection = (product: ProductFromXML, isSelected: boolean, index: number) => {
    setSelectedItems((prev) => {
      const uniqueKey = `${product.codigo}_${index}`;
      const newSelected = { ...prev };
      if (isSelected) {
        newSelected[uniqueKey] = {
          codigo: product.codigo,
          quantidade: product.quantidade,
          index,
        };
      } else {
        delete newSelected[uniqueKey];
      }
      return newSelected;
    });
  };

  const handleQuantityChange = (uniqueKey: string, quantidade: number) => {
    const normalized = Number.isFinite(quantidade) ? Math.floor(quantidade) : 1;
    const safe = Math.max(1, normalized);
    setSelectedItems((prev) => ({
      ...prev,
      [uniqueKey]: {
        ...prev[uniqueKey],
        quantidade: safe,
      },
    }));
  };

  // Função genérica para gerar diferentes tipos de notas
  const handleGenerateInvoice = async (type: "devolucao" | "conserto") => {
    if (!originalInvoiceData || Object.keys(selectedItems).length === 0) {
      toast.error("Selecione pelo menos um item");
      return;
    }

    if (type === "conserto" && (!pesoTotal || Number(pesoTotal) <= 0)) {
      toast.error("Informe o peso total da remessa");
      return;
    }

    setIsGenerating(true);
    setShowProgressModal(true);
    setProgressValue(0);
    setProgressMessage("Iniciando geração da nota...");

    try {
      setProgressValue(30);
      setProgressMessage("Preparando dados...");

      await new Promise((resolve) => setTimeout(resolve, 500));

      const response = await fetch("/api/invoices/return/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalInvoiceData,
          selectedItems: Object.values(selectedItems),
          additionalData: {
            serie: Number(serie),
            regime_tributario_emitente: 1,
            inscricao_estadual_emitente: emitenteIsIsento
              ? "ISENTO"
              : emitenteIE.trim() || "ISENTO",
            ...(type === "conserto" && {
              cfop: "6915",
              natureza_operacao: "REMESSA PARA CONSERTO",
              cst: "090",
              meio_envio: "Correios",
              peso_total: Number(pesoTotal),
            }),
          },
          type,
        }),
      });

      setProgressValue(70);
      setProgressMessage("Processando resposta da SEFAZ...");

      const data = await response.json();

      if (data.success) {
        setProgressValue(100);
        setProgressMessage(
          type === "conserto"
            ? "Nota de remessa para conserto gerada com sucesso!"
            : "Nota de devolução gerada com sucesso!"
        );
        setTimeout(() => {
          setShowProgressModal(false);
          toast.success("Nota gerada com sucesso!");
          window.location.reload();
        }, 1500);
      } else {
        toast.error(data.error || "Erro ao gerar nota");
        setShowProgressModal(false);
      }
    } catch (error) {
      console.error("Erro ao gerar nota:", error);
      toast.error("Erro interno. Tente novamente.");
      setShowProgressModal(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotalReturn = () => {
    if (!originalInvoiceData) return 0;
    return Object.values(selectedItems).reduce((total, item) => {
      const product = originalInvoiceData.produtos[item.index];
      return product ? total + product.valorUnitario * item.quantidade : total;
    }, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Gerar Nota Fiscal
        </CardTitle>
        <CardDescription>
          Faça upload de um XML para gerar uma nota de devolução ou remessa para conserto.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload */}
        <div className="space-y-4">
          <Label htmlFor="returnXmlFile">Arquivo XML da NF-e Original</Label>
          <Input
            id="returnXmlFile"
            type="file"
            accept=".xml"
            onChange={handleFileSelect}
            disabled={isLoading}
          />
          {selectedFile && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>Arquivo: {selectedFile.name}</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleAnalyzeXml} disabled={!selectedFile || isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando XML...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Analisar XML
              </>
            )}
          </Button>
        </div>

        {originalInvoiceData && (
          <>
            {/* Configurações adicionais */}
            <div className="border-t pt-4 space-y-4">
              <Label>Série da Nota</Label>
              <Input
                type="number"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                min="1"
                max="999"
              />

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isento"
                  checked={emitenteIsIsento}
                  onCheckedChange={(checked) => {
                    setEmitenteIsIsento(checked as boolean);
                    if (checked) setEmitenteIE("");
                  }}
                />
                <Label htmlFor="isento">Emitente ISENTO de IE</Label>
              </div>

              {!emitenteIsIsento && (
                <Input
                  placeholder="Inscrição Estadual"
                  value={emitenteIE}
                  onChange={(e) => setEmitenteIE(e.target.value)}
                />
              )}

              {/* Peso total da remessa */}
              <div className="space-y-2">
                <Label htmlFor="pesoTotal">Peso Total da Remessa (kg)</Label>
                <Input
                  id="pesoTotal"
                  type="number"
                  value={pesoTotal}
                  onChange={(e) => setPesoTotal(e.target.value)}
                  placeholder="Ex: 12.5"
                />
              </div>
            </div>

            {/* Tabela */}
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {originalInvoiceData.produtos.map((p, i) => {
                    const k = `${p.codigo}_${i}`;
                    const selected = selectedItems[k];
                    return (
                      <TableRow key={k}>
                        <TableCell>
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={(c) => handleItemSelection(p, c as boolean, i)}
                          />
                        </TableCell>
                        <TableCell>{p.codigo}</TableCell>
                        <TableCell>{p.descricao}</TableCell>
                        <TableCell className="text-right">
                          {selected ? (
                            <Input
                              type="number"
                              min="1"
                              max={p.quantidade}
                              value={selected.quantidade}
                              onChange={(e) =>
                                handleQuantityChange(k, Number(e.target.value))
                              }
                              className="w-20 text-right"
                            />
                          ) : (
                            p.quantidade
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatter.format(p.valorUnitario)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Botões de ação */}
              {Object.keys(selectedItems).length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4">
                  <Button
                    onClick={() => handleGenerateInvoice("devolucao")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShoppingCart className="mr-2 h-4 w-4" />
                    )}
                    Gerar Nota de Devolução
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleGenerateInvoice("conserto")}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Package className="mr-2 h-4 w-4" />
                    )}
                    Gerar Remessa para Conserto
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* Modal de Progresso */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-muted/50 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-background border rounded-lg p-6 w-96 max-w-[90vw]">
            <div className="flex items-center space-x-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <h3 className="text-lg font-semibold">Gerando Nota</h3>
            </div>
            <Progress value={progressValue} className="w-full" />
            <p className="text-sm text-center mt-3">{progressMessage}</p>
            <div className="text-center text-xs mt-1">{progressValue}%</div>
          </div>
        </div>
      )}
    </Card>
  );
}
